/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
        'compare': './app/compare',
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
            'app/view-socs-soc': 'app/view-socs-soc.2017.3.3',
            'app/view-socs-soc-job': 'app/view-socs-soc-job.2017.3.3',
            'app/view-socs-soc-job-kernel': 'app/view-socs-soc-job-kernel.2017.4',
            'app/view-sponsors': 'app/view-sponsors.2017.3.3',
            'app/view-stats': 'app/view-stats.2017.3.3',
            'app/view-tests-all': 'app/view-tests-all.2017.7.2',
            'app/view-tests-board': 'app/view-tests-board.2017.7.2',
            'app/view-tests-board-job': 'app/view-tests-board-job.2017.7.2',
            'app/view-tests-board-job-kernel': 'app/view-tests-board-job-kernel.2017.7.2',
            'app/view-tests-suite-id': 'app/view-tests-suite-id.2017.7.2',
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
        {name: 'app/view-boot-compare.2017.4'},
        {name: 'app/view-boots-all-job-branch-kernel-defconfig.2017.3.3'},
        {name: 'app/view-boots-all-job-branch-kernel.2017.4'},
        {name: 'app/view-boots-all-job-kernel-defconfig.2017.3.3'},
        {name: 'app/view-boots-all-job.2017.3.4'},
        {name: 'app/view-boots-all-lab.2017.3.5'},
        {name: 'app/view-boots-all-jb.2017.3.4'},
        {name: 'app/view-boots-all.2017.5'},
        {name: 'app/view-boots-board-job-kernel-defconfig.2017.3.3'},
        {name: 'app/view-boots-board-job-kernel.2017.3.3'},
        {name: 'app/view-boots-board-job.2017.3.3'},
        {name: 'app/view-boots-board-lab.2017.3.3'},
        {name: 'app/view-boots-board.2017.3.3'},
        {name: 'app/view-boots-board-jbkd.2017.3.3'},
        {name: 'app/view-boots-id.2017.4'},
        {name: 'app/view-boots-job-kernel.2017.4'},
        {name: 'app/view-boots-regressions.2017.3.3'},
        {name: 'app/view-build-compare.2017.4'},
        {name: 'app/view-builds-all.2017.5'},
        {name: 'app/view-builds-id.2017.4'},
        {name: 'app/view-builds-job-branch-kernel.2017.7.1'},
        {name: 'app/view-builds-job-kernel-defconfig-logs.2017.4'},
        {name: 'app/view-builds-job-kernel-defconfig.2017.3.3'},
        {name: 'app/view-builds-job-kernel.2017.4'},
        {name: 'app/view-compare.2017.3.3'},
        {name: 'app/view-index.2017.3.3'},
        {name: 'app/view-info-faq.2017.3.3'},
        {name: 'app/view-job-compare.2017.4'},
        {name: 'app/view-jobs-all.2017.3.5'},
        {name: 'app/view-jobs-job-branch.2017.4'},
        {name: 'app/view-jobs-job.2017.4'},
        {name: 'app/view-socs-all.2017.3.3'},
        {name: 'app/view-socs-soc-job-kernel.2017.4'},
        {name: 'app/view-socs-soc-job.2017.3.3'},
        {name: 'app/view-socs-soc.2017.3.3'},
        {name: 'app/view-sponsors.2017.3.3'},
        {name: 'app/view-stats.2017.3.3'},
        {name: 'app/view-tests-all.2017.7.2'},
        {name: 'app/view-tests-board.2017.7.2'},
        {name: 'app/view-tests-board-job.2017.7.2'},
        {name: 'app/view-tests-board-job-kernel.2017.7.2'},
        {name: 'app/view-tests-suite-id.2017.7.2'},
        {name: 'kci-boot-compare'},
        {name: 'kci-boots-all'},
        {name: 'kci-boots-all-job'},
        {name: 'kci-boots-all-job-kernel-defconfig'},
        {name: 'kci-boots-all-lab'},
        {name: 'kci-boots-board'},
        {name: 'kci-boots-board-job'},
        {name: 'kci-boots-board-job-kernel'},
        {name: 'kci-boots-board-job-kernel-defconfig'},
        {name: 'kci-boots-board-lab'},
        {name: 'kci-boots-id'},
        {name: 'kci-boots-job-kernel'},
        {name: 'kci-build-compare'},
        {name: 'kci-builds-all'},
        {name: 'kci-builds-id'},
        {name: 'kci-builds-job-kernel'},
        {name: 'kci-builds-job-kernel-defconfig'},
        {name: 'kci-builds-job-kernel-defconfig-logs'},
        {name: 'kci-compare'},
        {name: 'kci-index'},
        {name: 'kci-info-faq'},
        {name: 'kci-job-compare'},
        {name: 'kci-jobs-all'},
        {name: 'kci-jobs-job'},
        {name: 'kci-jobs-job-branch'},
        {name: 'kci-socs-all'},
        {name: 'kci-socs-soc'},
        {name: 'kci-socs-soc-job'},
        {name: 'kci-socs-soc-job-kernel'},
        {name: 'kci-sponsors'},
        {name: 'kci-stats'}
    ]
})
