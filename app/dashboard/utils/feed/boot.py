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

"""Boot Atom feeds module."""

import copy
import hashlib

from flask import (
    current_app as app,
    request
)

import dashboard.utils.backend as backend
import dashboard.utils.feed as feed

CONFIG_GET = app.config.get

# Necessary URLs for the feed.
BACKEND_BOOT_URL = backend.create_url(CONFIG_GET("BOOT_API_ENDPOINT"))

# Some categories for the feed.
FEED_CATEGORIES = [
    {"term": "boot"},
    {"term": "ci"},
    {"term": "linux"}
]
BASE_URL = CONFIG_GET("BASE_URL")

BOOT_COMPLETE_FRONTEND_URL = (
    BASE_URL +
    u"/boot/%(board)s/job/%(job)s/kernel/%(kernel)s"
    "/defconfig/%(defconfig_full)s/lab/%(lab_name)s/?_id=%(boot_id)s"
)


def _parse_boot_results(results, feed_data):
    """Parse the boot results and create the required data structure.

    :param results: The results from the backend.
    :type results: list
    :param feed_data: The data necessary for all the feeds.
    :type feed_data: dict
    :return: Yield dictionaries with the correct keys to be used for a
    feed entry.
    """
    if results and results["result"]:
        results = results["result"]
        f_get = feed_data.get

        for result in results:
            # Convert the _id values.
            result["boot_id"] = result["_id"]["$oid"]
            result["build_id"] = result["build_id"]["$oid"]
            result["job_id"] = result["job_id"]["$oid"]

            boot_date = feed.convert_date(result["created_on"]["$date"])
            # If we have links that should be added to the feed content,
            # extract them and update the href values with the result ones.
            # Then inject the content_links into the result data structure to
            # be used by the template.
            content_links = copy.deepcopy(f_get("content_links", None))
            if content_links:
                for c_link in content_links:
                    c_link["href"] = c_link["href"] % result
                    c_link["label"] = c_link["label"] % result
                result["content_links"] = content_links

            content = u""
            content += \
                feed.TEMPLATES_ENV.get_template(
                    f_get("template_name")).render(**result)

            parsed_res = {
                "content": content,
                "links": [
                    {
                        "href": f_get("alternate_url") % result,
                        "rel": "alternate"
                    }
                ],
                "published": boot_date,
                "title": f_get("entry_title") % result,
                "updated": boot_date,
                "url": f_get("frontend_url") % result
            }

            yield parsed_res


def _get_boot_data(req_params):
    """Get the boot data from the backend.

    :param req_params: The parameters for the request. They will be added to
    the default ones.
    :return: The response from the backend as a dictionary.
    """
    results = []

    default_params = [
        ("date_range", 1),
        (
            "field",
            (
                "_id",
                "arch",
                "board",
                "boot_log",
                "build_id",
                "created_on",
                "defconfig",
                "defconfig_full",
                "git_branch",
                "git_commit",
                "git_describe",
                "git_url",
                "job",
                "job_id",
                "kernel",
                "lab_name",
                "mach",
                "status"
            )
        ),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]

    if req_params:
        default_params.extend(req_params)

    data, status, headers = backend.request_get(
        BACKEND_BOOT_URL, params=default_params, timeout=60*60)

    if status == 200:
        results = backend.extract_gzip_data(data, headers)

    return results


def get_boot_board_feed(board):
    """Create the Atom feed for the boot-board view.

    :param board: The name of the board.
    :type board: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"board": board})

    feed_data = {
        "alternate_url": BOOT_COMPLETE_FRONTEND_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": u"/boot/%(board)s/",
        "host_url": request.host_url,
        "template_name": "boot.html",
        "content_links": [
            {
                "href": BOOT_COMPLETE_FRONTEND_URL,
                "label": u"Boot report details"
            },
            {
                "href": BASE_URL + u"/boot/%(board)s/",
                "label": u"Boot reports for board %(board)s"
            },
            {
                "href": BASE_URL + u"/build/%(job)s/kernel/%(kernel)s/",
                "label": u"Build reports"
            }
        ]
    }

    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for Board \u00AB%s\u00BB" % board
    feed_data["subtitle"] = \
        u"Latest available boot reports for board %s" % board
    feed_data["entry_title"] = (
        u"%(status)s \u2014 %(lab_name)s \u2013 %(job)s %(kernel)s " +
        u"%(defconfig_full)s (%(arch)s)")

    return feed.create_feed(
        [("board", board)],
        feed_data, _get_boot_data, _parse_boot_results
    )


def get_boot_all_lab_feed(lab_name):
    """Create the Atom feed for the boot-lab view.

    :param lab_name: The name of the lab.
    :type lab_name: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"lab": lab_name})

    feed_data = {
        "alternate_url": BOOT_COMPLETE_FRONTEND_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": u"/boot/all/lab/%(lab_name)s/",
        "host_url": request.host_url,
        "template_name": "boot.html",
        "content_links": [
            {
                "href": BOOT_COMPLETE_FRONTEND_URL,
                "label": u"Boot report details"
            },
            {
                "href": BASE_URL + u"/boot/all/lab/%(lab_name)s/",
                "label": u"Boot reports for lab %(lab_name)s"
            },
            {
                "href": BASE_URL + u"/build/%(job)s/kernel/%(kernel)s/",
                "label": u"Build reports"
            }
        ]
    }

    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for Lab \u00AB%s\u00BB" % lab_name
    feed_data["subtitle"] = \
        u"Latest available boot reports for lab %s" % lab_name
    feed_data["entry_title"] = (
        u"%(status)s \u2014 %(board)s \u2013 %(job)s %(kernel)s " +
        u"%(defconfig_full)s (%(arch)s)")

    return feed.create_feed(
        [("lab_name", lab_name)],
        feed_data, _get_boot_data, _parse_boot_results
    )
