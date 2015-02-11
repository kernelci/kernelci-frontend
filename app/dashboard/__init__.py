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
from flask.ext.cache import Cache

__version__ = "2015.2"
__versionfull__ = __version__

CSRF_TOKEN_H = "X-Csrftoken"

DEFAULT_CONFIG_FILE = "/etc/linaro/kernelci-frontend.cfg"
# Name of the environment variable that will be lookep up for app
# configuration parameters.
APP_ENVVAR = "FLASK_SETTINGS"


def generate_csrf_token():
    """Custom function for tokens generation.

    It returns a CSRF token with a random time limit between 30 and
    120 seconds.

    :return A random CSRF token.
    """
    return generate_csrf(time_limit=random.randint(30, 120))


app = Flask("kernelci-frontend")

app.root_path = os.path.abspath(os.path.dirname(__file__))

app.config.from_object("dashboard.default_settings")
if os.path.isfile(DEFAULT_CONFIG_FILE):
    app.config.from_pyfile(DEFAULT_CONFIG_FILE)

if os.environ.get(APP_ENVVAR):
    app.config.from_envvar(APP_ENVVAR)

# Save the function.
app_conf_get = app.config.get

app.cache = Cache(app)
app.csrf = CsrfProtect(app)

# Use the custom CSRF token generation.
app.jinja_env.globals["csrf_token_r"] = generate_csrf_token

# Initialize the app routes, config and other necessary stuff.
# The app context here is needed since we are using variables defined in the
# config files and we need to access them.
with app.app_context():
    import utils.backend as backend
    import dashboard.utils.route as route

    route.init()


@app.context_processor
def inject_variables():
    return dict(
        analytics=app_conf_get("GOOGLE_ANALYTICS_ID"),
        is_mobile=backend.is_mobile_browser(request),
        is_old_browser=backend.is_old_browser(request),
        server_date=backend.today_date(),
        front_version=__version__
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
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(request, app_conf_get("JOB_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/defconf")
def ajax_defconf():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(
            request, app_conf_get("DEFCONFIG_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/boot")
def ajax_boot():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(request, app_conf_get("BOOT_API_ENDPOINT"))
    else:
        abort(400)


@app.route("/_ajax/count")
@app.route("/_ajax/count/<string:collection>")
def ajax_count(collection=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        # Cache for 1 hour.
        return backend.ajax_count_get(
            request, app_conf_get("COUNT_API_ENDPOINT"),
            collection,
            timeout=60*60
        )
    else:
        abort(400)


@app.route("/_ajax/batch", methods=("POST", "OPTIONS"))
def ajax_batch():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        if request.data:
            return backend.ajax_batch_post(
                request,
                app_conf_get("BATCH_API_ENDPOINT"),
                timeout=1080
            )
        else:
            abort(400)
    else:
        abort(400)


@app.route("/_ajax/bisect")
@app.route("/_ajax/bisect/<string:doc_id>")
def ajax_bisect_call(doc_id=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        # Cache bisect data for 2 hours.
        return backend.ajax_bisect(
            request,
            doc_id,
            app_conf_get("BISECT_API_ENDPOINT"),
            timeout=60*60*2
        )
    else:
        abort(400)


@app.route("/_ajax/version", methods=["GET"])
def ajax_version():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        # Cache the version for two days, hard for it to change that often.
        return backend.ajax_get(
            request,
            app_conf_get("VERSION_API_ENDPOINT"),
            timeout=60*60*24*2)
    else:
        abort(400)
