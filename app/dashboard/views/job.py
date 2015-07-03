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
    request
)
from flask.views import View

from dashboard.utils.backend import get_search_parameters


class GeneralJobsView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    JOB_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Job Reports")


class JobsAllView(GeneralJobsView):
    def dispatch_request(self):
        body_title = "Available Jobs"
        search_filter, page_len = get_search_parameters(request)
        return render_template(
            "jobs-all.html",
            body_title=body_title,
            page_len=page_len,
            page_title=self.JOB_PAGES_TITLE,
            search_filter=search_filter
        )


class JobsJobView(GeneralJobsView):
    def dispatch_request(self, **kwargs):
        job = kwargs["job"]
        body_title = "Details for&nbsp;&#171;%s&#187;" % job
        page_title = "%s &mdash; &#171;%s&#187; job" % (self.PAGE_TITLE, job)
        search_filter, page_len = get_search_parameters(request)
        return render_template(
            "jobs-job.html",
            body_title=body_title,
            job=job,
            page_len=page_len,
            page_title=page_title,
            search_filter=search_filter
        )


class JobsJobBranchView(GeneralJobsView):
    def dispatch_request(self, **kwargs):
        job_name = kwargs["job"]
        branch_name = kwargs["branch"]
        branch_name = branch_name.replace(":", "/")
        search_filter, page_len = get_search_parameters(request)
        body_title = (
            "Details for &#171;%s&#187; <small>"
            "(branch %s)</small>" % (job_name, branch_name))
        page_title = (
            "%s &mdash; &#171;%s&#187; job (branch %s)" %
            (self.PAGE_TITLE, job_name, branch_name))

        return render_template(
            "jobs-job-branch.html",
            body_title=body_title,
            branch_name=branch_name,
            job_name=job_name,
            page_title=page_title
        )
