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

"""Boot Atom feeds module."""

try:
    import simple_json as json
except ImportError:
    import json

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

# Some base categories for the feed.
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


def _parse_batch_results(results):
    """Parse the batch-count results.

    :param results: The results from the batch query.
    :type results: dict
    :return: A dictionary with the counts.
    """
    count_results = {
        "failed_boots": 0,
        "other_boots": 0,
        "passed_boots": 0,
        "total_boots": 0,
    }

    if results and results["result"]:
        results = results["result"]

        for result in results:
            count_results[result["operation_id"]] = \
                result["result"][0]["count"]

        count_results["other_boots"] = (
            count_results["total_boots"] -
            count_results["passed_boots"] - count_results["failed_boots"]
        )

    return count_results


def _get_boots_count(result):
    """Get the boot counts.

    :param result: The boot element for which to get the count of.
    :type result: dict
    :return: A dictionary with the counts.
    """
    queries = []

    query_str = "status=%(status)s&job=%(job)s&kernel=%(kernel)s"
    total_query_str = "job=%(job)s&kernel=%(kernel)s" % result

    queries.append({
        "method": "GET",
        "operation_id": "total_boots",
        "resource": "count",
        "document": "boot",
        "query": total_query_str
    })

    result["status"] = "PASS"
    queries.append({
        "method": "GET",
        "operation_id": "passed_boots",
        "resource": "count",
        "document": "boot",
        "query": query_str % result
    })

    result["status"] = "FAIL"
    queries.append({
        "method": "GET",
        "operation_id": "failed_boots",
        "resource": "count",
        "document": "boot",
        "query": query_str % result
    })

    data, status, headers = backend.request_post(
        backend.create_url(CONFIG_GET("BATCH_API_ENDPOINT")),
        json.dumps({"batch": queries}),
        headers={"Content-Type": "application/json"},
        timeout=60*60
    )

    if status == 200:
        count_results = _parse_batch_results(
            backend.extract_gzip_data(data, headers))
    else:
        count_results = {
            "failed_boots": 0,
            "other_boots": 0,
            "passed_boots": 0,
            "total_boots": 0,
        }

    return count_results


def _common_boot_parse(result, feed_data):
    """Common boot reports parsing function.

    :param result: The result from the backend.
    :type result: dict
    :param feed_data: Data structure for the feed.
    :type feed_data: dict
    :return: A dictionary with the correct keys to be used for a feed entry.
    """
    f_get = feed_data.get
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

    return parsed_res


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

        for result in results:
            res_get = result.get

            # Convert the _id values.
            result["boot_id"] = res_get("_id")["$oid"]
            if res_get("build_id", None):
                result["build_id"] = res_get("build_id")["$oid"]
            if res_get("job_id", None):
                result["job_id"] = res_get("job_id")["$oid"]

            yield _common_boot_parse(result, feed_data)


def _parse_aggregated_boot_results(results, feed_data):
    if results and results["result"]:
        results = results["result"]

        for result in results:
            counts = _get_boots_count(copy.deepcopy(result))
            result.update(counts)

            yield _common_boot_parse(result, feed_data)


