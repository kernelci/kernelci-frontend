/*!
 * Copyright (C) Collabora Limited 2020, 2022
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
 *
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
({
    appDir: '../',
    baseUrl: 'js',
    dir: '/tmp/assets-build',
    allowSourceOverwrites: true,
    paths: {
        'lib': './lib',
        'app': './app',
        'charts': './app/charts',
        'utils': './app/utils',
        'tables': './app/tables',
        'buttons': './app/buttons',
        'components': './app/components',
        'sprintf': 'lib/sprintf-1.0.3',
        'URI': 'lib/URI-1.18.9',
        'punycode': 'lib/punycode-1.18.9',
        'IPv6': 'lib/IPv6-1.18.9',
        'SecondLevelDomains': 'lib/SecondLevelDomains-1.18.9',
        'datatables.bootstrap': 'empty:',
        'datatables.net': 'empty:',
        'jquery': 'empty:',
        'bootstrap': 'empty:',
        'd3': 'empty:',
        'jquery.hotkeys': 'empty:',
        'jquery.hotkeymap': 'empty:'
    },
    map: {
        '*': {
            'app/view-builds-all': 'app/view-builds-all.2017.5',
            'app/view-builds-id': 'app/view-builds-id.2020.10.1',
            'app/view-builds-job-branch-kernel': 'app/view-builds-job-branch-kernel.2021.05',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.2020.6',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.2017.3.3',
            'app/view-builds-job-kernel-defconfig-logs': 'app/view-builds-job-kernel-defconfig-logs.2020.6',
            'app/view-index': 'app/view-index.2017.3.3',
            'app/view-info': 'app/view-info.2021.06',
            'app/view-jobs-all': 'app/view-jobs-all.2020.10',
            'app/view-jobs-job': 'app/view-jobs-job.2020.10',
            'app/view-jobs-job-branch': 'app/view-jobs-job-branch.2020.10',
            'app/view-new-api-jobs-all': 'app/view-new-api-jobs-all.2022.11',
            'app/view-socs-all': 'app/view-socs-all.2020.10',
            'app/view-socs-soc': 'app/view-socs-soc.2020.10',
            'app/view-socs-soc-job': 'app/view-socs-soc-job.2020.10',
            'app/view-socs-soc-job-kernel': 'app/view-socs-soc-job-kernel.2020.10',
            'app/view-socs-soc-job-kernel-plan': 'app/view-socs-soc-job-kernel-plan.2020.10',
            'app/view-tests-all': 'app/view-tests-all.2020.9',
            'app/view-tests-plan-id': 'app/view-tests-plan-id.2021.06',
            'app/view-tests-case-id': 'app/view-tests-case-id.2021.06',
            'app/view-tests-job-branch-kernel': 'app/view-tests-job-branch-kernel.2020.10',
            'app/view-tests-job-branch-kernel-plan': 'app/view-tests-job-branch-kernel-plan.2020.10',
        }
    },
    shim: {
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
    },
    modules: [
        {name: 'app/view-builds-all.2017.5'},
        {name: 'app/view-builds-id.2020.10.1'},
        {name: 'app/view-builds-job-branch-kernel.2021.05'},
        {name: 'app/view-builds-job-kernel.2020.6'},
        {name: 'app/view-builds-job-kernel-defconfig-logs.2020.6'},
        {name: 'app/view-builds-job-kernel-defconfig.2017.3.3'},
        {name: 'app/view-index.2017.3.3'},
        {name: 'app/view-info.2021.06'},
        {name: 'app/view-jobs-all.2020.10'},
        {name: 'app/view-jobs-job-branch.2020.10'},
        {name: 'app/view-jobs-job.2020.10'},
        {name: 'app/view-socs-all.2020.10'},
        {name: 'app/view-socs-soc-job-kernel-plan.2020.10'},
        {name: 'app/view-socs-soc-job-kernel.2020.10'},
        {name: 'app/view-socs-soc-job.2020.10'},
        {name: 'app/view-socs-soc.2020.10'},
        {name: 'app/view-tests-all.2020.9'},
        {name: 'app/view-tests-plan-id.2021.06'},
        {name: 'app/view-tests-case-id.2021.06'},
        {name: 'app/view-tests-job-branch-kernel.2020.10'},
        {name: 'app/view-tests-job-branch-kernel-plan.2020.10'},
        {name: 'app/view-new-api-jobs-all.2022.11'},
        {name: 'kci-builds-all'},
        {name: 'kci-builds-id'},
        {name: 'kci-builds-job-kernel'},
        {name: 'kci-builds-job-kernel-defconfig'},
        {name: 'kci-builds-job-kernel-defconfig-logs'},
        {name: 'kci-index'},
        {name: 'kci-info'},
        {name: 'kci-jobs-all'},
        {name: 'kci-jobs-job'},
        {name: 'kci-jobs-job-branch'},
        {name: 'kci-socs-all'},
        {name: 'kci-socs-soc'},
        {name: 'kci-socs-soc-job'},
        {name: 'kci-socs-soc-job-kernel'},
        {name: 'kci-socs-soc-job-kernel-plan'},
        {name: 'kci-tests-all'},
        {name: 'kci-tests-job-branch-kernel'},
        {name: 'kci-tests-plan-id'},
        {name: 'kci-tests-case-id'},
        {name: 'kci-new-api-jobs-all'},
    ]
})
