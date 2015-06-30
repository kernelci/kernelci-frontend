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

LOGGER_NAME = 'kernelci-frontend'
SESSION_COOKIE_NAME = 'linarokernelci'

# Following keys should be defined in an external file and passed as an
# environment variable called FLASK_SETTINGS, or in /etc/linaro in a file
# called kernelci-frontend.cfg.
PREFERRED_URL_SCHEME = 'http'
# Add the trailing slash!
BACKEND_URL = 'http://127.0.0.1:8888/'
BASE_URL = 'http://127.0.0.1:5000'
BACKEND_TOKEN = 'foo'
BACKEND_TOKEN_HEADER = 'Authorization'
SECRET_KEY = 'bar'
# Add the trailing slash!
FILE_SERVER_URL = 'http://127.0.0.1/'
# Contact email address. to be used in RSS feed or other pages.
INFO_EMAIL = "info@example.org"

# This is the default page title common to all HTML pages.
DEFAULT_PAGE_TITLE = "Kernel CI Dashboard"

# The following structure is used to give translation rules to know
# git:// URLs.
# Parameters are as follows:
# 0. scheme
# 1. base path for web interface view
# 2. path to web interface commit view
# 3. list of tuples for replace rules
# Example:
# IN: git://git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git
# OUT: https://git.kernel.org/linux/kernel/git/khilman/linux.git
# OUT: git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git/?id=
KNOWN_GIT_URLS = {
    'git.kernel.org': (
        'https',
        '/cgit/%s',
        '/cgit/%s/commit/?id=',
        [('/pub/scm/', '')]
    ),
    'git.linaro.org': (
        'https',
        '%s',
        '%s/commitdiff/',
        [],
    ),
}

# Backend API endpoints.
JOB_API_ENDPOINT = '/job'
DEFCONFIG_API_ENDPOINT = '/defconfig'
BOOT_API_ENDPOINT = '/boot'
COUNT_API_ENDPOINT = '/count'
BATCH_API_ENDPOINT = '/batch'
BISECT_API_ENDPOINT = '/bisect'
LAB_API_ENDPOINT = '/lab'
VERSION_API_ENDPOINT = '/version'

# Default date range to show the results. The higher the value, the more
# data will need to be loaded from the server and parsed. It can take time
# for the browser to show it all.
DATE_RANGE = 5

# Default range of how many results should be shown.
NUMBER_RANGE = 20

# Google Analytics code.
GOOGLE_ANALYTICS_ID = None

# Redis cache values.
CACHE_TYPE = 'simple'
CACHE_KEY_PREFIX = 'kernelcifrontend|'
CACHE_REDIS_HOST = 'localhost'
CACHE_REDIS_PORT = 6379
CACHE_REDIS_DB = 0
CACHE_DEFAULT_TIMEOUT = 420

DEBUG = True
TESTING = DEBUG
THREADED = False
