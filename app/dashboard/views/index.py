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
    render_template,
    request,
)
from flask.views import View

from dashboard.utils.backend import (
    is_mobile_browser,
    today_date,
)


class IndexView(View):

    def dispatch_request(self, *args, **kwargs):
        page_title = "Kernel CI Dashboard &mdash; Home"
        is_mobile = is_mobile_browser(request)

        return render_template(
            "index.html",
            is_mobile=is_mobile,
            page_title=page_title,
            server_date=today_date(),
        )
