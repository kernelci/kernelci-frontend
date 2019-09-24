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

from flask import (
    current_app as app,
    render_template,
    request
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


class GeneralJobsView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    JOB_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Job Reports")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )


class JobsAllView(GeneralJobsView):
    def dispatch_request(self):
        body_title = "Available Jobs"
        search_filter, page_len = get_search_parameters(request)
        return render_template(
            "base-all.html",
            table_id="jobstable",
            data_main="kci-jobs-all",
            body_title=body_title,
            page_len=page_len,
            page_title=self.JOB_PAGES_TITLE,
            search_filter=search_filter
        )


class JobsJobView(GeneralJobsView):
    def dispatch_request(self, **kwargs):
        job = kwargs["job"]

        body_title = "Details for&nbsp;&#171;%s&#187;" % job
        body_title += self.RSS_LINK % ("/job/" + job + "/feed.xml")

        page_title = "%s &mdash; &#171;%s&#187; job" % (self.PAGE_TITLE, job)
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "jobs-job.html",
            body_title=body_title,
            job=job,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter
        )


class JobsJobBranchView(GeneralJobsView):
    def dispatch_request(self, **kwargs):
        job = kwargs["job"]
        old_branch_name = kwargs["branch"]
        branch_name = old_branch_name.replace(":", "/")

        body_title = "Details for &#171;%s&#187; <small>(%s)</small>" % (
            job, branch_name)
        body_title += self.RSS_LINK % \
            ("/job/" + job + "/branch/" + old_branch_name + "/feed.xml")

        page_title = (
            "%s &mdash; &#171;%s&#187; job (branch %s)" %
            (self.PAGE_TITLE, job, branch_name))
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "jobs-job-branch.html",
            body_title=body_title,
            branch_name=branch_name,
            job_name=job,
            page_title=page_title
        )
