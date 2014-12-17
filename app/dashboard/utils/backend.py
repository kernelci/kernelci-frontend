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
import hashlib
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

AUTH_HEADER = app.config.get("BACKEND_TOKEN_HEADER")
AUTH_TOKEN = app.config.get("BACKEND_TOKEN")

# The requests session object.
req_session = requests.Session()
req_session.headers.update({AUTH_HEADER: AUTH_TOKEN})


def translate_git_url(git_url, commit_id):
    """Create a real git URL based on defined translations.

    :param git_url: The git URL as obtained from the backend.
    :param commit_id: The git SHA.
    :return The base URL to create URLs, and the real commit URL.
    """

    base_url = None
    commit_url = None

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

    return base_url, commit_url


def is_mobile_browser(request):
    """Verify if the request is made from a mobile browser.

    :param request: The request to analyze.
    :return True or False.
    """
    platform = request.user_agent.platform
    user_agent = request.user_agent.string
    return _is_mobile_browser(platform, user_agent)


@app.cache.memoize(timeout=60*60*6)
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
        int(request.user_agent.version.split('.')[0])
    )
    return _is_old_browser(browser, version)


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
    if (browser == "msie" and version < 9):
        is_old = True

    return is_old


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


@app.cache.memoize(timeout=60*60*6)
def _create_url_headers(api_path):
    """Create the complete URL to the API backend.

    Used if we need to set special headers.

    :param api_path: The API path.
    :return A tuple with the full URL, and the headers set.
    """
    backend_url = app.config.get("BACKEND_URL")
    backend_url = urlparse.urljoin(backend_url, api_path)

    return backend_url


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


@app.cache.memoize(timeout=60*60*6)
def _get_request_headers():
    """Get the default request headers.

    :return The headers as a dictionary.
    """
    backend_token = app.config.get("BACKEND_TOKEN")
    backend_token_header = app.config.get("BACKEND_TOKEN_HEADER")

    headers = {}
    if backend_token:
        headers = {
            backend_token_header: backend_token,
        }

    return headers


def request_get(url, params=[], timeout=None):
    """Perform a GET request on the provided URL.

    :return The server response.
    """
    return_data = status_code = headers = None

    cache_key = hashlib.md5("%s%s" % (url, str(params))).digest()

    cached = app.cache.get(cache_key)
    if cached:
        return_data, status_code, headers = cached
    else:
        try:
            r = req_session.get(
                url,
                params=params,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
                stream=True
            )

            return_data = r.raw.data or r.text
            status_code = r.status_code
            headers = r.headers

            if timeout is None:
                timeout = app.config.get("CACHE_DEFAULT_TIMEOUT")

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


def request_post(url, data, params=[], headers={}, stream=True, timeout=None):
    """Perform a POST request on the provided URL with the given data.

    :return The server response.
    """
    return_data = status_code = r_headers = None
    print "POST"
    print url
    print type(data), data
    print type(params), params

    cache_key = hashlib.md5("%s%s%s" % (url, data, str(params))).digest()
    print cache_key

    cached = app.cache.get(cache_key)
    if cached:
        print "WE HAVE CACHED POST DATA"
        return_data, status_code, r_headers = cached
    else:
        try:
            r = req_session.post(
                url,
                data=data,
                params=params,
                headers=headers,
                stream=stream,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
            )
            return_data = r.raw.data or r.text
            status_code = r.status_code
            r_headers = r.headers

            if timeout is None:
                timeout = app.config.get("CACHE_DEFAULT_TIMEOUT")

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


def get_job(**kwargs):
    """Get a job document from the backend.

    This function is only used for server side processing data.

    :return A `requests.Response` object.
    """
    api_path = app.config.get("JOB_API_ENDPOINT")

    if kwargs.get("id", None):
        api_path = _create_api_path(api_path, kwargs["id"])
        kwargs.pop("id")

    url = _create_url_headers(api_path)
    return request_get(url, params=kwargs)


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

    url = _create_url_headers(api_path)

    data, status_code, headers = request_get(url, params=params_list)
    return data, status_code, headers.items()


def ajax_get(request, api_path, timeout=None):
    """Handle general AJAX calls from the client.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """
    params_list = request.args.lists()

    if "id" in request.args:
        doc_id = request.args["id"]
        api_path = _create_api_path(api_path, doc_id)

        params_list.remove(("id", [doc_id]))

    url = _create_url_headers(api_path)

    data, status_code, headers = request_get(
        url, params=params_list, timeout=timeout)
    return (data, status_code, headers.items())


def ajax_bisect(request, collection, doc_id, api_path):
    """Handle GET operations on the bisect collection.

    :param request: The request performed.
    :param collection: The name of the collection where to perform the bisect.
    :param doc_id: The ID of the document to bisect.
    :param api_path: The API endpoint where to perform the request.
    """
    api_path = _create_api_path(api_path, [collection, doc_id])
    url = _create_url_headers(api_path)

    r = request_get(url)
    return (r.raw.data, r.status_code, r.headers.items())


def ajax_batch_post(request, api_path):
    """Handle batch POST operations.

    :param request: The request performed.
    :param api_path: The API endpoint where to perform the request.
    :return A tuple with the data, status code and headers of the
        `requests.Response` object.
    """

    url = _create_url_headers(api_path)
    data, status_code, headers = request_post(
        url, request.data, headers={"Content-Type": "application/json"})

    return data, status_code, headers.items()
