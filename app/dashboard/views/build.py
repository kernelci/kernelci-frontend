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

from flask import (
    abort,
    render_template,
    request,
)

from flask.views import View

from dashboard.utils.backend import (
    extract_response_metadata,
    get_defconfig,
    get_job,
    today_date,
)

PAGE_TITLE = 'Kernel CI Dashboard &mdash; Builds'


class BuildsAllView(View):

    def dispatch_request(self, *args, **kwargs):
        results_title = 'Available Builds'

        search_filter = ""
        if request.args:
            search_filter = " ".join([arg for arg in request.args])

        return render_template(
            'builds-all.html',
            page_title=PAGE_TITLE,
            server_date=today_date(),
            results_title=results_title,
            search_filter=search_filter
        )


class BuildsJobKernelView(View):

    def dispatch_request(self, *args, **kwargs):
        job = kwargs['job']
        kernel = kwargs['kernel']

        job_id = '%s-%s' % (job, kernel)

        body_title = 'Build details for&nbsp;%s&nbsp;&dash;&nbsp;%s' % (
            job, kernel
        )

        params = {'id': job_id}
        response = get_job(**params)

        metadata = {}
        base_url = ''
        commit_url = ''

        if response.status_code == 200:
            metadata, base_url, commit_url, result = extract_response_metadata(
                response
            )

            return render_template(
                'builds-job-kernel.html',
                page_title=PAGE_TITLE,
                body_title=body_title,
                base_url=base_url,
                commit_url=commit_url,
                job_id=job_id,
                job=job,
                kernel=kernel,
                metadata=metadata,
            )
        else:
            abort(response.status_code)


class BuildsJobKernelDefconfigView(View):

    def dispatch_request(self, *args, **kwargs):
        job = kwargs['job']
        kernel = kwargs['kernel']
        defconfig = kwargs['defconfig']

        defconfig_id = job + '-' + kernel + '-' + defconfig

        body_title = 'Build details for&nbsp;%s&nbsp;&dash;&nbsp;%s' % (
            job, kernel)

        params = {'id': defconfig_id}
        response = get_defconfig(**params)

        if response.status_code == 200:

            metadata, base_url, commit_url, result = extract_response_metadata(
                response
            )

            return render_template(
                'builds-job-kernel-defconf.html',
                page_title=PAGE_TITLE,
                body_title=body_title,
                base_url=base_url,
                commit_url=commit_url,
                kernel=kernel,
                job=job,
                metadata=metadata,
                result=result,
            )
        else:
            abort(response.status_code)
