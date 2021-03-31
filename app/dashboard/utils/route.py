# Copyright (C) Collabora Limited 2020
# Author: Alexandra Pereira <alexandra.pereira@collabora.com>
#
# Copyright (C) Linaro Limited 2014,2015,2016,2017,2019
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

from flask import current_app as app

import dashboard.views.build as vbuild
import dashboard.views.generic as vgeneric
import dashboard.views.index as vindex
import dashboard.views.job as vjob
import dashboard.views.soc as vsoc
import dashboard.views.test as vtest

import dashboard.utils.feed.job as jobfeed
import dashboard.utils.feed.soc as socfeed


def init():
    # Save the function.
    add_rule = app.add_url_rule

    # General URLs.
    add_rule(
        "/",
        view_func=vindex.IndexView.as_view("index"),
        methods=["GET"]
    )
    add_rule(
        "/info/",
        view_func=vgeneric.AboutView.as_view("about"),
        methods=["GET"]
    )
    add_rule(
        "/stats/",
        view_func=vgeneric.StatisticsView.as_view("stats"),
        methods=["GET"]
    )

    # Builds related URLs.
    add_rule(
        "/build/",
        view_func=vbuild.BuildsAllView.as_view("builds"),
        methods=["GET"],
    )
    add_rule(
        "/build/all/",
        view_func=vbuild.BuildsAllView.as_view("all-builds"),
        methods=["GET"]
    )

    add_rule(
        "/build/<string:tree>/branch/<path:branch>/kernel/<string:kernel>/",
        view_func=vbuild.BuildsJobBranchKernelView.as_view(
            "job-branch-kernel-builds"),
        methods=["GET"]
    )
    add_rule(
        "/build/<string:tree>/branch/<path:branch>/kernel/latest/",
        view_func=vbuild.BuildsJobBranchKernelView.as_view(
            "job-branch-latest-builds"),
        methods=["GET"]
    )

    add_rule(
        "/build/<string:job>/kernel/<string:kernel>/",
        view_func=vbuild.BuildsJobKernelView.as_view("job-kernel-builds"),
        methods=["GET"]
    )
    add_rule(
        "/build/<string:job>/kernel/latest/",
        view_func=vbuild.BuildsJobKernelView.as_view(
            "job-kernel-latest-builds"),
        methods=["GET"]
    )
    add_rule(
        (
            "/build/<string:job>/kernel/<string:kernel>"
            "/defconfig/<string:defconfig>/"
        ),
        view_func=vbuild.BuildsJobKernelDefconfigView.as_view(
            "job-kernel-defconf"),
        methods=["GET"]
    )
    add_rule(
        (
            "/build/<string:job>/kernel/<string:kernel>"
            "/defconfig/<string:defconfig>/logs/"
        ),
        view_func=vbuild.BuildsLogsView.as_view("job-kernel-defconf-logs"),
        methods=["GET"]
    )
    add_rule(
        "/build/<string:job>/",
        view_func=vjob.JobsJobView.as_view("build-job"),
        methods=["GET"]
    )
    add_rule(
        "/build/id/<regex(\"[A-Za-z0-9]{24}\"):uid>/",
        view_func=vbuild.BuildsIdView.as_view("build-id"),
        methods=["GET"]
    )
    add_rule(
        "/build/id/<regex(\"[A-Za-z0-9]{24}\"):uid>/logs/",
        view_func=vbuild.BuildsIdLogsView.as_view("build-id-logs"),
        methods=["GET"]
    )

    # Jobs related URLs
    add_rule(
        "/job/",
        view_func=vjob.JobsAllView.as_view("all-jobs"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/",
        view_func=vjob.JobsJobView.as_view("job-name"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/feed.xml",
        "job-feed",
        jobfeed.job_feed,
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/branch/<path:branch>/",
        view_func=vjob.JobsJobBranchView.as_view("job-branch"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/branch/<path:branch>/feed.xml",
        "job-branch-feed",
        jobfeed.job_branch_feed,
        methods=["GET"]
    )

    # SoCs views.
    add_rule(
        "/soc/",
        view_func=vsoc.SocsAllView.as_view("socs-all-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/",
        view_func=vsoc.SocsSocView.as_view("socs-soc-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/feed.xml",
        "socs-soc-feed",
        socfeed.soc_feed,
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/",
        view_func=vsoc.SocsSocJobView.as_view("socs-soc-job-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/feed.xml",
        "socs-soc-job-feed",
        socfeed.soc_job_feed,
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/kernel/<string:kernel>/",
        view_func=vsoc.SocsSocJobKernelView.as_view(
            "socs-soc-job-kernel-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/kernel/<string:kernel>/plan/<string:plan>/",
        view_func=vsoc.SocsSocJobKernelPlanView.as_view(
            "socs-soc-job-kernel-plan-view"),
        methods=["GET"]
    )

    # Tests views.
    add_rule(
        "/test/",
        view_func=vtest.TestsAllView.as_view("tests-all-view"),
        methods=["GET"]
    )

    add_rule(
        "/test/plan/id/<regex(\"[0-9a-f]{24}\"):uid>/",
        view_func=vtest.TestsPlanIdView.as_view("tests-plan-id"),
        methods=["GET"]
    )

    add_rule(
        "/test/case/id/<regex(\"[0-9a-f]{24}\"):uid>/",
        view_func=vtest.TestsCaseIdView.as_view("tests-case-id"),
        methods=["GET"]
    )

    add_rule(
        (
            "/test/job/<string:job>/branch/<path:branch>/"
            "kernel/<string:kernel>/"
        ),
        view_func=vtest.TestJobBranchKernelView.
        as_view("test-job-branch-kernel"),
        methods=["GET"]
    )

    add_rule(
        (
            "/test/job/<string:job>/branch/<path:branch>/"
            "kernel/<string:kernel>/plan/<string:plan>/"
        ),
        view_func=vtest.TestJobBranchKernelPlanView.
        as_view("test-job-branch-kernel-plan"),
        methods=["GET"]
    )
