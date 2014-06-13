# Copyright (C) 2014 Linaro Ltd.
#
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

from flask import (
    Flask,
    Markup,
    render_template,
    request,
)

from dashboard.views.about import AboutView
from dashboard.views.build import (
    BuildsAllView,
    BuildsJobKernelView,
    BuildsJobKernelDefconfigView,
)
from dashboard.views.boot import (
    BootIdView,
    BootsView,
)
from dashboard.views.index import IndexView
from dashboard.views.job import (
    JobsAllView,
    JobsJobView,
)
from utils.backend import (
    ajax_get,
    ajax_count_get,
)

# Name of the environment variable that will be lookep up for app configuration
# parameters.
APP_ENVVAR = 'FLASK_SETTINGS'

app = Flask('kernel-ci-frontend')

app.root_path = os.path.abspath(os.path.dirname(__file__))

app.config.from_object('dashboard.default_settings')
if os.environ.get(APP_ENVVAR):
    app.config.from_envvar(APP_ENVVAR)

# General URLs.
app.add_url_rule('/', view_func=IndexView.as_view('index'), methods=['GET'])
app.add_url_rule(
    '/info/', view_func=AboutView.as_view('about'), methods=['GET'],
)

# Builds related URLs.
app.add_url_rule(
    '/build/', view_func=BuildsAllView.as_view('builds'), methods=['GET'],
)
app.add_url_rule(
    '/build/all/',
    view_func=BuildsAllView.as_view('all-builds'),
    methods=['GET']
)
app.add_url_rule(
    '/build/<string:job>/kernel/<string:kernel>/',
    view_func=BuildsJobKernelView.as_view('job-kernel-builds'),
    methods=['GET']
)
app.add_url_rule(
    '/build/<string:job>/kernel/<string:kernel>/defconfig/<string:defconfig>/',
    view_func=BuildsJobKernelDefconfigView.as_view('job-kernel-defconf'),
    methods=['GET']
)

# Jobs related URLs
app.add_url_rule(
    '/job/', view_func=JobsAllView.as_view('jobs'), methods=['GET']
)
app.add_url_rule(
    '/job/<string:job>/', view_func=JobsJobView.as_view('job'), methods=['GET'],
)

# Boots related URLs.
app.add_url_rule(
    '/boot/', view_func=BootsView.as_view('boots'), methods=['GET'],
)
app.add_url_rule(
    (
        '/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/'
        'defconfig/<string:defconfig>/'
    ),
    view_func=BootIdView.as_view('boot_id'),
    methods=['GET'],
)


@app.errorhandler(404)
def page_not_found(e):
    path = os.path.join(app.root_path, 'static', 'html', '404-content.html')
    page_content = ''

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template('404.html', page_content=page_content), 404


@app.errorhandler(500)
def internal_server_error(e):
    path = os.path.join(app.root_path, 'static', 'html', '500-content.html')
    page_content = ''

    with open(path) as content_file:
        page_content = Markup(content_file.read())

    return render_template('500.html', page_content=page_content), 500


@app.route('/static/js/<path:path>')
def static_js_proxy(path):
    return app.send_static_file(os.path.join('js', path))


@app.route('/static/html/<path:path>')
def static_html_proxy(path):
    return app.send_static_file(os.path.join('html', path))


@app.route('/_ajax/job')
def ajax_job():
    return ajax_get(request, app.config.get('JOB_API_ENDPOINT'))


@app.route('/_ajax/defconf')
def ajax_defconf():
    return ajax_get(request, app.config.get('DEFCONFIG_API_ENDPOINT'))


@app.route('/_ajax/boot')
def ajax_boot():
    return ajax_get(request, app.config.get('BOOT_API_ENDPOINT'))


@app.route('/_ajax/count')
@app.route('/_ajax/count/<string:collection>')
def ajax_count(collection=None):
    return ajax_count_get(
        request, app.config.get('COUNT_API_ENDPOINT'),
        collection
    )
