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
    render_template,
    request,
)

from flask.views import View

from dashboard.utils.backend import (
    get_defconfig,
    get_job,
    get_search_parameters,
    is_mobile_browser,
    today_date,
    translate_git_url,
)

PAGE_TITLE = "Kernel CI Dashboard &mdash; Builds"


class BuildsAllView(View):

    def dispatch_request(self, *args, **kwargs):
        results_title = "Available Builds"

        is_mobile = is_mobile_browser(request)
        search_filter, page_len = get_search_parameters(request)

        return render_template(
            "builds-all.html",
            is_mobile=is_mobile,
            page_len=page_len,
            page_title=PAGE_TITLE,
            results_title=results_title,
            search_filter=search_filter,
            server_date=today_date(),
        )


class BuildsJobKernelView(View):

    def dispatch_request(self, *args, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]

        job_name = "%s-%s" % (job, kernel)

        body_title = "Build details for&nbsp;%s&nbsp;&dash;&nbsp;%s" % (
            job, kernel
        )

        params = {"name": job_name}
        response = get_job(**params)

        if response.status_code == 200:
            document = json.loads(response.content, encoding="utf_8")
            result = document.get("result", None)

            if result and len(result) == 1:
                result = result[0]
                res_get = result.get

                job_id = (res_get("_id")).get("$oid")
                base_url, commit_url = translate_git_url(
                    res_get("git_url", None),
                    res_get("git_commit", None)
                )

                return render_template(
                    "builds-job-kernel.html",
                    page_title=PAGE_TITLE,
                    body_title=body_title,
                    base_url=base_url,
                    commit_url=commit_url,
                    job_name=job_name,
                    job_id=job_id,
                    job=job,
                    kernel=kernel,
                    result=result,
                )
            else:
                abort(400)
        else:
            abort(response.status_code)


class BuildsJobKernelDefconfigView(View):

    def dispatch_request(self, *args, **kwargs):
        job = kwargs["job"]
        kernel = kwargs["kernel"]
        defconfig = kwargs["defconfig"]
        defconfig_id = request.args.get("_id", None)

        body_title = "Build details for&nbsp;%s&nbsp;&dash;&nbsp;%s" % (
            job, kernel)

        if defconfig_id:
            params = {"_id": defconfig_id}
        else:
            params = {
                "job": job, "kernel": kernel, "defconfig_full": defconfig
            }

        response = get_defconfig(**params)

        if response.status_code == 200:
            document = json.loads(response.content, encoding="utf_8")
            if document.get("count", 0) > 0:
                result = document.get("result", None)
                result = result[0]

                base_url, commit_url = translate_git_url(
                    result.get("git_url", None),
                    result.get("git_commit", None)
                )
                metadata = result.get("metadata", None)

                return render_template(
                    "builds-job-kernel-defconf.html",
                    page_title=PAGE_TITLE,
                    body_title=body_title,
                    base_url=base_url,
                    commit_url=commit_url,
                    kernel=kernel,
                    job=job,
                    result=result,
                    metadata=metadata,
                    defconfig_id=defconfig_id,
                )
            else:
                abort(404)
        else:
            abort(response.status_code)
