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
    request,
)

from dashboard.views.about import AboutView
from dashboard.views.build import BuildsView
from dashboard.views.index import IndexView
from dashboard.views.job import (
    JobsView,
    JobView,
    JobIdView,
)
from utils.backend import (
    ajax_get_defconfigs,
    ajax_get_jobs,
)

APP_ENVVAR = 'FLASK_SETTINGS'

app = Flask('kernel-ci-frontend')

app.root_path = os.path.abspath(os.path.dirname(__file__))

app.config.from_object('dashboard.default_settings')
if os.environ.get(APP_ENVVAR):
    app.config.from_envvar(APP_ENVVAR)

app.add_url_rule(
    '/build/', view_func=BuildsView.as_view('builds'), methods=['GET'],
)
app.add_url_rule(
    '/info/', view_func=AboutView.as_view('about'), methods=['GET'],
)
app.add_url_rule(
    '/job/<string:job>/', view_func=JobView.as_view('job'), methods=['GET'],
)
app.add_url_rule('/job/', view_func=JobsView.as_view('jobs'), methods=['GET'])
app.add_url_rule('/', view_func=IndexView.as_view('index'), methods=['GET'])

app.add_url_rule(
    '/job/<string:job>/kernel/<string:kernel>/',
    view_func=JobIdView.as_view('job-id'),
    methods=['GET'],
)


@app.route('/static/js/<path:path>')
def static_proxy(path):
    return app.send_static_file(os.path.join('js', path))


@app.route('/_ajax/job')
def ajax_jobs():
    return ajax_get_jobs(request)


@app.route('/_ajax/defconf')
def ajax_defconfs():
    return ajax_get_defconfigs(request)
