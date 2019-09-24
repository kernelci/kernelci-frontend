# Copyright (C) Linaro Limited 2014,2015,2017,2019
# Author: Matt Hart <matthew.hart@linaro.org>
# Author: Milo Casagrande <milo.casagrande@linaro.org>
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

"""All the necessary functions to interact with the backend or server side."""

try:
    import simple_json as json
except ImportError:
    import json

import contextlib
import datetime
import gzip
import hashlib
import io
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

CONFIG_GET = app.config.get

# Timeout seconds to connect and read from the remote server.
CONNECT_TIMEOUT = CONFIG_GET("REQUEST_CONNECT_TIMEOUT")
READ_TIMEOUT = CONFIG_GET("REQUEST_READ_TIMEOUT")
CACHE_DEFAULT_TIMEOUT = CONFIG_GET("CACHE_DEFAULT_TIMEOUT")

AUTH_HEADER = CONFIG_GET("BACKEND_TOKEN_HEADER")
AUTH_TOKEN = CONFIG_GET("BACKEND_TOKEN")
BACKEND_URL = CONFIG_GET("BACKEND_URL")

# The requests session object.
REQ_SESSION = requests.Session()
HTTP_ADAPTER = requests.adapters.HTTPAdapter(
    pool_connections=CONFIG_GET("REQUEST_MIN_POOL_SIZE"),
    pool_maxsize=CONFIG_GET("REQUEST_MAX_POOL_SIZE")
)
REQ_SESSION.mount("http://", HTTP_ADAPTER)
REQ_SESSION.mount("https://", HTTP_ADAPTER)
REQ_SESSION.headers.update({AUTH_HEADER: AUTH_TOKEN})


def extract_gzip_data(data, headers):
    """Extract and json-serialize gzipped data from a response.

    :param data: The data from the response.
    :param headers: The headers of the response.
    :return The data itself or a json object.
    """
    read_data = None
    if "content-encoding" in headers:
        if "gzip" in headers["content-encoding"]:
            in_buffer = io.BytesIO()
            in_buffer.write(data)
            in_buffer.seek(io.SEEK_SET)

            with gzip.GzipFile(mode="rb", fileobj=in_buffer) as g_data:
                read_data = g_data.read()

    if read_data:
        json_data = None
        json_data = json.loads(read_data, encoding="utf-8")
        read_data = data = None
    else:
        json_data = data

    return json_data


@app.cache.memoize(timeout=60 * 60 * 6)
def _is_mobile_browser(platform, user_agent):
    """Wrapper to make the function cachable.

    This is where the logic lies. This function is only used to provide an
    easy way to cache its results based on valid arguments.

    :param platform: The platform making the request.
    :param user_agent: The user agent string.
    :return True or False.
    """
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


def is_mobile_browser(request):
    """Verify if the request is made from a mobile browser.

    :param request: The request to analyze.
    :return True or False.
    """
    platform = request.user_agent.platform
    user_agent = request.user_agent.string
    return _is_mobile_browser(platform, user_agent)


@app.cache.memoize(timeout=60*60*6)
def _is_old_browser(browser, version):
    """Wrapper to make the function cachable.

    This is where the logic lies. This function is only used to provide an
    easy way to cache its results based on valid arguments.

    :param browser: The browser string in a request.
    :param version: The browser version number.
    :return True or False.
    """
    is_old = False
    if all([browser == "msie", version < 9]):
        is_old = True

    return is_old


def is_old_browser(request):
    """Define if a browser is an older version.

    An older browser might not support all features. Right now we check only
    if IE is < 9.

    :param request: The request to analyze.
    :return True or False.
    """
    browser = request.user_agent.browser
    version = (
        request.user_agent.version and
        int(request.user_agent.version.split(".")[0])
    )
    return _is_old_browser(browser, version)


def get_search_parameters(request):
    """Get the request parameters for the search box.

    :param request: The request to analyze.
    :return The search filter to apply and the page length.
    """
    search_filter = ""
    page_len = ""

    if request.args:
        page_len = request.args.get("show", "")
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


@app.cache.memoize(timeout=60 * 60 * 6)
def create_url(api_path):
    """Create the complete URL to the API backend.

    :param api_path: The API path.
    :return The full URL to the backend.
    """
    return urlparse.urljoin(BACKEND_URL, api_path)


def _create_api_path(api_path, other_path=None):
    """Merge URL tokens together.

    :param api_path: The path to the API endpoint.
    :type api_path: str
    :param other_path: The path to append, defaults to None.
    :type other_path: list or str
    """
    def _check_and_add_trailing_slash(path):
        """Check if the path is missing the trailing /."""
        if path[-1] != "/":
            path += "/"
        return path

    # pylint: disable=invalid-name
    def _check_and_remove_trailing_slash(path):
        """Remove the trailing / from the path."""
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


