# Copyright (C) Linaro Limited 2015,2017,2019
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

try:
    import simple_json as json
except ImportError:
    import json

import bson
import datetime
import gzip
import hashlib
import io

from flask import (
    current_app as app,
    request
)

import werkzeug.contrib.atom as watom

from dashboard import __version__

import dashboard.utils.backend as backend


CONFIG_GET = app.config.get

# The name of the feed.
AUTHOR_NAME = "Kernel CI Feed Bot"
# Default author information.
AUTHOR = {
    "name": AUTHOR_NAME,
    "email": CONFIG_GET("INFO_EMAIL"),
    "uri": CONFIG_GET("BASE_URL")
}

# Necessary URLs for the feed.
BUILD_URL = backend.create_url(CONFIG_GET("BUILD_API_ENDPOINT"))
BUILD_FRONTEND_URL = (
    CONFIG_GET("BASE_URL") +
    "/build/%(job)s/kernel/%(kernel)s/defconfig/%(defconfig_full)s/"
    "?_id=%(build_id)s"
)
STORAGE_URL = (
    CONFIG_GET("FILE_SERVER_URL") +
    "%(job)s/%(kernel)s/%(arch)s-%(defconfig_full)s/")

# Some categories for the build feed.
BUILD_FEED_CATEGORIES = [
    {"term": "build"},
    {"term": "ci"},
    {"term": "linux"}
]

# Templates to be used in filling up the feed.
HREF_BASE = u"<a href=\"%s\">%s</a>"
NOT_AVAILABLE = u"Not available"
BUILD_HTML_CONTENT = u"""
<div>
<dt>Status</dt><dd>%(status)s</dd>
<dt>Job</dt><dd>%(job)s</dd>
<dt>Kernel</dt><dd>%(kernel)s</dd>
<dt>Defconfig</dt><dd>%(defconfig)s</dd>
<dt>Full defconfig</dt><dd>%(defconfig_full)s</dd>
<dt>Architecture</dt><dd>%(arch)s</dd>
<dt>Job ID</dt><dd>%(job_id)s</dd>
<dt>Defconfig ID</dt><dd>%(build_id)s</dd>
<dt>DTB directory</dt><dd>%(dtb_dir)s</dd>
<dt>Kernel image</dt><dd>%(kernel_image)s</dd>
<dt>System map</dt><dd>%(system_map)s</dd>
<dt>Modules file</dt><dd>%(modules_file)s</dd>
<dt>Modules directory</dt><dd>%(modules_dir)s</dd>
</div>
"""


@app.cache.memoize(timeout=60*60*12)
def convert_date(timestamp):
    """Convert a milliseconds timestamp into a datetime object.

    :param timestamp: Milliseconds from epoch time.
    :return A datetime object.
    """
    return datetime.datetime.fromtimestamp(
        timestamp / 1000, tz=bson.tz_util.utc)


def _get_build_results(date_range=1):
    """Retrieve build resulsts from the backend.

    By default retrieve only 1 day of data.

    :param date_range: The number of days of data to retrieve.
    :type date_range: integer
    :return The status code (integer) and the data from the backend (json).
    """
    results = []
    params = [
        ("date_range", date_range),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]
    data, status, headers = backend.request_get(BUILD_URL, params=params)

    if status == 200:
        read_data = data

        if "content-encoding" in headers:
            if "gzip" in headers["content-encoding"]:
                in_buffer = io.BytesIO()
                in_buffer.write(data)
                in_buffer.seek(io.SEEK_SET)

                with gzip.GzipFile(mode="rb", fileobj=in_buffer) as g_data:
                    read_data = g_data.read()

        if read_data:
            json_data = None
            json_data = json.loads(read_data, encoding="utf_8")
            read_data = data = None

            if json_data:
                results = json_data.get("result", [])

    return status, results


