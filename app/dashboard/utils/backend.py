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

import requests

from bson import json_util
from flask import (
    current_app,
    jsonify,
)
from urlparse import urljoin

JOB_API = '/api/job'
DEFCONF_API = '/api/defconfig'


def _create_url_headers(api_path):
    backend_token = current_app.config.get('BACKEND_TOKEN')
    backend_url = current_app.config.get('BACKEND_URL')

    backend_url = urljoin(backend_url, api_path)

    headers = {}
    if backend_token:
        headers = {'X-XSRF-Header': backend_token}

    return (backend_url, headers)


def _create_api_path(api_path, doc_id):
    if api_path[-1] != '/':
        api_path += '/'

    if doc_id[-1] == '/':
        doc_id = doc_id[:-1]

    return api_path + doc_id


def get_job(**kwargs):
    api_path = JOB_API
    if kwargs.get('id', None):
        api_path = _create_api_path(api_path, kwargs['id'])
        kwargs.pop('id')

    url, headers = _create_url_headers(api_path)
    r = requests.get(url, params=kwargs, headers=headers)

    return r


def get_all(api_path, **kwargs):

    url, headers = _create_url_headers(api_path)
    r = requests.get(url, headers=headers, params=kwargs)

    return (r.status_code, r.content)


def get_defconfigs(**kwargs):

    url, headers = _create_url_headers(DEFCONF_API)
    r = requests.get(url, headers=headers, params=kwargs)

    return r


def ajax_get_defconfigs(request):
    url, headers = _create_url_headers(DEFCONF_API)
    r = requests.get(url, headers=headers, params=request.args.lists())

    response = {}

    if r.status_code == 200:
        data = json_util.loads(r.content)
        defconfs = json_util.loads(data['result'])

        response['result'] = defconfs

    return jsonify(response)


def ajax_get_jobs(request):
    url, headers = _create_url_headers(JOB_API)
    r = requests.get(url, headers=headers, params=request.args.lists())

    response = {}

    if r.status_code == 200:
        data = json_util.loads(r.content)
        jobs = json_util.loads(data['result'])

        response['result'] = jobs

    return jsonify(response)
