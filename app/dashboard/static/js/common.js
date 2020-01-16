/*!
 * Copyright (C) Linaro Limited 2015,2016,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * Copyright (C) Collabora Limited 2018
 * Author: Ana Guerrero Lopez <ana.guerrero@collabora.com>
 *
 * Copyright (C) Foundries.io 2018
 * Author: Milo Casagrande <milo@opensourcefoundries.com>
 *
 * Copyright (C) Baylibre 2017
 * Author: lollivier <lollivier@baylibre.com>
 *
 * kernelci dashboard.
 * 
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
require.config({
    paths: {
        'lib': './lib',
        'app': './app',
        'charts': './app/charts',
        'utils': './app/utils',
        'compare': './app/compare',
        'tables': './app/tables',
        'buttons': './app/buttons',
        'components': './app/components',
        'jquery': 'lib/jquery-2.2.1',
        'jquery.hotkeys': 'lib/jquery.hotkeys-1.0.min',
        'jquery.hotkeymap': 'lib/jquery.hotkeymap-1.0.min',
        'bootstrap': 'lib/bootstrap-3.3.6',
        'sprintf': 'lib/sprintf-1.0.3',
        'd3': 'lib/d3-3.5.16',
        'datatables.net': 'lib/jquery.dataTables-1.10.11',
        'datatables.bootstrap': 'lib/dataTables.bootstrap-1.10.11',
        'URI': 'lib/URI-1.18.9',
        'punycode': 'lib/punycode-1.18.9',
        'IPv6': 'lib/IPv6-1.18.9',
        'SecondLevelDomains': 'lib/SecondLevelDomains-1.18.9'
    },
    map: {
        '*': {
            'app/view-boot-compare': 'app/view-boot-compare.2017.4',
            'app/view-boots-all': 'app/view-boots-all.2017.5',
            'app/view-boots-all-jb': 'app/view-boots-all-jb.2017.3.4',
            'app/view-boots-all-job': 'app/view-boots-all-job.2017.3.4',
            'app/view-boots-all-job-branch-kernel': 'app/view-boots-all-job-branch-kernel.2017.4',
            'app/view-boots-all-job-branch-kernel-defconfig': 'app/view-boots-all-job-branch-kernel-defconfig.2017.3.3',
            'app/view-boots-all-job-kernel-defconfig': 'app/view-boots-all-job-kernel-defconfig.2017.3.3',
            'app/view-boots-all-lab': 'app/view-boots-all-lab.2017.3.5',
            'app/view-boots-board': 'app/view-boots-board.2017.3.3',
            'app/view-boots-board-jbkd': 'app/view-boots-board-jbkd.2017.3.3',
            'app/view-boots-board-job': 'app/view-boots-board-job.2017.3.3',
            'app/view-boots-board-job-kernel': 'app/view-boots-board-job-kernel.2017.3.3',
            'app/view-boots-board-job-kernel-defconfig': 'app/view-boots-board-job-kernel-defconfig.2017.3.3',
            'app/view-boots-board-lab': 'app/view-boots-board-lab.2017.3.3',
            'app/view-boots-id': 'app/view-boots-id.2017.4',
            'app/view-boots-job-kernel': 'app/view-boots-job-kernel.2017.4',
            'app/view-boots-regressions': 'app/view-boots-regressions.2017.3.3',
            'app/view-build-compare': 'app/view-build-compare.2017.4',
            'app/view-builds-all': 'app/view-builds-all.2017.5',
            'app/view-builds-id': 'app/view-builds-id.2017.4',
            'app/view-builds-job-branch-kernel': 'app/view-builds-job-branch-kernel.2017.7.1',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.2017.4',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.2017.3.3',
            'app/view-builds-job-kernel-defconfig-logs': 'app/view-builds-job-kernel-defconfig-logs.2017.4',
            'app/view-compare': 'app/view-compare.2017.3.3',
            'app/view-index': 'app/view-index.2017.3.3',
            'app/view-info-faq': 'app/view-info-faq.2017.3.3',
            'app/view-job-compare': 'app/view-job-compare.2017.4',
            'app/view-jobs-all': 'app/view-jobs-all.2017.3.5',
            'app/view-jobs-job': 'app/view-jobs-job.2017.4',
            'app/view-jobs-job-branch': 'app/view-jobs-job-branch.2017.4',
            'app/view-socs-all': 'app/view-socs-all.2017.3.3',
            'app/view-socs-soc': 'app/view-socs-soc.2018.2',
            'app/view-socs-soc-job': 'app/view-socs-soc-job.2017.3.3',
            'app/view-socs-soc-job-kernel': 'app/view-socs-soc-job-kernel.2017.4',
            'app/view-sponsors': 'app/view-sponsors.2017.3.3',
            'app/view-stats': 'app/view-stats.2017.3.3',
            'app/view-tests-all': 'app/view-tests-all.2018.9',
            'app/view-tests-board': 'app/view-tests-board.2018.9',
            'app/view-tests-board-job': 'app/view-tests-board-job.2018.9',
            'app/view-tests-board-job-kernel': 'app/view-tests-board-job-kernel.2018.9',
            'app/view-tests-group-id': 'app/view-tests-group-id.2018.9',
            'app/view-releases-all': 'app/view-releases-all.2018.07.30'
        }
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'datatables.bootstrap': {
            deps: ['datatables.net']
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
