# Copyright (C) Collabora Limited 2020
# Author: Alexandra Pereira <alexandra.pereira@collabora.com>
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

class GeneralResultView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    JOB_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Result Reports")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )

class TestPlanAllView(GeneralResultView):
    def dispatch_request(self, **kwargs):
        tree_name = kwargs["tree"]
        branch_name = kwargs["branch"]
        kernel_name = kwargs["kernel"]

        body_title = "Details for tree&nbsp;&#171;%s&#187;" % tree_name

        page_title = "%s &mdash; &#171;%s&#187; tree_name" % (self.PAGE_TITLE, tree_name)
        search_filter, page_len = get_search_parameters(request)
      
        return render_template(
            "result-tree.html",
            body_title=body_title,
            table_id="testplantable",
            tree_name=tree_name,
            branch_name=branch_name,
            kernel_name=kernel_name,
            page_len=page_len,
            page_title=self.JOB_PAGES_TITLE,
            search_filter=search_filter
        )
        
