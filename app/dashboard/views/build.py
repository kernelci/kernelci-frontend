# Copyright (C) Linaro Limited 2014,2015,2016,2017,2019
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

"""All the build class based views."""

from flask import (
    abort,
    current_app as app,
    redirect,
    render_template,
    request,
    url_for
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters

# pylint: disable=unused-argument


class GeneralBuildsView(View):
    """Generic view for all the build ones."""

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    BUILD_PAGES_TITLE = u"%s &mdash; %s" % (PAGE_TITLE, "Build Reports")
    FEED_LINK = u"<a href=\"feed.xml\"><i class=\"fa fa-rss\"></i></a>"


class BuildsIdView(GeneralBuildsView):

    def dispatch_request(self, **kwargs):
        return render_template(
            "builds-id.html",
            build_id=kwargs["uid"], page_title=self.BUILD_PAGES_TITLE)


class BuildsAllView(GeneralBuildsView):

    def dispatch_request(self, *args, **kwargs):
        body_title = u"Available Builds"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "base-all.html",
            table_id="builds-table",
            data_main="kci-builds-all",
            page_len=page_len,
            page_title=self.BUILD_PAGES_TITLE,
            body_title=body_title,
            search_filter=search_filter,
        )


class BuildsJobKernelView(GeneralBuildsView):

    # pylint: disable=unused-argument
    def dispatch_request(self, *args, **kwargs):
        job = kwargs.get("job")
        kernel = kwargs.get("kernel")

        body_title = (
            "Build Reports: &#171;{}&#187 &ndash;&nbsp;".format(job)
        )

        return render_template(
            "builds-job-kernel.html",
            page_title=self.BUILD_PAGES_TITLE,
            body_title=body_title,
            job=job,
            kernel=kernel
        )


class BuildsJobBranchKernelView(GeneralBuildsView):

    def dispatch_request(self, *args, **kwargs):
        tree = kwargs["tree"]
        branch = kwargs["branch"]
        kernel = kwargs["kernel"]

        body_title = \
            "Build Reports: &#171;{}&#187; &ndash;&nbsp;".format(tree)

        return render_template(
            "builds-job-branch-kernel.html",
            page_title=self.BUILD_PAGES_TITLE,
            body_title=body_title,
            tree=tree,
            branch=branch,
            kernel=kernel
        )


class BuildsJobKernelDefconfigView(GeneralBuildsView):

    def dispatch_request(self, **kwargs):
        build_id = request.args.get("_id", None)

        if build_id:
            return redirect(url_for("build-id", **{"uid": build_id}), code=301)
        else:
            body_title = (
                u"Build Reports: &#171;{job:s}&#187; &ndash; {kernel:s}"
            ).format(**kwargs)

            return render_template(
                "builds-job-kernel-defconfig.html",
                page_title=self.BUILD_PAGES_TITLE,
                body_title=body_title,
                **kwargs
            )


class BuildsLogsView(GeneralBuildsView):

    def dispatch_request(self, *args, **kwargs):
        build_id = request.args.get("_id", None)

        if build_id:
            return redirect(
                url_for("build-id-logs", **{"uid": build_id}), code=301)
        else:
            abort(404)


class BuildsIdLogsView(GeneralBuildsView):

    def dispatch_request(self, **kwargs):
        return render_template(
            "builds-job-kernel-defconfig-logs.html",
            build_id=kwargs["uid"],
            page_title=self.BUILD_PAGES_TITLE
        )
