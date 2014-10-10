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
import urlparse

from bson import json_util
from datetime import date
from flask import (
    abort,
    current_app as app,
)
from urlparse import urljoin


def extract_response_metadata(response):
    """Extract data from a response object.

    It is used to extract metadata from a backend response, in order to
    translate URLs into real clickable URLs based on the KNOWN_GIT_URLS
    translation rules.

    :param response: A response object as returned by a requests.
    :return A tuple with the metadata from the response, the base_url, the
        commit_url and the response's result.
    """
    metadata = {}
    base_url = ''
    commit_url = ''
    result = {}

    document = json_util.loads(response.content)
    result = document.get('result', None)

    if result and len(result) == 1:
        result = result[0]
        metadata = result.get('metadata', None)

        if metadata:
            git_url = metadata.get('git_url', None)
            commit_id = metadata.get('git_commit', None)

            if git_url and commit_id:
                t_url = urlparse.urlparse(git_url)
                known_git_urls = app.config.get('KNOWN_GIT_URLS')

                if t_url.netloc in known_git_urls.keys():
                    known_git = known_git_urls.get(t_url.netloc)

                    path = t_url.path
                    for replace_rule in known_git[3]:
                        path = path.replace(*replace_rule)

                    base_url = urlparse.urlunparse((
                        known_git[0], t_url.netloc, known_git[1] % path,
                        '', '', ''
                    ))
                    commit_url = urlparse.urlunparse((
                        known_git[0], t_url.netloc,
                        (known_git[2] % path) + commit_id,
                        '', '', ''
                    ))
    else:
        abort(404)

    return metadata, base_url, commit_url, result


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
    backend_token = app.config.get('BACKEND_TOKEN')
    backend_url = app.config.get('BACKEND_URL')
    backend_token_header = app.config.get('BACKEND_TOKEN_HEADER')

    backend_url = urljoin(backend_url, api_path)

    headers = {}
    if backend_token:
        headers = {
            backend_token_header: backend_token,
        }

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

    :return A `requests.Response` object.
    """
    api_path = app.config.get('JOB_API_ENDPOINT')

    if kwargs.get('id', None):
        api_path = _create_api_path(api_path, kwargs['id'])
        kwargs.pop('id')

    url, headers = _create_url_headers(api_path)

    return requests.get(url, params=kwargs, headers=headers)


def get_defconfig(**kwargs):
    """Get a defconfig document from the backend.

    This function is only used for server side processing data.

    :return A `requests.Response` object.
    """
    api_path = app.config.get('DEFCONFIG_API_ENDPOINT')

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


def ajax_batch_post(request, api_path):
    """Handle batch POST operations.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """

    url, headers = _create_url_headers(api_path)
    # Make sure we send JSON.
    headers['Content-Type'] = "application/json"
    r = requests.post(url, data=request.data, headers=headers, stream=True)

    return (r.raw.data, r.status_code, r.headers.items())
