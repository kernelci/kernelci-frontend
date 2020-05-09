# Copyright (C) Collabora Limited 2020
# Author: Alexandra Pereira <alexandra.pereira@collabora.com>
#
# Copyright (C) Linaro Limited 2016,2019
# Author: Matt Hart <matthew.hart@linaro.org>
# Author: Milo Casagrande <milo.casagrande@linaro.org>
#
# Copyright (C) Collabora Limited 2018
# Author: Ana Guerrero Lopez <ana.guerrero@collabora.com>
#
# Copyright (C) Baylibre 2017
# Author: lollivier <lollivier@baylibre.com>
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
    abort,
    current_app as app,
    render_template,
    request,
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters
import dashboard.utils.backend as backend


class TestGenericView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    TESTS_PAGE_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Tests Reports")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )


class TestsAllView(TestGenericView):

    def dispatch_request(self):
        body_title = "Available Test Results"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "base-all.html",
            table_id="tests-table",
            data_main="kci-tests-all",
            body_title=body_title,
            page_len=page_len,
            page_title=self.TESTS_PAGE_TITLE,
            search_filter=search_filter
        )


class TestsPlanIdView(TestGenericView):

    def dispatch_request(self, **kwargs):
        return render_template(
            "tests-plan-id.html",
            plan_id=kwargs["uid"],
            page_title=self.TESTS_PAGE_TITLE)


class TestsCaseIdView(TestGenericView):

    def dispatch_request(self, **kwargs):
        return render_template(
            "tests-case-id.html",
            case_id=kwargs["uid"],
            page_title=self.TESTS_PAGE_TITLE)


class TestJobBranchKernelView(TestGenericView):

    def dispatch_request(self, **kwargs):
        job, branch, kernel = (kwargs[k] for k in ['job', 'branch', 'kernel'])
        page_title = "{} &mdash; {}/{} {}".format(
            self.TESTS_PAGE_TITLE, job, branch, kernel)
        body_title = (
            "Test Results: &#171;{}&#187 - {} <small>({})</small>".format(
                job, kernel, branch)
        )

        return render_template(
            "tests-job-branch-kernel.html",
            page_title=page_title,
            body_title=body_title,
            job=job,
            branch=branch,
            kernel=kernel
        )

class TestJobBranchKernelPlanView(TestGenericView):

    def dispatch_request(self, **kwargs):
        job, branch, kernel, plan = (
            kwargs[k] for k in ['job', 'branch', 'kernel', 'plan'])
        page_title = "{} &mdash; {}/{} {} {}".format(
            self.TESTS_PAGE_TITLE, job, branch, kernel, plan)
        body_title = (
            "Details for {}: &#171;{}&#187 - {} <small>({})</small>".format(
                plan, job, kernel, branch)
        )

        return render_template(
            "tests-job-branch-kernel-plan.html",
            page_title=page_title,
            body_title=body_title,
            job=job,
            branch=branch,
            kernel=kernel,
            plan=plan
        )
