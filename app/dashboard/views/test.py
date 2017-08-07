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
    abort,
    current_app as app,
    render_template,
    request,
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


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
        body_title = "Available Test Suite Reports"
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


class TestSuiteView(TestGenericView):

    def dispatch_request(self, **kwargs):
        suite = kwargs["suite"]

        page_title = "{:s} &mdash; {:s} Test Suite".format(PAGE_TITLE, suite)
        body_title = "Test Suite &#171;{:s}&#187;".format(suite)
        return render_template(
            "test-suite.html",
            page_title=page_title,
            body_title=body_title,
            suite=suite
        )
