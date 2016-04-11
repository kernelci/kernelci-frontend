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

import dashboard.utils.backend as backend

DISTINCT_SUITE_NAMES_URL = "{:s}/distinct/name/".format(
    app.config.get("TEST_SUITE_API_ENDPOINT"))
PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")


class TestGenericView(View):

    TESTS_PAGE_TITLE = "{:s} {:s}".format(PAGE_TITLE, "Tests Reports")


class TestsAllView(TestGenericView):

    def dispatch_request(self):

        body_title = "Available Test Suite Reports"

        data, status, headers = backend.request_get(
            backend.create_url(DISTINCT_SUITE_NAMES_URL), timeout=60*5)

        if status == 200:
            json_data = backend.extract_gzip_data(data, headers)

            return render_template(
                "tests-all.html",
                page_title=self.TESTS_PAGE_TITLE,
                body_title=body_title,
                test_suites=json_data["result"]
            )
        else:
            abort(status)


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
