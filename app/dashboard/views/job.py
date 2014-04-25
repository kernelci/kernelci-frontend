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

from bson import json_util
from flask import render_template
from flask.views import View

from dashboard.utils.backend import get_job, get_defconfigs


class JobsView(View):

    def dispatch_request(self):

        title = 'Kernel CI Dashboard &mdash; Jobs'

        return render_template(
            'jobs.html', page_title=title
        )


class JobView(View):

    def dispatch_request(self, **kwargs):

        title = 'Details for&nbsp;' + kwargs['job']

        kwargs['sort'] = 'created'
        kwargs['sort_order'] = -1

        response = get_job(**kwargs)

        kernel = {}
        if response.status_code == 200:
            kernel = json_util.loads(response.content)
            kernel['result'] = json_util.loads(kernel['result'])

        response = get_defconfigs(**kwargs)

        if response.status_code == 200:
            defconf = json_util.loads(response.content)
            defconf['result'] = json_util.loads(defconf['result'])
        else:
            defconf = {}

        return render_template(
            'job.html', page_title=title, kernel=kernel, defconf=defconf
        )


class JobIdView(View):

    def dispatch_request(self, **kwargs):

        job = kwargs['job']
        kernel = kwargs['kernel']
        job_id = '%s-%s' % (job, kernel)

        body_title = 'Details for&nbsp;%s&nbsp;&dash;&nbsp;%s' % (job, kernel)
        title = 'Kernel CI Dashboard &mdash;&nbsp;' + body_title

        params = {'id': job_id}
        response = get_job(**params)

        job_doc = {}
        if response.status_code == 200:
            job_doc = json_util.loads(response.content)
            job_doc['result'] = json_util.loads(job_doc['result'])

        return render_template(
            'job-kernel.html', page_title=title, body_title=body_title,
            job_doc=job_doc,
        )
