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
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min';
var bootstrapURL =
    'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/js/bootstrap.min';
var uriURL = 'https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.11.2/URI.min';
var sprintfURL =
    'https://cdnjs.cloudflare.com/ajax/libs/sprintf/1.0.1/sprintf.min';
var d3URL = 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min';
var dtURL =
    'https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.7/js/jquery.dataTables.min';
var dtBootstrapURL = 'https://cdn.datatables.net/plug-ins/1.10.7/integration/bootstrap/3/dataTables.bootstrap.min';

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
        'uri': uriURL,
        'sprintf': sprintfURL,
        'd3': d3URL
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
        }
    }
});
