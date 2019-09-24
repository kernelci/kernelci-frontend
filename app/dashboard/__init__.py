# Copyright (C) Linaro Limited 2014,2015,2016,2017,2019
# Author: Matt Hart <matthew.hart@linaro.org>
# Author: Milo Casagrande <milo.casagrande@linaro.org>
#
# Copyright (C) Collabora Limited 2018
# Author: Ana Guerrero Lopez <ana.guerrero@collabora.com>
# Author: Guillaume Tucker <guillaume.tucker@collabora.com>
#
# Copyright (C) Foundries.io 2017
# Author: Milo Casagrande <milo@opensourcefoundries.com>
#
# Copyright (C) Baylibre 2017
# Author: lollivier <lollivier@baylibre.com>
#
# This program is free software; you can redistribute it and/or modify it under
# the terms of the GNU Lesser General Public License as published by the Free
# Software Foundation; either version 2.1 of the License, or (at your option)
# any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
# details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this library; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA

"""Main module."""

import os
import random

from flask import (
    Flask,
    Markup,
    abort,
    render_template,
    request
)
from flask_wtf.csrf import (
    CsrfProtect,
    generate_csrf,
    validate_csrf,
)
from flask_cache import Cache
from werkzeug.routing import BaseConverter

__version__ = "2018.9"
__versionfull__ = __version__

CSRF_TOKEN_H = "X-Csrftoken"

DEFAULT_CONFIG_FILE = "/etc/linaro/kernelci-frontend.cfg"
# Name of the environment variable that will be lookep up for app
# configuration parameters.
APP_ENVVAR = "FLASK_SETTINGS"


class RegexConverter(BaseConverter):
    """A regular expression URL converter."""
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


def generate_csrf_token():
    """Custom function for tokens generation.

    It returns a CSRF token with a random time limit between (60 * 10) and
    (60 * 20) seconds.

    :return A random CSRF token.
    """
    return generate_csrf(time_limit=random.randint(60 * 10, 60 * 20))


# pylint: disable=invalid-name
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

# Add the custom regular expression converter.
app.url_map.converters["regex"] = RegexConverter

# Initialize the app routes, config and other necessary stuff.
# The app context here is needed since we are using variables defined in the
# config files and we need to access them.
with app.app_context():
    import dashboard.utils.backend as backend
    import dashboard.utils.route as route

    route.init()