def request_get(url, params=None, timeout=None):
    """Perform a GET request on the provided URL.

    :return The server response.
    """
    if not params:
        params = []

    return_data = status_code = headers = None
    cache_key = hashlib.md5("%s%s" % (url, str(params))).digest()

    cached = app.cache.get(cache_key)
    if cached:
        return_data, status_code, headers = cached
    else:
        try:
            with contextlib.closing(
                    REQ_SESSION.get(
                        url,
                        params=params,
                        timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                        stream=True)) as req:
                return_data = req.raw.data or req.text
                status_code = req.status_code
                headers = req.headers

            if timeout is None:
                timeout = CACHE_DEFAULT_TIMEOUT

            app.cache.set(
                cache_key,
                (return_data, status_code, headers),
                timeout=timeout
            )
        except (ConnectTimeout, ReadTimeout):
            abort(408)
        except ConnectionError:
            abort(500)

    return return_data, status_code, headers


# pylint: disable=too-many-arguments
def request_post(
        url, data, params=None, headers=None, stream=True, timeout=None):
    """Perform a POST request on the provided URL with the given data.

    :return The server response.
    """
    if not params:
        params = []
    if not headers:
        headers = {}

    return_data = status_code = r_headers = None
    cache_key = hashlib.md5("%s%s%s" % (url, data, str(params))).digest()

    cached = app.cache.get(cache_key)
    if cached:
        return_data, status_code, r_headers = cached
    else:
        try:
            with contextlib.closing(REQ_SESSION.post(
                    url,
                    data=data,
                    params=params,
                    headers=headers,
                    stream=stream,
                    timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))) as req:
                return_data = req.raw.data or req.text
                status_code = req.status_code
                r_headers = req.headers

            if timeout is None:
                timeout = CACHE_DEFAULT_TIMEOUT

            app.cache.set(
                cache_key,
                (return_data, status_code, r_headers),
                timeout=timeout
            )
        except (ConnectTimeout, ReadTimeout):
            abort(408)
        except ConnectionError:
            abort(500)

    return return_data, status_code, r_headers


def ajax_count_get(request, api_path, collection, timeout=None):
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

    url = create_url(api_path)

    data, status_code, headers = request_get(
        url, params=params_list, timeout=timeout)
    return data, status_code, headers.items()


def ajax_get(request, api_path, doc_id=None, timeout=None):
    """Handle general AJAX calls from the client.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    params_list = request.args.lists()

    if "id" in request.args:
        doc_id = request.args["id"]
        params_list.remove(("id", [doc_id]))

    if doc_id:
        api_path = _create_api_path(api_path, doc_id)

    url = create_url(api_path)

    data, status_code, headers = request_get(
        url, params=params_list, timeout=timeout)
    return (data, status_code, headers.items())


def ajax_bisect(request, doc_id, api_path, timeout=None):
    """Handle GET operations on the bisect collection.

    :param request: The request performed.
    :param doc_id: The ID of the bisect document.
    :param api_path: The API endpoint where to perform the request.
    """
    params_list = request.args.lists()

    if doc_id:
        api_path = _create_api_path(api_path, [doc_id])
    else:
        api_path = _create_api_path(api_path)
    url = create_url(api_path)

    data, status_code, headers = request_get(
        url, params=params_list, timeout=timeout)
    return (data, status_code, headers.items())


def ajax_batch_post(request, api_path, timeout=None):
    """Handle batch POST operations.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    url = create_url(api_path)
    data, status_code, headers = request_post(
        url,
        request.data,
        headers={"Content-Type": "application/json"},
        timeout=timeout
    )

    return data, status_code, headers.items()


@app.cache.memoize(timeout=60 * 60 * 8)
def get_version():
    """Get the backend API version."""
    url = create_url(CONFIG_GET("VERSION_API_ENDPOINT"))
    data, status_code, headers = request_get(url)

    backend_version = None
    if status_code == 200:
        read_data = extract_gzip_data(data, headers)

        if read_data:
            backend_version = read_data["result"][0]["version"]

    return backend_version


def ajax_logs(request, api_path, doc_id=None, timeout=None):
    """Get logs from the backend.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :param doc_id: The ID of the bisect document.
    """
    params_list = request.args.lists()

    if doc_id:
        api_path = _create_api_path(api_path % doc_id)
    else:
        api_path = _create_api_path(api_path)
    url = create_url(api_path)

    data, status_code, headers = request_get(
        url, params=params_list, timeout=timeout)
    return (data, status_code, headers.items())
