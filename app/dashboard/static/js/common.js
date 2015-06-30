// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// No trailing .js here!!!
var jqueryURL =
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min';
var bootstrapURL =
    'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.5/js/bootstrap.min';
var uriURL = 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.15.1/URI.min';
var sprintfURL =
    'https://cdnjs.cloudflare.com/ajax/libs/sprintf/1.0.1/sprintf.min';
var d3URL = 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min';
var dtURL =
    'https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.7/js/jquery.dataTables.min';
var dtBootstrapURL = 'https://cdn.datatables.net/plug-ins/1.10.7/integration/bootstrap/3/dataTables.bootstrap.min';
var ipv6URL = 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.15.1/IPv6.min';
var punyURL =
    'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.15.1/punycode.min';
var sdlURL = 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.15.1/SecondLevelDomains.min';

require.config({
    baseUrl: '/static/js',
    paths: {
        'lib': './lib',
        'app': './app',
        'worker': './worker',
        'charts': './app/charts',
        'utils': './app/utils',
        'jquery': jqueryURL,
        'jquery.hotkeys': './jquery.hotkeys-1.0.min',
        'jquery.hotkeymap': './jquery.hotkeymap-1.0.min',
        'bootstrap': bootstrapURL,
        'datatables': dtURL,
        'datatables.bootstrap': dtBootstrapURL,
        'URI': [uriURL, 'lib/uri-1.15.1.min'],
        'IPv6': [ipv6URL, 'lib/IPv6-1.15.1.min'],
        'punycode': [punyURL, 'lib/punycode-1.15.1.min'],
        'SDL': [sdlURL, 'lib/SecondLevelDomains-1.15.1.min'],
        'sprintf': sprintfURL,
        'd3': d3URL
    },
    map: {
        '*': {
            'app/view-boots-all-job': 'app/view-boots-all-job.20150625',
            'app/view-boots-all-job-kernel-defconfig': 'app/view-boots-all-job-kernel-defconfig.20150625',
            'app/view-boots-all-lab': 'app/view-boots-all-lab.20150626',
            'app/view-boots-board': 'app/view-boots-board.20150626',
            'app/view-boots-board-job': 'app/view-boots-board-job.20150625',
            'app/view-boots-board-job-kernel': 'app/view-boots-board-job-kernel.20150626',
            'app/view-boots-board-job-kernel-defconfig': 'app/view-boots-board-job-kernel-defconfig.20150626',
            'app/view-boots-id': 'app/view-boots-id.20150624',
            'app/view-builds-all': 'app/view-builds-all.20150626',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.20150626',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.20150629',
            'app/view-jobs-all': 'app/view-jobs-all.20150622',
            'app/view-jobs-job': 'app/view-jobs-job.20150626',
            'charts/passpie': 'charts/passpie.20150626',
            'utils/base': 'utils/base.20150623',
            'utils/bisect': 'utils/bisect.20150629',
            'utils/request': 'utils/request.20150630',
            'utils/tables': 'utils/tables.20150630',
            'utils/show-hide-btns': 'utils/show-hide-btns.20150626'
        }
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'datatables.bootstrap': {
            deps: ['datatables']
        },
        'jquery.hotkeys': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.hotkeymap': {
            deps: ['jquery.hotkeys']
        },
        'URI': {
            deps: ['jquery', 'punycode', 'IPv6', 'SDL']
        }
    }
});
