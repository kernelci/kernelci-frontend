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