def _parse_build_results(data):
    """Parse the build results and yeild each entry for the feed.

    :return A 5-tuple with: title, content, entry URL, storage URL and
    contend date
    """
    title = content = content_date = entry_url = u""
    storage_url = u""

    for result in data:
        res_get = result.get

        j_id = res_get("job_id", None)
        if j_id:
            j_id = j_id["$oid"]
        else:
            j_id = NOT_AVAILABLE

        d_id = res_get("_id")
        if d_id:
            d_id = d_id["$oid"]
        else:
            d_id = NOT_AVAILABLE

        subs = {
            "arch": res_get("arch"),
            "defconfig": res_get("defconfig"),
            "defconfig_full": res_get("defconfig_full"),
            "build_id": d_id,
            "job": res_get("job"),
            "job_id": j_id,
            "kernel": res_get("kernel"),
            "status": res_get("status")
        }

        entry_url = BUILD_FRONTEND_URL % subs
        storage_url = STORAGE_URL % subs

        dtb_dir = res_get("dtb_dir", None)
        if dtb_dir:
            dtb_url = storage_url + dtb_dir
            dtb_href = HREF_BASE % (dtb_url, dtb_dir)
            subs["dtb_dir"] = dtb_href
        else:
            subs["dtb_dir"] = NOT_AVAILABLE

        kernel_image = res_get("kernel_image", None)
        if kernel_image:
            image_url = storage_url + kernel_image
            kernel_href = HREF_BASE % (image_url, kernel_image)
            subs["kernel_image"] = kernel_href
        else:
            subs["kernel_image"] = NOT_AVAILABLE

        system_map = res_get("system_map", None)
        if system_map:
            map_url = storage_url + system_map
            subs["system_map"] = HREF_BASE % (map_url, system_map)
        else:
            subs["system_map"] = NOT_AVAILABLE

        modules_file = res_get("modules", None)
        if modules_file:
            modules_url = storage_url + modules_file
            subs["modules_file"] = HREF_BASE % (modules_url, modules_file)
        else:
            subs["modules_file"] = NOT_AVAILABLE

        modules_dir = res_get("modules_dir", None)
        if modules_dir:
            modules_url = storage_url + modules_dir
            subs["modules_dir"] = HREF_BASE % (modules_url, modules_dir)
        else:
            subs["modules_dir"] = NOT_AVAILABLE

        content = BUILD_HTML_CONTENT % subs

        timestamp = res_get("created_on")["$date"]
        content_date = convert_date(timestamp)
        title = (
            u"%(job)s %(kernel)s %(defconfig_full)s "
            u"(%(arch)s) \u2013 %(status)s" % subs)

        yield title, content, entry_url, storage_url, content_date


def all_build_feed():
    """Create a daily Atom feed for available builds.

    :return The Atom feed as an XML string.
    """
    build_feed = None
    host_url = request.host_url
    feed_url = request.url

    cache_key = hashlib.md5(feed_url).digest()
    cached = app.cache.get(cache_key)

    if cached:
        build_feed = cached
    else:
        feed = watom.AtomFeed(
            u"Kernel CI \u2014 Latest Builds",
            title_type="text",
            feed_url=feed_url,
            url=host_url,
            subtitle=u"Latest builds available",
            generator=(AUTHOR_NAME, host_url, __version__),
            author=AUTHOR
        )

        status, results = _get_build_results()
        if status == 200:
            if results:
                for data in _parse_build_results(results):
                    feed.add(
                        title=data[0],
                        title_type="text",
                        content=data[1],
                        url=data[2],
                        content_type="html",
                        updated=data[4],
                        published=data[4],
                        categories=BUILD_FEED_CATEGORIES,
                        links=[
                            {"href": data[2], "rel": "alternate"},
                            {"href": data[3], "rel": "related"}
                        ]
                    )
        else:
            error_title = u"Error loading builds data"
            error_str = (
                "<p>" +
                "No builds data could be loaded from the server (Error: %d)."
                "<br />"
                "Please report this problem."
                "</p>" %
                status
            )
            now = datetime.datetime.now(tz=bson.tz_util.utc)
            feed.add(
                author=AUTHOR,
                title=error_title,
                title_type="text",
                url=feed_url,
                content=error_str,
                content_type="html",
                updated=now,
                published=now
            )

        build_feed = feed.get_response()
        app.cache.set(cache_key, build_feed, timeout=60*60)

    return build_feed
