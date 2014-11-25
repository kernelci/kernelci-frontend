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

import datetime
import re
import requests
import types
import urlparse

from flask import (
    abort,
    current_app as app,
)
from requests.exceptions import (
    ConnectionError,
    ConnectTimeout,
    ReadTimeout,
)

# Timeout seconds to connect and read from the remote server.
CONNECT_TIMEOUT = 6.0
READ_TIMEOUT = 10.0


def translate_git_url(git_url, commit_id):
    """Create a real git URL based on defined translations.

    :param git_url: The git URL as obtained from the backend.
    :param commit_id: The git SHA.
    :return The base URL to create URLs, and the real commit URL.
    """

    base_url = ""
    commit_url = ""

    if git_url and commit_id:
        t_url = urlparse.urlparse(git_url)
        known_git_urls = app.config.get("KNOWN_GIT_URLS")

        if t_url.netloc in known_git_urls.keys():
            known_git = known_git_urls.get(t_url.netloc)

            path = t_url.path
            for replace_rule in known_git[3]:
                path = path.replace(*replace_rule)

            base_url = urlparse.urlunparse((
                known_git[0], t_url.netloc, known_git[1] % path,
                "", "", ""
            ))
            commit_url = urlparse.urlunparse((
                known_git[0], t_url.netloc,
                (known_git[2] % path) + commit_id,
                "", "", ""
            ))
    else:
        abort(400)

    return base_url, commit_url


def is_mobile_browser(request):
    """Verify if the request is made from a mobile browser.

    :param request: The request to analyze.
    :return True or False.
    """
    platform = request.user_agent.platform
    user_agent = request.user_agent.string

    is_mobile = False
    if any([platform == "android", platform == "iphone"]):
        is_mobile = True
    elif all([
            platform == "windows",
            re.search("Windows Phone", user_agent)]):
        is_mobile = True
    elif re.search("BlackBerry|BB", user_agent):
        is_mobile = True
    elif re.search("Mobile", user_agent):
        is_mobile = True

    return is_mobile


def get_search_parameters(request):
    """Get the request parameters for the search box.

    :param request: The request to analyze.
    :return The search filter to apply and the page length.
    """
    search_filter = ""
    page_len = 25

    if request.args:
        page_len = request.args.get("show", 25)
        search_filter = " ".join(
            [arg for arg in request.args if arg != "show"]
        )

    return search_filter, page_len


def today_date():
    """Return today date as: %a, %d %b %Y

    Date is based on the server, hopefully with the system clock set at UTC.

    :return The date string.
    """
    return datetime.date.today().strftime("%a, %d %b %Y")


def _create_url_headers(api_path):
    """Create the complete URL to the API backend.

    Used if we need to set special headers.

    :param api_path: The API path.
    :return A tuple with the full URL, and the headers set.
    """
    backend_token = app.config.get("BACKEND_TOKEN")
    backend_url = app.config.get("BACKEND_URL")
    backend_token_header = app.config.get("BACKEND_TOKEN_HEADER")

    backend_url = urlparse.urljoin(backend_url, api_path)

    headers = {}
    if backend_token:
        headers = {
            backend_token_header: backend_token,
        }

    return (backend_url, headers)


def _create_api_path(api_path, other_path=None):
    """Merge URL tokens together.

    :param api_path: The path to the API endpoint.
    :type api_path: str
    :param other_path: The path to append, defaults to None.
    :type other_path: list or str
    """
    def _check_and_add_trailing_slash(path):
        if path[-1] != "/":
            path += "/"
        return path

    def _check_and_remove_trailing_slash(path):
        if path[-1] == "/":
            path = path[:-1]
        return path

    api_path = _check_and_add_trailing_slash(api_path)

    if other_path:
        if isinstance(other_path, types.StringTypes):
            api_path += _check_and_remove_trailing_slash(other_path)
        elif isinstance(other_path, types.ListType):
            for path in other_path:
                api_path += _check_and_add_trailing_slash(path)
            api_path = _check_and_remove_trailing_slash(api_path)

    return api_path


def get_job(**kwargs):
    """Get a job document from the backend.

    This function is only used for server side processing data.

    :return A `requests.Response` object.
    """
    api_path = app.config.get("JOB_API_ENDPOINT")

    if kwargs.get("id", None):
        api_path = _create_api_path(api_path, kwargs["id"])
        kwargs.pop("id")

    url, headers = _create_url_headers(api_path)

    try:
        return requests.get(
            url, params=kwargs, headers=headers,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)


def get_defconfig(**kwargs):
    """Get a defconfig document from the backend.

    This function is only used for server side processing data.

    :return A `requests.Response` object.
    """
    api_path = app.config.get("DEFCONFIG_API_ENDPOINT")

    if kwargs.get("id", None):
        api_path = _create_api_path(api_path, kwargs["id"])
        kwargs.pop("id")

    url, headers = _create_url_headers(api_path)

    try:
        return requests.get(
            url, params=kwargs, headers=headers,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)


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

    try:
        r = requests.get(
            url, headers=headers, params=params_list, stream=True,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        return (r.raw.data, r.status_code, r.headers.items())
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)


def ajax_get(request, api_path):
    """Handle general AJAX calls from the client.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    params_list = request.args.lists()

    if "id" in request.args:
        boot_id = request.args["id"]
        api_path = _create_api_path(api_path, boot_id)

        params_list.remove(("id", [boot_id]))

    url, headers = _create_url_headers(api_path)
    try:
        r = requests.get(
            url, headers=headers, params=params_list, stream=True,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        return (r.raw.data, r.status_code, r.headers.items())
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)


def ajax_batch_post(request, api_path):
    """Handle batch POST operations.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """

    url, headers = _create_url_headers(api_path)
    # Make sure we send JSON.
    headers["Content-Type"] = "application/json"
    try:
        r = requests.post(
            url, data=request.data, headers=headers, stream=True,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        return (r.raw.data, r.status_code, r.headers.items())
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)


def ajax_bisect(request, collection, doc_id, api_path):
    api_path = _create_api_path(api_path, [collection, doc_id])
    url, headers = _create_url_headers(api_path)

    try:
        r = requests.get(
            url, headers=headers, stream=True,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        return (r.raw.data, r.status_code, r.headers.items())
    except (ConnectTimeout, ReadTimeout):
        abort(408)
    except ConnectionError:
        abort(500)
