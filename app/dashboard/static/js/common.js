/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require.config({
    paths: {
        'lib': './lib',
        'app': './app',
        'charts': './app/charts',
        'utils': './app/utils',
        'jquery': 'lib/jquery-2.1.4',
        'jquery.hotkeys': 'lib/jquery.hotkeys-1.0.min',
        'jquery.hotkeymap': 'lib/jquery.hotkeymap-1.0.min',
        'bootstrap': 'lib/bootstrap-3.3.5',
        'sprintf': 'lib/sprintf-1.0.1',
        'd3': 'lib/d3-3.5.5',
        'datatables': 'lib/dataTables-1.10.7',
        'datatables.bootstrap': 'lib/dataTables.bootstrap-1.10.7'
    },
    map: {
        '*': {
            'app/view-boots-all': 'app/view-boots-all.20150701',
            'app/view-boots-all-job': 'app/view-boots-all-job.20150701',
            'app/view-boots-all-job-kernel-defconfig': 'app/view-boots-all-job-kernel-defconfig.20150625',
            'app/view-boots-all-lab': 'app/view-boots-all-lab.20150701',
            'app/view-boots-board': 'app/view-boots-board.20150702',
            'app/view-boots-board-job': 'app/view-boots-board-job.20150625',
            'app/view-boots-board-job-kernel': 'app/view-boots-board-job-kernel.20150626',
            'app/view-boots-board-job-kernel-defconfig': 'app/view-boots-board-job-kernel-defconfig.20150701',
            'app/view-boots-id': 'app/view-boots-id.20150702',
            'app/view-boots-job-kernel': 'app/view-boots-job-kernel.20150701',
            'app/view-builds-all': 'app/view-builds-all.20150626',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.20150701',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.20150629',
            'app/view-index': 'app/view-index.20150701',
            'app/view-info-faq': 'app/view-info-faq.20150702',
            'app/view-jobs-all': 'app/view-jobs-all.20150701',
            'app/view-jobs-job': 'app/view-jobs-job.20150701',
            'charts/passpie': 'charts/passpie.20150626',
            'utils/base': 'utils/base.20150623',
            'utils/bisect': 'utils/bisect.20150629',
            'utils/init': 'utils/init.20150701',
            'utils/request': 'utils/request.20150630',
            'utils/show-hide-btns': 'utils/show-hide-btns.20150626',
            'utils/tables': 'utils/tables.20150702',
            'utils/web-storage': 'utils/web-storage.20150702'
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
        }
    }
});
