# Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
# This program is free software; you can redistribute it and/or modify it under
# the terms of the GNU Lesser General Public License as published by the Free
# Software Foundation; either version 2.1 of the License, or (at your option)
# any later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
# details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this library; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA

from flask import (
    current_app as app,
    render_template
)
from flask.views import View


class GenericCompareView(View):
    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")


class ChooseCompareView(GenericCompareView):

    def dispatch_request(self):
        page_title = "%s &mdash; %s" % \
            (self.PAGE_TITLE, "Compare jobs, builds and boots")
        return render_template(
            "choose-compare.html",
            page_title=page_title)


class JobCompareView(GenericCompareView):

    def dispatch_request(self, compare_id):
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, "Job comparison")
        return render_template(
            "job-compare.html",
            page_title=page_title,
            compare_id=compare_id
        )


class BuildCompareView(GenericCompareView):

    def dispatch_request(self, compare_id):
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, "Build comparison")
        return render_template(
            "build-compare.html",
            page_title=page_title,
            compare_id=compare_id
        )


class BootCompareView(GenericCompareView):

    def dispatch_request(self, compare_id):
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, "Boot comparison")
        return render_template(
            "boot-compare.html",
            page_title=page_title,
            compare_id=compare_id
        )
