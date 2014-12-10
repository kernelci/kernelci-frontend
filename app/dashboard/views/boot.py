# Copyright (C) 2014 Linaro Ltd.
#
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

try:
    import simplejson as json
except ImportError:
    import json

from flask import (
    abort,
    current_app as app,
    render_template,
    request,
)

from flask.views import View

from dashboard.utils.backend import (
    get_job,
    get_search_parameters,
    today_date,
    translate_git_url,
)


class BootGeneralView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")
    BOOT_PAGES_TITLE = "%s &mdash; %s" % (PAGE_TITLE, "Boot Reports")


class BootAllView(BootGeneralView):

    def dispatch_request(self):

        results_title = "Available Boot Reports"
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-all.html",
            page_len=page_len,
            page_title=self.BOOT_PAGES_TITLE,
            results_title=results_title,
            search_filter=search_filter,
            server_date=today_date(),
        )


class BootDefconfigView(BootGeneralView):

    def dispatch_request(self, **kwargs):

        page_title = (
            self.BOOT_PAGES_TITLE + "&nbsp;&dash;Board&nbsp;%(board)s" %
            kwargs
        )
        body_title = (
            "Boot reports for board&nbsp;&#171;%(board)s&#187;" % kwargs)

        url_translation = app.config.get("KNOWN_GIT_URLS")

        return render_template(
            "boots-job-kernel-defconfig.html",
            page_title=page_title,
            body_title=body_title,
            board=kwargs["board"],
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            defconfig=kwargs["defconfig"],
            url_translation=url_translation,
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
            boot_id=boot_id,
        )


class BootJobKernelView(BootGeneralView):

    def dispatch_request(self, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]

        body_title = body_title = (
            "Boot details for&nbsp;&#171;%s&#187;&nbsp;&dash;&nbsp;%s" %
            (job, kernel)
        )

        params = {"job": job, "kernel": kernel}
        response = get_job(**params)

        base_url = ""
        commit_url = ""

        if response.status_code == 200:
            document = json.loads(response.content, encoding="utf_8")
            result = document.get("result", None)

            if result and len(result) == 1:
                result = result[0]
                res_get = result.get

                job_id = (res_get("_id")).get("$oid")
                storage_id = "boot-" + job_id

                base_url, commit_url = translate_git_url(
                    res_get("git_url", None),
                    res_get("git_commit", None)
                )

                return render_template(
                    "boots-job-kernel.html",
                    page_title=self.BOOT_PAGES_TITLE,
                    body_title=body_title,
                    base_url=base_url,
                    commit_url=commit_url,
                    job_id=job_id,
                    job=job,
                    kernel=kernel,
                    result=result,
                    storage_id=storage_id,
                )
            else:
                abort(400)
        else:
            abort(response.status_code)


class BootJobView(BootGeneralView):

    def dispatch_request(self, **kwargs):

        job = kwargs["job"]
        body_title = "Boot details for&nbsp;&#171;%s&#187;" % job

        return render_template(
            "boots-job.html",
            page_title=self.BOOT_PAGES_TITLE,
            body_title=body_title,
            job=job,
        )


class BootLab(BootGeneralView):

    def dispatch_request(self, **kwargs):

        lab_name = kwargs["lab_name"]
        results_title = (
            "Boot reports for lab&nbsp;&#171;%s&#187;" % lab_name)
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, results_title)

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-lab.html",
            page_title=page_title,
            results_title=results_title,
            lab_name=lab_name,
            page_len=page_len,
            search_filter=search_filter
        )


class BootBoardJobKernelView(BootGeneralView):
    def dispatch_request(self, **kwargs):
        page_title = self.PAGE_TITLE
        body_title = (
            "Boot reports for&nbsp;&#171;%(job)s &dash; %(kernel)s&#187;"
            "&nbsp;<small>(%(board)s)</small>" %
            kwargs
        )

        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "boots-board-job-kernel.html",
            page_title=page_title,
            body_title=body_title,
            job=kwargs["job"],
            kernel=kwargs["kernel"],
            board=kwargs["board"],
            page_len=page_len,
            search_filter=search_filter
        )
