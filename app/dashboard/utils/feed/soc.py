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

"""SoC Atom feeds module."""

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
BACKEND_BATCH_URL = backend.create_url(CONFIG_GET("BATCH_API_ENDPOINT"))
BASE_URL = CONFIG_GET("BASE_URL")

SOC_JOB_TITLE = (
    u"%(job)s (%(git_branch)s) boot: %(failed_boots)s failed, "
    u"%(passed_boots)s passed, %(other_boots)s unknown, %(total_boots)s total")
SOC_KERNEL_TITLE = (
    u"%(kernel)s boot: %(failed_boots)s failed, "
    u"%(passed_boots)s passed, %(other_boots)s unknown, %(total_boots)s total")

FRONTEND_SOC_URL = BASE_URL + u"/soc/%(mach)s/"
FRONTEND_SOC_JOB_URL = BASE_URL + u"/soc/%(mach)s/job/%(job)s/"

FRONTEND_JOB_URL = BASE_URL + u"/job/%(job)s/"

BOOT_REPORTS_URL = BASE_URL + u"/boot/all/job/%(job)s/kernel/%(kernel)s/"
BOOT_JOB_REPORTS_URL = BASE_URL + u"/boot/all/job/%(job)s/"

# Some base categories for the feed.
FEED_CATEGORIES = [
    {"term": "soc"},
    {"term": "ci"},
    {"term": "linux"}
]


def _parse_batch_results(results):
    """Parse the batch results.

    :param results: The results from the prev query.
    :type results: dict
    :return: A dictionary with the counts.
    """
    count_results = {
        "failed_boots": 0,
        "other_boots": 0,
        "passed_boots": 0,
        "total_boots": 0
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


def _get_boot_counts(query_params):
    """Retrieve the builds and boots count.

    :param query_params: The result from the previous query to be used as
    parameter.
    :type query_params: dict
    :return: A dictionary with the buils and boots count.
    """
    queries = []

    query_str = "status=%(status)s&job=%(job)s&mach=%(mach)s"
    total_query_str = "job=%(job)s&mach=%(mach)s" % query_params

    if query_params.get("job_id", None):
        query_str += "&job_id=" + query_params["job_id"]["$oid"]
        total_query_str += "&job_id=" + query_params["job_id"]["$oid"]

    # In the aggregation result, the _id field is the one that gets aggregated.
    if all([query_params["kernel"],
            query_params["kernel"] == query_params.get("_id", None)]):
        query_str += "&kernel=" + query_params["kernel"]
        total_query_str += "&kernel=" + query_params["kernel"]

    # Get the totals.
    queries.append({
        "method": "GET",
        "operation_id": "total_boots",
        "resource": "count",
        "document": "boot",
        "query": total_query_str
    })

    # Get the passed ones first.
    query_params["status"] = "PASS"
    queries.append(
        {
            "method": "GET",
            "operation_id": "passed_boots",
            "resource": "count",
            "document": "boot",
            "query": query_str % query_params
        }
    )

    # Then the failed ones.
    query_params["status"] = "FAIL"
    queries.append(
        {
            "method": "GET",
            "operation_id": "failed_boots",
            "resource": "count",
            "document": "boot",
            "query": query_str % query_params
        }
    )

    data, status, headers = backend.request_post(
        BACKEND_BATCH_URL,
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
            "total_boots": 0
        }

    return count_results


def _parse_soc_results(results, feed_data):
    """Parse the boot results from the backend to create the feed data.

    :param results: The results from the backend, a list of dicts.
    :type results: list
    :param feed_data: The feed data structure.
    :type feed_data: dict
    :return: Yield a dictionary with the correct values for the feed entry.
    """
    if results and results["result"]:
        results = results["result"]
        f_get = feed_data.get

        for result in results:
            result.update(_get_boot_counts(copy.deepcopy(result)))

            content_links = copy.deepcopy(f_get("content_links", None))
            if content_links:
                for c_link in content_links:
                    c_link["href"] = c_link["href"] % result
                    c_link["label"] = c_link["label"] % result
                result["content_links"] = content_links

            boot_date = feed.convert_date(result["created_on"]["$date"])

            # pylint: disable=star-args
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


def _get_soc_data(req_params):
    """Retrieve the SoC data from the backend.

    :param req_params: The parameters for the request. They will be added to
    the default ones.
    :type req_params: dict
    :return: The results from the backend.
    """
    results = []
    params = [
        ("date_range", 1),
        (
            "field",
            (
                "build_id",
                "created_on",
                "git_branch",
                "git_commit",
                "git_url",
                "job",
                "job_id",
                "kernel",
                "mach"
            )
        ),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]
    if req_params:
        params.extend(req_params)

    data, status, headers = backend.request_get(
        BACKEND_BOOT_URL, params=params, timeout=60*60)

    if status == 200:
        results = backend.extract_gzip_data(data, headers)

    return results


def soc_job_feed(soc, job):
    """Create the Atom feed for soc/job view.

    :param soc: The soc value.
    :param job: The job value.
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": soc})
    feed_categories.append({"term": job})

    feed_data = {
        "alternate_url": FRONTEND_SOC_JOB_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": FRONTEND_SOC_JOB_URL, "label": u"SoC boot reports"
            },
            {
                "href": BOOT_REPORTS_URL, "label": u"Boot reports"
            },
            {
                "href": FRONTEND_JOB_URL, "label": u"Job details"
            }
        ],
        "entry_title": SOC_KERNEL_TITLE,
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": FRONTEND_SOC_JOB_URL,
        "host_url": request.host_url,
        "template_name": "soc-job-kernel.html",
    }

    feed_data["subtitle"] = \
        u"Latest available kernels tested for %s - %s" % (soc, job)
    feed_data["title"] = (
        u"kernelci.org \u2014 Boot Reports for SoC \u00AB%s\u00BB - %s" %
        (soc, job))

    return feed.create_feed(
        [
            ("aggregate", "kernel"),
            ("mach", soc),
            ("job", job)
        ],
        feed_data,
        _get_soc_data,
        _parse_soc_results
    )


def soc_feed(soc):
    """Create the Atom feed for soc view.

    :param soc: The soc value.
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": soc})

    feed_data = {
        "alternate_url": FRONTEND_SOC_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": FRONTEND_SOC_JOB_URL, "label": u"SoC boot reports"
            },
            {
                "href": BOOT_JOB_REPORTS_URL, "label": u"All boot reports"
            },
            {
                "href": FRONTEND_JOB_URL, "label": u"Job details"
            }
        ],
        "entry_title": SOC_JOB_TITLE,
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": FRONTEND_SOC_URL,
        "host_url": request.host_url,
        "template_name": "soc-job.html",
    }

    feed_data["subtitle"] = u"Latest available trees tested for %s" % soc
    feed_data["title"] = \
        u"kernelci.org \u2014 Boot Reports for SoC \u00AB%s\u00BB" % soc

    return feed.create_feed(
        [
            ("aggregate", "job"),
            ("mach", soc)
        ],
        feed_data,
        _get_soc_data,
        _parse_soc_results
    )
