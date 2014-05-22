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

from datetime import date
from flask import current_app
from urlparse import urljoin


def today_date():
    """Return today date as: %a, %d %b %Y

    Date is based on the server, hopefully with the system clock set at UTC.

    :return The date string.
    """
    return date.today().strftime('%a, %d %b %Y')


def _create_url_headers(api_path):
    """Create the complete URL to the API backend.

    Used if we need to set special headers.

    :param api_path: The API path.
    :return A tuple with the full URL, and the headers set.
    """
    backend_token = current_app.config.get('BACKEND_TOKEN')
    backend_url = current_app.config.get('BACKEND_URL')

    backend_url = urljoin(backend_url, api_path)

    headers = {}
    if backend_token:
        headers = {'X-XSRF-Header': backend_token}

    return (backend_url, headers)


def _create_api_path(api_path, other_path=''):
    """Merge two URL tokens together.

    :param api_path: The path to the API endpoint.
    :param other_path: The path to append, defaults to empty string.
    """
    if api_path[-1] != '/':
        api_path += '/'

    if other_path and other_path[-1] == '/':
        other_path = other_path[:-1]

    return api_path + other_path


def get_job(**kwargs):
    """Get a job document from the backend.

    This function is only used for server side processing data.

    :return A`requests.Response` object.
    """
    api_path = current_app.config.get('JOB_API_ENDPOINT')

    if kwargs.get('id', None):
        api_path = _create_api_path(api_path, kwargs['id'])
        kwargs.pop('id')

    url, headers = _create_url_headers(api_path)

    return requests.get(url, params=kwargs, headers=headers)


def ajax_count_get(request, api_path, collection):
    """Handle AJAX call from the client to the `count` API.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :param collection: The collection to count.

    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    params_list = request.args.lists()

    api_path = _create_api_path(api_path)

    if collection:
        api_path = _create_api_path(api_path, collection)

    url, headers = _create_url_headers(api_path)
    r = requests.get(url, headers=headers, params=params_list, stream=True)

    return (r.raw.data, r.status_code, r.headers.items())


def ajax_get(request, api_path):
    """Handle general AJAX calls from the client.


    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    params_list = request.args.lists()

    if 'id' in request.args:
        boot_id = request.args['id']
        api_path = _create_api_path(api_path, boot_id)

        params_list.remove(('id', [boot_id]))

    url, headers = _create_url_headers(api_path)
    r = requests.get(url, headers=headers, params=params_list, stream=True)

    return (r.raw.data, r.status_code, r.headers.items())
