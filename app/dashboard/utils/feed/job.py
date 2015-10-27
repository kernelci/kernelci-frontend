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

import hashlib

import werkzeug.contrib.atom as watom

from flask import (
    current_app as app,
    request
)

import dashboard.utils.feed as feed
import dashboard.utils.backend as backend

from dashboard import __version__

CONFIG_GET = app.config.get

# Necessary URLs for the feed.
BACKEND_JOB_URL = backend.create_url(CONFIG_GET("JOB_API_ENDPOINT"))

FRONTEND_JOB_URL = CONFIG_GET("BASE_URL") + "/job/%(job)s/kernel/%(kernel)s/"
FRONTEND_JOB_BRANCH_URL = (
    CONFIG_GET("BASE_URL") +
    "/job/%(job)s/kernel/%(kernel)s/branch/%(branch)s/")

JOB_CONTENT_TEMPLATE = u"""
<div>
<dl>
<dt>Tree</dt><dd>%(job)s</dd>
<dt>Kernel</dt><dd>%(kernel)s</dd>
<dt>Git branch</dt><dd>%(git_branch)s</dd>
<dt>Git URL</dt><dd>%(git_url)s</dd>
<dt>Git commit</dt><dd>%(git_commit)s</dd>
<dt>Status</dt><dd>%(status)s</dd>
</dl>
</div>
"""

# Some categories for the feed.
FEED_CATEGORIES = [
    {"term": "job"},
    {"term": "ci"},
    {"term": "linux"}
]


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
        job_link = FRONTEND_JOB_URL

        if branch:
            job_link = FRONTEND_JOB_BRANCH_URL
            result["branch"] = branch[1]

        job_link = job_link % result
        job_date = feed.convert_date(result["created_on"]["$date"])

        parsed_res = {
            "content": JOB_CONTENT_TEMPLATE % result,
            "links": [
                {"href": job_link, "rel": "alternate"}
            ],
            "published": job_date,
            "title": u"%(job)s \u2013 %(kernel)s \u2014 %(status)s" % result,
            "updated": job_date,
            "url": job_link
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
                "kernel",
                "status"
            )
        ),
        ("job", job),
        ("sort", "created_on"),
        ("sort_order", -1)
    ]
    if branch:
        params.append(("git_branch", branch[0]))

    print params

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
        u"kernelci.org \u2014 Jobs for Tree: \u00AB%s\u00BB (%s)" %
        (job, branch[0])
    )
    subtitle = u"Latest available jobs for %s \u2013 %s" % (job, branch[0])

    return _create_job_feed(
        job, cache_key, title, subtitle, feed_url, branch=branch)


def job_feed(job):
    """Create the Atom feed for job views."""
    feed_url = request.url
    cache_key = hashlib.md5(feed_url).digest()
    title = u"kernelci.org \u2014 Jobs for Tree: \u00AB%s\u00BB" % job
    subtitle = u"Latest available jobs for %s" % job

    return _create_job_feed(job, cache_key, title, subtitle, feed_url)
