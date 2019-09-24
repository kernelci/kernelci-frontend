# Copyright (C) Linaro Limited 2015,2017,2019
# Author: Matt Hart <matthew.hart@linaro.org>
# Author: Milo Casagrande <milo.casagrande@linaro.org>
#
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

"""Contain all the generic views that do not need any sort of logic."""

from flask import (
    current_app as app,
    render_template
)
from flask.views import View


class GenericView(View):

    PAGE_TITLE = app.config.get("DEFAULT_PAGE_TITLE")


class FaqView(GenericView):

    def dispatch_request(self, *args, **kwargs):
        FAQ_TITLE = "%s &mdash; %s" % (self.PAGE_TITLE, "FAQ")
        return render_template("faq.html", page_title=FAQ_TITLE)


class ContactView(GenericView):

    def dispatch_request(self, *args, **kwargs):
        CONTACT_TITLE = "%s &mdash; %s" % (self.PAGE_TITLE, "Contact us")
        return render_template("contact.html", page_title=CONTACT_TITLE)


class AboutView(GenericView):

    def dispatch_request(self):
        ABOUT_TITLE = "%s &mdash; %s" % (self.PAGE_TITLE, "Info")
        return render_template("info.html", page_title=ABOUT_TITLE)


class StatisticsView(GenericView):

    def dispatch_request(self):
        page_title = "%s &mdash; %s" % (self.PAGE_TITLE, "Statistics")
        return render_template("stats.html", page_title=page_title)


class SponsorsView(GenericView):
    def dispatch_request(self):
        page_title = "%s &mdash; %s" % (
            self.PAGE_TITLE, "Sponsors &amp; Contributors")
        return render_template("sponsors.html", page_title=page_title)
