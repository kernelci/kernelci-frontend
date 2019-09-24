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

"""Job Atom feeds module."""

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
BACKEND_JOB_URL = backend.create_url(CONFIG_GET("JOB_API_ENDPOINT"))
BASE_URL = CONFIG_GET("BASE_URL")

FEED_TITLE = u"Built kernel \u00AB%(kernel)s\u00BB (%(git_branch)s)"

FRONTEND_JOB_URL = BASE_URL + u"/job/%(job)s/"
FRONTEND_JOB_BRANCH_URL = BASE_URL + u"/job/%(job)s/branch/%(git_branch)s/"

BUILD_REPORTS_URL = BASE_URL + u"/build/%(job)s/kernel/%(kernel)s/"
BOOT_REPORTS_URL = BASE_URL + u"/boot/all/job/%(job)s/kernel/%(kernel)s/"

# Some base categories for the feed.
FEED_CATEGORIES = [
    {"term": "job"},
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
        "failed_boots": u"N/A",
        "failed_builds": u"N/A",
        "other_boots": u"N/A",
        "other_builds": u"N/A",
        "passed_boots": u"N/A",
        "passed_builds": u"N/A",
        "total_boots": u"N/A",
        "total_builds": u"N/A"
    }

    if results and results["result"]:
        results = results["result"]

        for result in results:
            count_results[result["operation_id"]] = \
                result["result"][0]["count"]

        count_results["other_builds"] = (
            count_results["total_builds"] -
            count_results["passed_builds"] - count_results["failed_builds"]
        )

        count_results["other_boots"] = (
            count_results["total_boots"] -
            count_results["passed_boots"] - count_results["failed_boots"]
        )

    return count_results


def _get_job_counts(query_params):
    """Retrieve the builds and boots count.

    :param query_params: The result from the previous query to be used as
    parameter.
    :type query_params: dict
    :return: A dictionary with the buils and boots count.
    """
    queries = []

    query_params["job_id"] = query_params["_id"]["$oid"]
    query_str = "status=%(status)s&job=%(job)s&kernel=%(kernel)s"
    total_query_str = "job=%(job)s&kernel=%(kernel)s" % query_params

    # Get the totals.
    queries.append({
        "method": "GET",
        "operation_id": "total_builds",
        "resource": "count",
        "document": "build",
        "query": total_query_str
    })
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
            "operation_id": "passed_builds",
            "resource": "count",
            "document": "build",
            "query": query_str % query_params
        }
    )

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
            "operation_id": "failed_builds",
            "resource": "count",
            "document": "build",
            "query": query_str % query_params
        }
    )

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
            "failed_boots": u"N/A",
            "failed_builds": u"N/A",
            "other_boots": u"N/A",
            "other_builds": u"N/A",
            "passed_boots": u"N/A",
            "passed_builds": u"N/A",
            "total_boots": u"N/A",
            "total_builds": u"N/A"
        }

    return count_results


def _parse_job_results(results, feed_data):
    """Parse the job results from the backend to create the feed data.

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
            counts = _get_job_counts(copy.deepcopy(result))
            result.update(counts)

            content_links = copy.deepcopy(f_get("content_links", None))
            if content_links:
                for c_link in content_links:
                    c_link["href"] = c_link["href"] % result
                    c_link["label"] = c_link["label"] % result
                result["content_links"] = content_links

            job_date = feed.convert_date(result["created_on"]["$date"])

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
                "published": job_date,
                "title": f_get("entry_title") % result,
                "updated": job_date,
                "url": f_get("frontend_url") % result
            }

            yield parsed_res


def _get_job_data(req_params):
    """Retrieve the job data from the backend.

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
                "_id",
                "created_on",
                "git_branch",
                "git_branch",
                "git_commit",
                "git_url",
                "job",
                "kernel"
            )
        ),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]
    if req_params:
        params.extend(req_params)

    data, status, headers = backend.request_get(
        BACKEND_JOB_URL, params=params, timeout=60*60)

    if status == 200:
        results = backend.extract_gzip_data(data, headers)

    return results


def job_branch_feed(job, branch):
    """Create the Atom feed for job-branch view.

    :param job: The job name.
    :type job: str
    :param branch: The branch name.
    :type branch: str
    """
    # Replace the ':'' with the '/'' back.
    branch = branch.replace(":", "/", 1)

    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": job})
    feed_categories.append({"term": branch})

    feed_data = {
        "alternate_url": FRONTEND_JOB_BRANCH_URL,
        "branch": branch,
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": BUILD_REPORTS_URL, "label": u"Build reports"
            },
            {
                "href": BOOT_REPORTS_URL, "label": u"Boot reports"
            }
        ],
        "entry_title": FEED_TITLE,
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": FRONTEND_JOB_BRANCH_URL,
        "host_url": request.host_url,
        "template_name": "job.html",
    }

    feed_data["subtitle"] = \
        u"Latest available jobs for %s \u2013 %s" % (job, branch)
    feed_data["title"] = (
        u"kernelci.org \u2014 Jobs for Tree \u00AB%s\u00BB (%s) " %
        (job, branch))

    return feed.create_feed(
        [("job", job), ("git_branch", branch)],
        feed_data, _get_job_data, _parse_job_results)


def job_feed(job):
    """Create the Atom feed for job view.

    :param job: The job name.
    :type job: str
    """
    feed_categories = copy.deepcopy(FEED_CATEGORIES)
    feed_categories.append({"term": job})

    feed_data = {
        "alternate_url": FRONTEND_JOB_URL,
        "cache_key": hashlib.md5(request.url).digest(),
        "content_links": [
            {
                "href": BUILD_REPORTS_URL, "label": u"Build reports"
            },
            {
                "href": BOOT_REPORTS_URL, "label": u"Boot reports"
            }
        ],
        "entry_title": FEED_TITLE,
        "feed_categories": feed_categories,
        "feed_url": request.url,
        "frontend_url": FRONTEND_JOB_URL,
        "host_url": request.host_url,
        "template_name": "job.html",
    }

    feed_data["subtitle"] = u"Latest available jobs for %s" % job
    feed_data["title"] = \
        u"kernelci.org \u2014 Jobs for Tree \u00AB%s\u00BB" % job

    return feed.create_feed(
        [("job", job)], feed_data, _get_job_data, _parse_job_results)
