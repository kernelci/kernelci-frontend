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

LOGGER_NAME = 'kernel-ci-frontend'
SESSION_COOKIE_NAME = 'linarokernelci'

# Following keys should be defined in an external file and passed as an
# environment variable called FLASK_SETTINGS.
PREFERRED_URL_SCHEME = 'http'
# Add the trailing slash!
BACKEND_URL = 'http://127.0.0.1:8888/'
BASE_URL = 'http://127.0.0.1:5000'
BACKEND_TOKEN = 'foo'
SECRET_KEY = 'bar'
# Add the trailing slash!
FILE_SERVER_URL = 'http://armcloud.us/kernel-ci/'

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


DEBUG = True
TESTING = DEBUG
