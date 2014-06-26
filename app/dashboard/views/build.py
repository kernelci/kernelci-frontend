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

import urlparse

from bson import json_util
from flask import (
    abort,
    render_template,
    current_app as app,
)
from flask.views import View

from dashboard.utils.backend import (
    get_defconfig,
    get_job,
    today_date,
)

PAGE_TITLE = 'Kernel CI Dashboard &mdash; Builds'


def _extract_response_data(response):

    metadata = {}
    base_url = ''
    commit_url = ''
    result = {}

    document = json_util.loads(response.content)
    document['result'] = json_util.loads(document['result'])

    if document.get('result', None):
        result = document['result']
        metadata = result.get('metadata', None)

        if metadata:
            git_url = metadata.get('git_url', None)
            commit_id = metadata.get('git_commit', None)

            if git_url and commit_id:
                t_url = urlparse.urlparse(git_url)
                known_git_urls = app.config.get('KNOWN_GIT_URLS')

                if t_url.netloc in known_git_urls.keys():
                    known_git = known_git_urls.get(t_url.netloc)

                    path = t_url.path
                    for replace_rule in known_git[3]:
                        path = path.replace(*replace_rule)

                    base_url = urlparse.urlunparse((
                        known_git[0], t_url.netloc, known_git[1] % path,
                        '', '', ''
                    ))
                    commit_url = urlparse.urlunparse((
                        known_git[0], t_url.netloc,
                        (known_git[2] % path) + commit_id,
                        '', '', ''
                    ))

    return metadata, base_url, commit_url, result


class BuildsAllView(View):

    def dispatch_request(self, *args, **kwargs):
        results_title = 'Available Builds'

        return render_template(
            'builds-all.html',
            page_title=PAGE_TITLE,
            server_date=today_date(),
            results_title=results_title,
        )


class BuildsJobKernelView(View):

    def dispatch_request(self, *args, **kwargs):
        job_id = '%s-%s' % (kwargs['job'], kwargs['kernel'])

        body_title = 'Details for&nbsp;%s&nbsp;&dash;&nbsp;%s' % (
            kwargs['job'], kwargs['kernel'])

        params = {'id': job_id}
        response = get_job(**params)

        metadata = {}
        base_url = ''
        commit_url = ''

        if response.status_code == 200:
            metadata, base_url, commit_url, result = _extract_response_data(
                response
            )

            return render_template(
                'builds-job-kernel.html', page_title=PAGE_TITLE,
                body_title=body_title,
                base_url=base_url, commit_url=commit_url,
                job_id=job_id, job=kwargs['job'], metadata=metadata,
            )
        else:
            abort(response.status_code)


class BuildsJobKernelDefconfigView(View):

    def dispatch_request(self, *args, **kwargs):
        job = kwargs['job']
        kernel = kwargs['kernel']
        defconfig = kwargs['defconfig']

        defconfig_id = job + '-' + kernel + '-' + defconfig

        body_title = 'Details for&nbsp;%s&nbsp;&dash;&nbsp;%s' % (
            job, kernel)

        params = {'id': defconfig_id}
        response = get_defconfig(**params)

        if response.status_code == 200:

            metadata, base_url, commit_url, result = _extract_response_data(
                response
            )

            job_doc = json_util.loads(response.content)
            job_doc['result'] = json_util.loads(job_doc['result'])

            if job_doc.get('result', None):
                metadata = job_doc['result'].get('metadata', None)
                if metadata:
                    git_url = metadata.get('git_url', None)
                    commit_id = metadata.get('git_commit', None)

                    if git_url and commit_id:
                        t_url = urlparse.urlparse(git_url)

                        known_git_urls = app.config.get('KNOWN_GIT_URLS')

                        if t_url.netloc in known_git_urls.keys():
                            known_git = known_git_urls.get(t_url.netloc)

                            path = t_url.path
                            for replace_rule in known_git[3]:
                                path = path.replace(*replace_rule)

                            base_url = urlparse.urlunparse((
                                known_git[0], t_url.netloc, known_git[1] % path,
                                '', '', ''
                            ))
                            commit_url = urlparse.urlunparse((
                                known_git[0], t_url.netloc,
                                (known_git[2] % path) + commit_id,
                                '', '', ''
                            ))

            return render_template(
                'builds-job-kernel-defconf.html', page_title=PAGE_TITLE,
                body_title=body_title,
                base_url=base_url, commit_url=commit_url,
                job=kwargs['job'], metadata=metadata, result=result,
            )
        else:
            abort(response.status_code)
