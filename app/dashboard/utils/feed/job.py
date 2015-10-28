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

try:
    import simple_json as json
except ImportError:
    import json

import copy
import hashlib

import werkzeug.contrib.atom as watom

from flask import (
    current_app as app,
    request
)

import dashboard.utils.backend as backend
import dashboard.utils.feed as feed

from dashboard import __version__

CONFIG_GET = app.config.get

# Necessary URLs for the feed.
BACKEND_JOB_URL = backend.create_url(CONFIG_GET("JOB_API_ENDPOINT"))

FRONTEND_JOB_KERNEL_URL = \
    CONFIG_GET("BASE_URL") + "/job/%(job)s/kernel/%(kernel)s/"
FRONTEND_JOB_URL = CONFIG_GET("BASE_URL") + "/job/%(job)s/"
FRONTEND_JOB_BRANCH_URL = \
    CONFIG_GET("BASE_URL") + "/job/%(job)s/branch/%(branch)s/"

FEED_TITLE = u"Built kernel \u00AB%(kernel)s\u00BB (%(git_branch)s)"

JOB_CONTENT_TEMPLATE = u"""
<div>
<div>
<h3>Overview</h3>
<dl>
<dt>Tree</dt><dd>%(job)s</dd>
<dt>Kernel</dt><dd>%(kernel)s</dd>
<dt>Git branch</dt><dd>%(git_branch)s</dd>
<dt>Git URL</dt><dd>%(git_url)s</dd>
<dt>Git commit</dt><dd>%(git_commit)s</dd>
</dl>
</div>
<div>
<h3>Build and Boot Reports Count</h3>
<h4>Build Reports</h4>
<div>
Total: %(total_builds)s
<br/>
Passed: %(passed_builds)s
<br/>
Failed: %(failed_builds)s
<br/>
Other: %(other_builds)s
</div>
<h4>Boot Reports</h4>
<div>
Total: %(total_boots)s
<br/>
Passed: %(passed_boots)s
<br/>
Failed: %(failed_boots)s
<br/>
Other: %(other_boots)s
</div>
</div>
<div>
<h3>Links</h3>
<div>
<ul>
<li><a href="/build/%(job)s/kernel/%(kernel)s/">Build reports</a></li>
<li><a href="/boot/all/job/%(job)s/kernel/%(kernel)s/">Boot reports</a></li>
</ul>
</div>
</div>
</div>
"""

# Some categories for the feed.
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


def _parse_job_results(results, branch=None):
    """Parse the job results from the backend to create the feed data.

    :param results: The results from the backend, a list of dicts.
    :type results: list
    :param branch: The branch value, if it was specified. A list with two
    values: the correct branch name, the branch name for URLs.
    :type branch: list
    :return: Yield a dictionary with the correct values for the feed entry.
    """
    for result in results:
        counts = _get_job_counts(copy.deepcopy(result))
        result.update(counts)

        alternate_link = FRONTEND_JOB_URL
        if branch:
            alternate_link = FRONTEND_JOB_BRANCH_URL
            result["branch"] = branch[1]

        job_date = feed.convert_date(result["created_on"]["$date"])

        parsed_res = {
            "content": JOB_CONTENT_TEMPLATE % result,
            "links": [
                {"href": alternate_link, "rel": "alternate"}
            ],
            "published": job_date,
            "title": FEED_TITLE % result,
            "updated": job_date,
            "url": FRONTEND_JOB_KERNEL_URL % result
        }

        yield parsed_res


def _get_job_data(job, branch=None):
    """Retrieve the job data from the backend.

    :param job: The job name.
    :type job: str
    :param branch: The branch value, if it was specified. A list with two
    values: the correct branch name, the branch name for URLs.
    :type branch: list
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
                "git_commit",
                "git_url",
                "job",
                "kernel"
            )
        ),
        ("job", job),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]
    if branch:
        params.append(("git_branch", branch[0]))

    data, status, headers = backend.request_get(
        BACKEND_JOB_URL, params=params, timeout=60*60)

    if status == 200:
        results = backend.extract_gzip_data(data, headers)

    return results


def _create_job_feed(job, cache_key, title, subtitle, feed_url, branch=None):
    """Create the job Atom feed.

    :param job: The job name.
    :type job: str
    :param cache_key: The key name for the cache.
    :type cache_key: str
    :pram title: The title for the Atom feed.
    :type title: unicode
    :param subtitle: The subtitle for the Atom feed.
    :type subtitle: unicode
    :param feed_url: The URL of the feed.
    :type feed_url: str
    :param branch: The branch value, if it was specified. A list with two
    values: the correct branch name, the branch name for URLs.
    :type branch: list
    :return: The Atom feed response.
    """
    job_feed = app.cache.get(cache_key)

    if not job_feed:
        host_url = request.host_url

        job_feed = watom.AtomFeed(
            title,
            title_type="text",
            feed_url=feed_url,
            url=host_url,
            subtitle=subtitle,
            generator=(feed.AUTHOR_NAME, host_url, __version__),
            author=feed.AUTHOR_NAME
        )

        results = _get_job_data(job, branch=branch)
        if results:
            for parsed in _parse_job_results(results["result"], branch=branch):
                p_get = parsed.get
                job_feed.add(
                    categories=FEED_CATEGORIES,
                    content=p_get("content"),
                    content_type="html",
                    links=p_get("links"),
                    published=p_get("published"),
                    title=p_get("title"),
                    title_type="text",
                    updated=p_get("updated"),
                    url=p_get("url")
                )

        job_feed = job_feed.get_response()
        app.cache.set(cache_key, job_feed, timeout=60*60)

    return job_feed


def job_branch_feed(job, branch):
    """Create the Atom feed for job/branch views."""
    feed_url = request.url
    cache_key = hashlib.md5(feed_url).digest()
    # Replace the ':'' with the '/'' back, but keep both versions.
    branch = [branch.replace(":", "/", 1), branch]

    title = (
        u"kernelci.org \u2014 Jobs for Tree \u00AB%s\u00BB (%s)" %
        (job, branch[0])
    )
    subtitle = u"Latest available jobs for %s \u2013 %s" % (job, branch[0])

    return _create_job_feed(
        job, cache_key, title, subtitle, feed_url, branch=branch)


def job_feed(job):
    """Create the Atom feed for job views."""
    feed_url = request.url
    cache_key = hashlib.md5(feed_url).digest()
    title = u"kernelci.org \u2014 Jobs for Tree \u00AB%s\u00BB" % job
    subtitle = u"Latest available jobs for %s" % job

    return _create_job_feed(job, cache_key, title, subtitle, feed_url)
