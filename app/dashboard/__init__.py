# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import random

from flask import (
    Flask,
    Markup,
    abort,
    render_template,
    request,
)
from flask_wtf.csrf import (
    CsrfProtect,
    generate_csrf,
    validate_csrf,
)

from utils.backend import (
    ajax_batch_post,
    ajax_bisect,
    ajax_count_get,
    ajax_get,
    is_mobile_browser,
    is_old_browser,
    today_date,
)


def generate_csrf_token():
    """Custom function for tokens generation.

    It returns a CSRF token with a random time limit between 20 and
    50 seconds.

    :return A random CSRF token.
    """
    return generate_csrf(time_limit=random.randint(20, 50))


DEFAULT_CONFIG_FILE = "/etc/linaro/kernelci-frontend.cfg"

# Name of the environment variable that will be lookep up for app
# configuration parameters.
APP_ENVVAR = "FLASK_SETTINGS"

app = Flask("kernelci-frontend")

app.root_path = os.path.abspath(os.path.dirname(__file__))

app.config.from_object("dashboard.default_settings")
if os.path.isfile(DEFAULT_CONFIG_FILE):
    app.config.from_pyfile(DEFAULT_CONFIG_FILE)

if os.environ.get(APP_ENVVAR):
    app.config.from_envvar(APP_ENVVAR)

CsrfProtect(app)

# Use the custom CSRF token generation.
app.jinja_env.globals["csrf_token_r"] = generate_csrf_token

# Initialize the app routes.
# The app context here is needed since we are using variables defined in the
# config files and we need to access them.
with app.app_context():
    import dashboard.utils.route as route
    route.init(app)


@app.context_processor
def inject_variables():
    return dict(
        analytics=app.config.get("GOOGLE_ANALYTICS_ID"),
        is_mobile=is_mobile_browser(request),
        is_old_browser=is_old_browser(request),
        server_date=today_date()
    )


@app.errorhandler(404)
def page_not_found(e):
    path = os.path.join(app.root_path, "static", "html", "404-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("404.html", page_content=page_content), 404


@app.errorhandler(500)
def internal_server_error(e):
    path = os.path.join(app.root_path, "static", "html", "500-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("500.html", page_content=page_content), 500


@app.errorhandler(400)
def bad_request_error(e):
    path = os.path.join(app.root_path, "static", "html", "400-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("400.html", page_content=page_content), 400


@app.route("/static/js/<path:path>")
def static_js_proxy(path):
    return app.send_static_file(os.path.join("js", path))


@app.route("/static/html/<path:path>")
def static_html_proxy(path):
    return app.send_static_file(os.path.join("html", path))


@app.route("/_ajax/job")
def ajax_job():
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        return ajax_get(request, app.config.get("JOB_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/defconf")
def ajax_defconf():
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        return ajax_get(request, app.config.get("DEFCONFIG_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/boot")
def ajax_boot():
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        return ajax_get(request, app.config.get("BOOT_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/count")
@app.route("/_ajax/count/<string:collection>")
def ajax_count(collection=None):
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        return ajax_count_get(
            request, app.config.get("COUNT_API_ENDPOINT"),
            collection
        )
    else:
        abort(400)


@app.route("/_ajax/batch", methods=("POST", "OPTIONS"))
def ajax_batch():
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        if request.data:
            return ajax_batch_post(
                request, app.config.get("BATCH_API_ENDPOINT")
            )
        else:
            abort(400)
    else:
        abort(400)


@app.route("/_ajax/bisect/<string:collection>/<string:doc_id>")
def ajax_bisect_call(collection=None, doc_id=None):
    if validate_csrf(request.headers.get("X-Csrftoken", None)):
        if all([collection, doc_id]):
            return ajax_bisect(
                request, collection, doc_id,
                app.config.get("BISECT_API_ENDPOINT")
            )
        else:
            abort(400)
    else:
        abort(400)
