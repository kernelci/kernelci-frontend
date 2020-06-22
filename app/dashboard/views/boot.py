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


class BootAllView(BootGeneralView):

    def dispatch_request(self):

        body_title = "Available Boot Reports"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-all.html",
            table_id="bootstable",
            data_main="kci-boots-all",
            page_len=page_len,
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
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
