# Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
    redirect,
    render_template,
    request,
    url_for
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


class BootGeneralView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    BOOT_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Boot Reports")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )


class BootAllJobKernelDefconfigView(BootGeneralView):
    def dispatch_request(self, **kwargs):

        page_title = self.BOOT_PAGES_TITLE + ""
        body_title = (
            "Boot Reports: &#171;{job} &ndash; {kernel}&#187;&nbsp;"
            "<small>({defconfig})</small>".format(**kwargs)
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


class BootAllJBKDView(BootGeneralView):
    def dispatch_request(self, **kwargs):

        page_title = self.BOOT_PAGES_TITLE + ""
        body_title = (
            "Boot Reports: &#171;{job} &ndash; {kernel}&#187;&nbsp;"
            "<small>({branch} &ndash; {defconfig})</small>".format(**kwargs)
        )
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-all-job-branch-kernel-defconfig.html",
            page_title=page_title,
            body_title=body_title,
            job=kwargs["job"],
            branch=kwargs["branch"],
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
            "Boot Reports for board&nbsp;&#171;%(board)s&#187;" % kwargs)

        return render_template(
            "boots-board-job-kernel-defconfig.html",
            page_title=page_title,
            body_title=body_title,
            board=kwargs["board"],
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            defconfig=kwargs["defconfig"],
        )


class BootBoardLabView(BootGeneralView):
    def dispatch_request(self, *args, **kwargs):

        boot_id = request.args.get("_id", None)
        if boot_id:
            return redirect(url_for("boot-id", **{"uid": boot_id}), code=301)
        else:
            page_title = (
                self.BOOT_PAGES_TITLE +
                "&nbsp;&dash;Board&nbsp;%(board)s&nbsp;(%(lab_name)s)" %
                kwargs)
            body_title = (
                "Boot Reports for board &#171;%(board)s&#187;&nbsp;"
                "<small>(%(lab_name)s)</small>" % kwargs)
            return render_template(
                "boots-board-lab.html",
                page_title=page_title,
                body_title=body_title,
                board=kwargs["board"],
                job=kwargs["job"],
                kernel=kwargs["kernel"],
                defconfig=kwargs["defconfig"],
                lab_name=kwargs["lab_name"]
            )

class BootJobKernelView(BootGeneralView):

    def dispatch_request(self, **kwargs):
        job = kwargs.get("job")
        kernel = kwargs.get("kernel")

        body_title = (
            "Boot Reports: &#171;{:s}&#187;&nbsp;&dash;&nbsp;".format(job))

        search_filter, _ = get_search_parameters(request)

        return render_template(
            "boots-job-kernel.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=job,
            kernel=kernel,
            search_filter=search_filter
        )


class BootAllJBKView(BootGeneralView):

    def dispatch_request(self, **kwargs):
        job = kwargs["job"]
        branch = kwargs["branch"]
        kernel = kwargs.get("kernel")

        body_title = (
            "Boot Reports: &#171;{:s}&#187;&nbsp;&ndash;&nbsp;".format(job))

        search_filter, _ = get_search_parameters(request)

        return render_template(
            "boots-all-jbk.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=job,
            branch=branch,
            kernel=kernel,
            search_filter=search_filter
        )


class BootAllJBView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        body_title = (
            "Boot Reports: &#171;{job:s}&#187;&nbsp;"
            "<small>({branch:s})</small>").format(**kwargs)

        search_filter, _ = get_search_parameters(request)

        return render_template(
            "boots-all-jb.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=kwargs["job"],
            branch=kwargs["branch"],
            search_filter=search_filter
        )

class BootLab(BootGeneralView):

    def dispatch_request(self, **kwargs):

        lab_name = kwargs["lab_name"]
        common_title = (
            "Boot reports for lab&nbsp;&#171;%s&#187;" % lab_name)

        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, common_title)
        body_title = common_title + self.RSS_LINK % (
            "/boot/all/lab/" + lab_name + "/feed.xml")

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-lab.html",
            page_title=page_title,
            body_title=body_title,
            lab_name=lab_name,
            page_len=page_len,
            search_filter=search_filter
        )

class BootBoardView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        board = kwargs["board"]
        body_title = \
            "Boot reports for board&nbsp;&#171;%s&#187;" % board
        body_title += \
            self.RSS_LINK % ("/boot/" + board + "/feed.xml")

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-board.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            board=board,
            page_len=page_len,
            search_filter=search_filter
        )
