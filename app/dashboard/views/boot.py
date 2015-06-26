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


from flask import (
    current_app as app,
    render_template,
    request,
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


class BootGeneralView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    BOOT_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Boot Reports")


class BootAllView(BootGeneralView):

    def dispatch_request(self):

        body_title = "Available Boot Reports"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-all.html",
            page_len=page_len,
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            search_filter=search_filter
        )


class BootAllJobKernelDefconfigView(BootGeneralView):
    def dispatch_request(self, **kwargs):

        page_title = self.BOOT_PAGES_TITLE + ""
        body_title = (
            "Boot reports for &#171;%(job)s - %(kernel)s&#187;&nbsp;"
            "<small>(%(defconfig)s)</small>" % kwargs
        )
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-all-job-kernel-defconfig.html",
            page_title=page_title,
            body_title=body_title,
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            defconfig=kwargs["defconfig"],
            search_filter=search_filter,
            page_len=page_len
        )


class BootDefconfigView(BootGeneralView):

    def dispatch_request(self, **kwargs):

        page_title = (
            self.BOOT_PAGES_TITLE + "&nbsp;&dash;Board&nbsp;%(board)s" %
            kwargs)
        body_title = (
            "Boot reports for board&nbsp;&#171;%(board)s&#187;" % kwargs)

        return render_template(
            "boots-board-job-kernel-defconfig.html",
            page_title=page_title,
            body_title=body_title,
            board=kwargs["board"],
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            defconfig=kwargs["defconfig"],
        )


class BootIdView(BootGeneralView):

    def dispatch_request(self, *args, **kwargs):

        page_title = (
            self.BOOT_PAGES_TITLE +
            "&nbsp;&dash;Board&nbsp;%(board)s&nbsp;(%(lab_name)s)" %
            kwargs
        )
        body_title = (
            "Boot details for board&nbsp;&#171;%(board)s&#187;&nbsp;"
            "<small>(%(lab_name)s)</small>" % kwargs
        )

        boot_id = request.args.get("_id", None)

        url_translation = app.config.get("KNOWN_GIT_URLS")
        return render_template(
            "boots-id.html",
            page_title=page_title,
            body_title=body_title,
            board=kwargs["board"],
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            defconfig=kwargs["defconfig"],
            url_translation=url_translation,
            lab_name=kwargs["lab_name"],
            boot_id=boot_id
        )


class BootJobKernelView(BootGeneralView):

    def dispatch_request(self, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]

        body_title = (
            "Boot details for&nbsp;&#171;%s&#187;&nbsp;&dash;&nbsp;%s" %
            (job, kernel)
        )

        search_filter, _ = get_search_parameters(request)

        return render_template(
            "boots-job-kernel.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=job,
            kernel=kernel,
            search_filter=search_filter
        )


class BootJobView(BootGeneralView):

    def dispatch_request(self, **kwargs):

        job = kwargs["job"]
        body_title = "Boot details for&nbsp;&#171;%s&#187;" % job
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-job.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=job,
            search_filter=search_filter,
            page_len=page_len
        )


class BootLab(BootGeneralView):

    def dispatch_request(self, **kwargs):

        lab_name = kwargs["lab_name"]
        body_title = (
            "Boot reports for lab&nbsp;&#171;%s&#187;" % lab_name)
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, body_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-lab.html",
            page_title=page_title,
            body_title=body_title,
            lab_name=lab_name,
            page_len=page_len,
            search_filter=search_filter
        )


class BootBoardJobKernelView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        body_title = (
            "Boot reports for&nbsp;&#171;%(job)s &dash; %(kernel)s&#187;"
            "&nbsp;<small>(%(board)s)</small>" %
            kwargs
        )

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-board-job-kernel.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            board=kwargs["board"],
            page_len=page_len,
            search_filter=search_filter
        )


class BootBoardView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        body_title = (
            "Boot reports for board&nbsp;&#171;%(board)s&#187;" %
            kwargs
        )

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-board.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            board=kwargs["board"],
            page_len=page_len,
            search_filter=search_filter
        )


class BootBoardJobView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        body_title = (
            "Boot reports for board&nbsp;&#171;%(board)s"
            "&#187;&nbsp;<small>(%(job)s)</small>" %
            kwargs
        )
        return render_template(
            "boots-board-job.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=kwargs["job"],
            board=kwargs["board"]
        )
