# Copyright (C) Linaro Limited 2015,2019
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

import bson
import datetime
import jinja2
import os
import werkzeug.contrib.atom as watom

from flask import current_app as app

from dashboard import __version__

CONFIG_GET = app.config.get

AUTHOR_NAME = "kernelci.org Atom Feed Bot"
AUTHOR = {
    "name": AUTHOR_NAME,
    "email": CONFIG_GET("INFO_EMAIL"),
    "uri": CONFIG_GET("BASE_URL")
}

# Base path where the templates are stored.
TEMPLATES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "templates/")
# The templates loader.
TEMPLATES_ENV = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATES_DIR))


@app.cache.memoize(timeout=60*60*12)
def convert_date(timestamp):
    """Convert a milliseconds timestamp into a UTC datetime object.

    :param timestamp: Milliseconds from epoch time.
    :return: A datetime object.
    """
    return datetime.datetime.fromtimestamp(
        timestamp / 1000, tz=bson.tz_util.utc)


def create_feed(req_params, feed_data, get_callback, parse_callback):
    """Create an Atom feed based on provided data and callbacks.

    This function will retrieve the results, parse them and create the Atom
    feed.
    The result retrieving is done calling the `get_callback` function, and the
    parsing calling the `parse_callback` function.

    :param req_params: The parameters to be passed the the `get_callback`
    function to retrieve the results from the backend.
    :type req_params: list
    :param feed_data: All the necessary data for the feed.
    :type feed_data: dict
    :param get_callback: Function that will be called to retrieve the results
    from the backend. Only `req_params` will be passed to it.
    :type get_callback: function
    :param parse_callback: Function that will be called to parse the results
    obtained from the backend. It must accept two parameters: `results` and
    `feed_data`.
    """
    d_get = feed_data.get
    feed = app.cache.get(d_get("cache_key"))

    if not feed:
        feed = watom.AtomFeed(
            d_get("title"),
            title_type="text",
            feed_url=d_get("feed_url"),
            url=d_get("host_url"),
            subtitle=d_get("subtitle"),
            generator=(AUTHOR_NAME, d_get("host_url"), __version__),
            author=AUTHOR_NAME
        )

        results = get_callback(req_params)
        if results:
            feed_categories = d_get("feed_categories")
            for parsed in parse_callback(results, feed_data):
                p_get = parsed.get
                feed.add(
                    categories=feed_categories,
                    content=p_get("content"),
                    content_type="html",
                    links=p_get("links"),
                    published=p_get("published"),
                    title=p_get("title"),
                    title_type="text",
                    updated=p_get("updated"),
                    url=p_get("url")
                )

    return feed