def _get_boot_data(req_params):
    """Get the boot data from the backend.

    :param req_params: The parameters for the request. They will be added to
    the default ones.
    :type req_params: dict
    :return: The response from the backend as a dictionary.
    """
    results = []

    default_params = [
        ("date_range", 1),
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


def get_boot_board_job_feed(board, job):
    """Create the Atom feed for the boot-board-job view.

    :param board: The name of the board.
    :type board: str
    :param job: The name of the tree.
    :type job: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": board})
    feed_categories.append({"term": job})

    feed_data = {
        "alternate_url": BOOT_COMPLETE_FRONTEND_URL,
        "cache_key": hashlib.md5(request.url).digest(),
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
            },
            {
                "href": BASE_URL + u"/job/%(job)s/",
                "label": u"Job reports"
            }
        ],
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": BASE_URL + u"/boot/%(board)s/job/%(job)s/",
        "host_url": request.host_url,
        "template_name": "boot.html",
    }

    feed_data["entry_title"] = (
        u"%(status)s \u2014 %(lab_name)s \u2013 %(kernel)s " +
        u"%(defconfig_full)s (%(arch)s)")
    feed_data["subtitle"] = \
        u"Latest available boot reports for board %s - %s" % (board, job)
    feed_data["title"] = (
        u"kernelci.org \u2014 Boot Reports for Board \u00AB%s\u00BB - %s" %
        (board, job))

    return feed.create_feed(
        [("board", board), ("job", job)],
        feed_data, _get_boot_data, _parse_boot_results)


def get_boot_board_feed(board):
    """Create the Atom feed for the boot-board view.

    :param board: The name of the board.
    :type board: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": board})

    feed_data = {
        "alternate_url": BOOT_COMPLETE_FRONTEND_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": BOOT_COMPLETE_FRONTEND_URL,
                "label": u"Boot report details"
            },
            {
                "href": BASE_URL + u"/boot/%(board)s/",
                "label": u"Boot reports for board %(board)s"
            }
        ],
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": BASE_URL + u"/boot/%(board)s/",
        "host_url": request.host_url,
        "template_name": "boot.html",
    }

    feed_data["entry_title"] = (
        u"%(status)s \u2014 %(lab_name)s \u2013 %(job)s %(kernel)s " +
        u"%(defconfig_full)s (%(arch)s)")
    feed_data["subtitle"] = \
        u"Latest available boot reports for board %s" % board
    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for Board \u00AB%s\u00BB" % board

    return feed.create_feed(
        [
            ("board", board),
            (
                "field",
                (
                    "_id",
                    "arch",
                    "board",
                    "build_id",
                    "created_on",
                    "defconfig",
                    "defconfig_full",
                    "job",
                    "job_id",
                    "kernel",
                    "lab_name",
                    "status"
                )
            )
        ],
        feed_data, _get_boot_data, _parse_boot_results)


def get_boot_all_lab_feed(lab_name):
    """Create the Atom feed for the boot-lab view.

    :param lab_name: The name of the lab.
    :type lab_name: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": lab_name})

    feed_data = {
        "alternate_url": BOOT_COMPLETE_FRONTEND_URL,
        "cache_key": hashlib.md5(request.url).digest(),
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
        ],
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": BASE_URL + u"/boot/all/lab/%(lab_name)s/",
        "host_url": request.host_url,
        "template_name": "boot.html",
    }

    feed_data["entry_title"] = (
        u"%(status)s \u2014 %(board)s \u2013 %(job)s %(kernel)s " +
        u"%(defconfig_full)s (%(arch)s)")
    feed_data["subtitle"] = \
        u"Latest available boot reports for lab %s" % lab_name
    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for Lab \u00AB%s\u00BB" % lab_name

    return feed.create_feed(
        [("lab_name", lab_name)],
        feed_data, _get_boot_data, _parse_boot_results)


def get_boot_all_job_feed(job):
    """Create the Atom feed for the boot-all-job view.

    :param job: The name of the job.
    :type job: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": job})

    feed_data = {
        "alternate_url":
            BASE_URL + u"/boot/all/job/%(job)s/kernel/%(kernel)s/",
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": BASE_URL + u"/boot/all/job/%(job)s/kernel/%(kernel)s/",
                "label": u"Boot reports for tree %(job)s - %(kernel)s"
            }
        ],
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": BASE_URL + u"/boot/all/job/%(job)s/",
        "host_url": request.host_url,
        "template_name": "boot_job_aggregate.html",
    }

    feed_data["entry_title"] = (
        u"%(kernel)s \u2014 %(failed_boots)s failed, " +
        u"%(other_boots)s unknown, %(passed_boots)s passed \u2013 " +
        u"%(total_boots)s total"
    )
    feed_data["subtitle"] = \
        u"Latest available boot reports for tree %s" % job
    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for Tree \u00AB%s\u00BB" % job

    return feed.create_feed(
        [
            ("aggregate", "kernel"),
            ("job", job),
            (
                "field",
                (
                    "created_on",
                    "git_branch",
                    "git_commit",
                    "git_describe",
                    "git_url",
                    "job",
                    "kernel"
                )
            )
        ],
        feed_data,
        _get_boot_data,
        _parse_aggregated_boot_results
    )
