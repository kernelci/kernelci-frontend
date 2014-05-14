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

from datetime import date

from flask import render_template
from flask.views import View


class BuildsView(View):

    def dispatch_request(self, *args, **kwargs):
        page_title = 'Kernel CI Dashboard &mdash; Builds'
        results_title = 'Available Builds'
        server_date = date.today()

        return render_template(
            'builds.html',
            page_title=page_title,
            server_date=server_date,
            results_title=results_title,
        )
