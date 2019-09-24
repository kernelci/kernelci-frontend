# Copyright (C) Linaro Limited 2014,2015,2016,2017,2019
# Author: Matt Hart <matthew.hart@linaro.org>
# Author: Milo Casagrande <milo.casagrande@linaro.org>
#
# Copyright (C) Collabora Limited 2018
# Author: Ana Guerrero Lopez <ana.guerrero@collabora.com>
#
# Copyright (C) Baylibre 2017
# Author: lollivier <lollivier@baylibre.com>
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

LOGGER_NAME = "kernelci-frontend"
SESSION_COOKIE_NAME = "linarokernelci"

# Following keys should be defined in an external file and passed as an
# environment variable called FLASK_SETTINGS, or in /etc/linaro in a file
# called kernelci-frontend.cfg.
PREFERRED_URL_SCHEME = "http"
# Add the trailing slash!
BACKEND_URL = "http://127.0.0.1:8888/"
BASE_URL = "http://127.0.0.1:5000"
BACKEND_TOKEN = None
BACKEND_TOKEN_HEADER = "Authorization"
SECRET_KEY = None
# Add the trailing slash!
FILE_SERVER_URL = "http://127.0.0.1/"
# Contact email address. to be used in RSS feed or other pages.
INFO_EMAIL = "info@example.org"

# This is the default page title common to all HTML pages.
DEFAULT_PAGE_TITLE = "Kernel CI Dashboard"

# Backend API endpoints.
JOB_API_ENDPOINT = "/job"
JOB_COMPARE_API_ENDPOINT = "/job/compare"
BUILD_API_ENDPOINT = "/build"
BUILD_COMPARE_API_ENDPOINT = "/build/compare"
BOOT_API_ENDPOINT = "/boot"
BOOT_COMPARE_API_ENDPOINT = "/boot/compare"
BOOT_REGRESSIONS_API_ENDPOINT = "/boot/regressions"
COUNT_API_ENDPOINT = "/count"
BATCH_API_ENDPOINT = "/batch"
BISECT_API_ENDPOINT = "/bisect"
LAB_API_ENDPOINT = "/lab"
VERSION_API_ENDPOINT = "/version"
DEFCONFIG_LOGS_ENPOINT = "/build/logs"
DEFCONFIG_ID_LOGS_ENPOINT = "/build/%s/logs"
STATISTICS_API_ENDPOINT = "/statistics"
JOB_LOGS_ENPOINT = "/job/logs"
JOB_ID_LOGS_ENPOINT = "/job/%s/logs"
TEST_GROUP_API_ENDPOINT = "/test/group"
TEST_CASE_API_ENDPOINT = "/test/case"

# Default date range to show the results. The higher the value, the more
# data will need to be loaded from the server and parsed. It can take time
# for the browser to show it all.
DATE_RANGE = 5

# Default range of how many results should be shown.
NUMBER_RANGE = 20

# Google Analytics code.
GOOGLE_ANALYTICS_ID = None

CACHE_TYPE = "simple"
CACHE_KEY_PREFIX = "kernelcifrontend|"
# Redis cache values.
CACHE_REDIS_HOST = "localhost"
CACHE_REDIS_PORT = 6379
CACHE_REDIS_DB = 0
CACHE_DEFAULT_TIMEOUT = 420

# Timeout seconds to connect and read from the remote server.
REQUEST_CONNECT_TIMEOUT = 10.0
REQUEST_READ_TIMEOUT = 35.0
# Backend requests pool size.
REQUEST_MIN_POOL_SIZE = 100
REQUEST_MAX_POOL_SIZE = 250

DEBUG = True
TESTING = DEBUG
THREADED = False