def handle_ajax_get(req, endpoint, timeout=None):
    if validate_csrf(req.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(req, endpoint, timeout=timeout)
    else:
        abort(403)


@app.context_processor
def inject_variables():
    """Inject some often used variables."""
    return dict(
        analytics=app_conf_get("GOOGLE_ANALYTICS_ID"),
        is_mobile=backend.is_mobile_browser(request),
        is_old_browser=backend.is_old_browser(request),
        server_date=backend.today_date(),
        front_version=__version__,
        back_version=backend.get_version(),
        info_email=app_conf_get("INFO_EMAIL", "info@example.org")
    )


# pylint: disable=unused-argument
@app.errorhandler(404)
def page_not_found(e):
    """Handle 404."""
    path = os.path.join(app.root_path, "static", "html", "404-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("404.html", page_content=page_content), 404


@app.errorhandler(500)
def internal_server_error(e):
    """Handle 500."""
    path = os.path.join(app.root_path, "static", "html", "500-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("500.html", page_content=page_content), 500


@app.errorhandler(400)
def bad_request_error(e):
    """Handle 400."""
    path = os.path.join(app.root_path, "static", "html", "400-content.html")
    page_content = ""

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template("400.html", page_content=page_content), 400


# pylint: disable=missing-docstring
@app.route("/static/js/<path:path>")
def static_js_proxy(path):
    return app.send_static_file(os.path.join("js", path))


@app.route("/static/html/<path:path>")
def static_html_proxy(path):
    return app.send_static_file(os.path.join("html", path))


@app.route(
    "/_ajax/job",
    defaults={"api": "JOB_API_ENDPOINT"}, methods=["GET"])
@app.route(
    "/_ajax/build",
    defaults={"api": "BUILD_API_ENDPOINT"}, methods=["GET"])
@app.route(
    "/_ajax/boot",
    defaults={"api": "BOOT_API_ENDPOINT"}, methods=["GET"])
@app.route(
    "/_ajax/test/group",
    defaults={"api": "TEST_GROUP_API_ENDPOINT"}, methods=["GET"])
@app.route(
    "/_ajax/test/case",
    defaults={"api": "TEST_CASE_API_ENDPOINT"}, methods=["GET"])
def ajax_get(api):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(request, app_conf_get(api), timeout=60 * 20)
    else:
        abort(403)


@app.route("/_ajax/boot/regressions")
def ajax_boot_regressions():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(
            request, app_conf_get("BOOT_REGRESSIONS_API_ENDPOINT"))
    else:
        abort(403)


@app.route("/_ajax/count")
@app.route("/_ajax/count/<string:collection>")
def ajax_count(collection=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_count_get(
            request, app_conf_get("COUNT_API_ENDPOINT"),
            collection,
            timeout=60 * 60
        )
    else:
        abort(403)


@app.route("/_ajax/batch", methods=("POST", "OPTIONS"))
def ajax_batch():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        if request.data:
            return backend.ajax_batch_post(
                request, app_conf_get("BATCH_API_ENDPOINT"), timeout=60 * 20)
        else:
            abort(400)
    else:
        abort(403)


@app.route("/_ajax/bisect")
@app.route("/_ajax/bisect/<string:doc_id>")
def ajax_bisect_call(doc_id=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_bisect(
            request,
            doc_id,
            app_conf_get("BISECT_API_ENDPOINT"),
            timeout=60 * 60 * 4
        )
    else:
        abort(403)


@app.route("/_ajax/build/logs", methods=["GET"])
@app.route("/_ajax/build/<string:doc_id>/logs", methods=["GET"])
def ajax_build_logs(doc_id=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        if doc_id:
            api_path = app_conf_get("DEFCONFIG_ID_LOGS_ENPOINT")
        else:
            api_path = app_conf_get("DEFCONFIG_LOGS_ENPOINT")
        return backend.ajax_logs(
            request, api_path, doc_id=doc_id, timeout=60 * 60 * 3)
    else:
        abort(403)


@app.route("/_ajax/job/logs", methods=["GET"])
@app.route("/_ajax/job/<string:doc_id>/logs", methods=["GET"])
def ajax_job_logs(doc_id=None):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        if doc_id:
            api_path = app_conf_get("JOB_ID_LOGS_ENPOINT")
        else:
            api_path = app_conf_get("JOB_LOGS_ENPOINT")
        return backend.ajax_logs(
            request, api_path, doc_id=doc_id, timeout=60 * 60 * 3)
    else:
        abort(403)


@app.route("/_ajax/statistics", methods=["GET"])
def ajax_statistics():
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        return backend.ajax_get(
            request,
            app_conf_get("STATISTICS_API_ENDPOINT"), timeout=60 * 60 * 1)
    else:
        abort(403)


@app.route(
    "/_ajax/job/compare/<string:doc_id>/",
    methods=["GET"], defaults={"api": "JOB_COMPARE_API_ENDPOINT"})
@app.route(
    "/_ajax/job/compare",
    methods=["POST", "OPTIONS"],
    defaults={"api": "JOB_COMPARE_API_ENDPOINT", "doc_id": None})
@app.route(
    "/_ajax/build/compare/<string:doc_id>/",
    methods=["GET"], defaults={"api": "BUILD_COMPARE_API_ENDPOINT"})
@app.route(
    "/_ajax/build/compare",
    methods=["POST", "OPTIONS"],
    defaults={"doc_id": None, "api": "BUILD_COMPARE_API_ENDPOINT"})
@app.route(
    "/_ajax/boot/compare/<string:doc_id>/",
    methods=["GET"], defaults={"api": "BOOT_COMPARE_API_ENDPOINT"})
@app.route(
    "/_ajax/boot/compare",
    methods=["POST", "OPTIONS"],
    defaults={"api": "BOOT_COMPARE_API_ENDPOINT", "doc_id": None})
def ajax_compare(doc_id, api):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        api_path = app_conf_get(api)
        if request.method == "GET":
            return backend.ajax_get(
                request, api_path, doc_id=doc_id, timeout=60 * 60 * 2)
        elif any([request.method == "POST", request.method == "OPTIONS"]):
            if request.data:
                return backend.ajax_batch_post(
                    request, api_path, timeout=60 * 60 * 2)
            else:
                abort(400)
        else:
            abort(405)
    else:
        abort(403)


@app.route(
    "/_ajax/<string:resource>/distinct/<string:field>/", methods=["GET"])
def ajax_distinct(resource, field):
    if validate_csrf(request.headers.get(CSRF_TOKEN_H, None)):
        # Workaround because the backend uses /test/group/...
        if (resource == "group"):
            resource = "test/group"
        return backend.ajax_get(
            request, "/%s/distinct" % resource, doc_id=field, timeout=60 * 30)
    else:
        abort(403)
