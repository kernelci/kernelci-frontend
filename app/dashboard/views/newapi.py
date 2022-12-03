# Copyright (C) 2022 Collabora LTD
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


class GeneralNewAPIView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    JOB_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Job Reports")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )


class APIJobsAllView(GeneralNewAPIView):
    def dispatch_request(self):
        body_title = "Available Jobs - New Kernel CI API"
        search_filter, page_len = get_search_parameters(request)
        return render_template(
            "base-all.html",
            table_id="jobstable",
            data_main="kci-new-api-jobs-all",
            body_title=body_title,
            page_len=page_len,
            page_title=self.JOB_PAGES_TITLE,
            search_filter=search_filter
        )


class APIJobBranchKernelView(GeneralNewAPIView):

    def dispatch_request(self, **kwargs):
        job, branch, kernel = (kwargs[k] for k in ['job', 'branch', 'kernel'])
        page_title = "{} &mdash; {}/{} {}".format(
            self.JOB_PAGES_TITLE, job, branch, kernel)
        body_title = (
            "Test Results: &#171;{}&#187 <small>({} / {})</small>".format(
                kernel, job, branch)
        )

        return render_template(
            "new-api-job-branch-kernel.html",
            page_title=page_title,
            body_title=body_title,
            job=job,
            branch=branch,
            kernel=kernel
        )

