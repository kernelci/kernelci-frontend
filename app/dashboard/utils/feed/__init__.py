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

import bson
import datetime

from flask import current_app as app

CONFIG_GET = app.config.get

AUTHOR_NAME = "kernelci.org Atom Feed Bot"

AUTHOR = {
    "name": AUTHOR_NAME,
    "email": CONFIG_GET("INFO_EMAIL"),
    "uri": CONFIG_GET("BASE_URL")
}


@app.cache.memoize(timeout=60*60*12)
def convert_date(timestamp):
    """Convert a milliseconds timestamp into a datetime object.

    :param timestamp: Milliseconds from epoch time.
    :return: A datetime object.
    """
    return datetime.datetime.fromtimestamp(
        timestamp / 1000, tz=bson.tz_util.utc)
