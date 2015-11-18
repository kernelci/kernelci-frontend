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


class SocsGeneralView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    SOC_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "SoCs")
    RSS_LINK = (
        "<span class=\"rss-feed\">" +
        "<a href=\"%s\" title=\"Recent Changes - Atom Feed\">" +
        "<i class=\"fa fa-rss\"></i></a><span>"
    )


class SocsAllView(SocsGeneralView):
    def dispatch_request(self):
        body_title = "Available SoCs"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "base-all.html",
            table_id="socs-table",
            data_main="kci-socs-all",
            body_title=body_title,
            page_len=page_len,
            page_title=self.SOC_PAGES_TITLE,
            search_filter=search_filter
        )


class SocsSocView(SocsGeneralView):
    def dispatch_request(self, **kwargs):
        soc = kwargs["soc"]

        body_title = "Details for SoC &#171;%s&#187;" % soc
        page_title = "%s SoC" % soc
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, page_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "socs-soc.html",
            body_title=body_title,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter,
            soc=soc
        )


class SocsSocJobView(SocsGeneralView):
    def dispatch_request(self, **kwargs):
        soc = kwargs["soc"]
        job = kwargs["job"]

        body_title = (
            "Details for SoC &#171;%s&#187; with Tree &#171;%s&#187;" %
            (soc, job))
        page_title = "%s SoC with Tree %s" % (soc, job)
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, page_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "socs-soc-job.html",
            body_title=body_title,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter,
            soc=soc,
            job=job
        )
