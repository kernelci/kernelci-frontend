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

"""All the build class based views."""

from flask import (
    current_app as app,
    render_template,
    request
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


class GeneralBuildsView(View):
    """Generic view for all the build ones."""

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    BUILD_PAGES_TITLE = u"%s &mdash; %s" % (PAGE_TITLE, "Build Reports")
    FEED_LINK = u"<a href=\"feed.atom\"><i class=\"fa fa-rss\"></i></a>"


class BuildsAllView(GeneralBuildsView):

    # pylint: disable=unused-argument
    def dispatch_request(self, *args, **kwargs):
        body_title = u"Available Builds"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "builds-all.html",
            page_len=page_len,
            page_title=self.BUILD_PAGES_TITLE,
            body_title=body_title,
            search_filter=search_filter,
        )


class BuildsJobKernelView(GeneralBuildsView):

    # pylint: disable=unused-argument
    def dispatch_request(self, *args, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]

        body_title = (
            "Build details for&nbsp;&#171;%s&#187;&nbsp;&dash;&nbsp;%s" %
            (job, kernel)
        )

        return render_template(
            "builds-job-kernel.html",
            page_title=self.BUILD_PAGES_TITLE,
            body_title=body_title,
            job=job,
            kernel=kernel
        )


class BuildsJobKernelDefconfigView(GeneralBuildsView):

    # pylint: disable=unused-argument
    def dispatch_request(self, *args, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]
        defconfig = kwargs["defconfig"]
        defconfig_id = request.args.get("_id", None)

        body_title = (
            "Build details for&nbsp;&#171;%s&#187;&nbsp;&dash;&nbsp;%s" %
            (job, kernel)
        )

        return render_template(
            "builds-job-kernel-defconfig.html",
            body_title=body_title,
            defconfig_full=defconfig,
            defconfig_id=defconfig_id,
            job_name=job,
            kernel_name=kernel,
            page_title=self.BUILD_PAGES_TITLE
        )


class BuildsLogsView(GeneralBuildsView):

    # pylint: disable=unused-argument
    def dispatch_request(self, *args, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]
        defconfig = kwargs["defconfig"]
        defconfig_id = request.args.get("_id", None)

        body_title = (
            "Build logs for&nbsp;&#171;%s&#187;&nbsp;&dash;&nbsp;%s" %
            (job, kernel)
        )

        return render_template(
            "builds-job-kernel-defconfig-logs.html",
            body_title=body_title,
            defconfig_full=defconfig,
            defconfig_id=defconfig_id,
            job_name=job,
            kernel_name=kernel,
            page_title=self.BUILD_PAGES_TITLE
        )
