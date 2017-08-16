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


class TestsBoardView(TestGenericView):

    def dispatch_request(self, **kwargs):
        board = kwargs["board"]

        body_title = "Test details for board &#171;%s&#187;" % board
        body_title += self.RSS_LINK % ("/test/board/" + board + "/feed.xml")

        page_title = "%s tests" % board
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, page_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "tests-board.html",
            body_title=body_title,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter,
            board=board
        )


class TestsBoardJobView(TestGenericView):
    def dispatch_request(self, **kwargs):
        board = kwargs["board"]
        job = kwargs["job"]

        body_title = "Details for Tree &#171;%s&#187;" % job
        body_title += \
            self.RSS_LINK % \
            ("/test/board/" + board + "/job/" + job + "/feed.xml")

        page_title = "%s tests: %s" % (board, job)
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, page_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "tests-board-job.html",
            body_title=body_title,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter,
            board=board,
            job=job
        )


class TestsBoardJobKernelView(TestGenericView):
    def dispatch_request(self, **kwargs):
        board = kwargs["board"]
        job = kwargs["job"]
        kernel = kwargs["kernel"]

        body_title = (
            "Details for Tree &#171;%s&#187; - %s" % (job, kernel))
        page_title = "%s tests: %s - %s" % (board, job, kernel)
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, page_title)

        DISTINCT_LAB_NAMES_URL = "{:s}/distinct/lab_name/".format(
            app.config.get("TEST_SUITE_API_ENDPOINT"))

        payload = {
            "board": board,
            "job": job,
            "kernel": kernel,
        }

        data, status, headers = backend.request_get(
            backend.create_url(DISTINCT_LAB_NAMES_URL),
            params=payload, timeout=60*5)

        if status == 200:
            json_data = backend.extract_gzip_data(data, headers)

            return render_template(
                "tests-board-job-kernel.html",
                body_title=body_title,
                page_title=page_title,
                board=board,
                job=job,
                kernel=kernel,
                lab_names=json_data["result"]
            )
        else:
            abort(status)


class TestsSuiteIdView(TestGenericView):

    def dispatch_request(self, **kwargs):
        return render_template(
            "tests-suite-id.html",
            suite_id=kwargs["uid"],
            page_title=self.TESTS_PAGE_TITLE)
