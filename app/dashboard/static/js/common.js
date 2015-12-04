/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
        'jquery': 'lib/jquery-2.1.4',
        'jquery.hotkeys': 'lib/jquery.hotkeys-1.0.min',
        'jquery.hotkeymap': 'lib/jquery.hotkeymap-1.0.min',
        'bootstrap': 'lib/bootstrap-3.3.5',
        'sprintf': 'lib/sprintf-1.0.3',
        'd3': 'lib/d3-3.5.6',
        'datatables': 'lib/jquery.dataTables-1.10.9',
        'datatables.bootstrap': 'lib/dataTables.bootstrap-1.10.9',
        'URI': 'lib/URI-1.16.0',
        'punycode': 'lib/punycode-1.16.0',
        'IPv6': 'lib/IPv6-1.16.0',
        'SecondLevelDomains': 'lib/SecondLevelDomains-1.16.0'
    },
    map: {
        '*': {
            'app/view-boots-all': 'app/view-boots-all.2015.11.2',
            'app/view-boots-all-job': 'app/view-boots-all-job.2015.11.2',
            'app/view-boots-all-job-kernel-defconfig': 'app/view-boots-all-job-kernel-defconfig.2015.11.2',
            'app/view-boots-all-lab': 'app/view-boots-all-lab.2015.11.2',
            'app/view-boots-board': 'app/view-boots-board.2015.11.2',
            'app/view-boots-board-job': 'app/view-boots-board-job.2015.11.2',
            'app/view-boots-board-job-kernel': 'app/view-boots-board-job-kernel.2015.11.2',
            'app/view-boots-board-job-kernel-defconfig': 'app/view-boots-board-job-kernel-defconfig.2015.11.2',
            'app/view-boots-id': 'app/view-boots-id.2015.11.2',
            'app/view-boots-job-kernel': 'app/view-boots-job-kernel.2015.11.2',
            'app/view-builds-all': 'app/view-builds-all.2015.11.2',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.2015.11.2',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.2015.11.2',
            'app/view-builds-job-kernel-defconfig-logs': 'app/view-builds-job-kernel-defconfig-logs.2015.11.2',
            'app/view-compare': 'app/view-compare.2015.11.2',
            'app/view-index': 'app/view-index.2015.11.2',
            'app/view-info-faq': 'app/view-info-faq.2015.11.2',
            'app/view-job-compare': 'app/view-job-compare.2015.11.2',
            'app/view-jobs-all': 'app/view-jobs-all.2015.11.2',
            'app/view-jobs-job': 'app/view-jobs-job.2015.11.2',
            'app/view-jobs-job-branch': 'app/view-jobs-job-branch.2015.11.2',
            'app/view-socs-all': 'app/view-socs-all.2015.11.2',
            'app/view-socs-soc': 'app/view-socs-soc.2015.11.2',
            'app/view-socs-soc-job': 'app/view-socs-soc-job.2015.11.2',
            'app/view-socs-soc-job-kernel': 'app/view-socs-soc-job-kernel.2015.11.2',
            'app/view-sponsors': 'app/view-sponsors.2015.11.2',
            'app/view-stats': 'app/view-stats.2015.11.2'
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
