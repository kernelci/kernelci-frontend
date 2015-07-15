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
        'jquery': 'lib/jquery-2.1.4',
        'bootstrap': 'lib/bootstrap-3.3.5',
        'sprintf': 'lib/sprintf-1.0.1',
        'd3': 'lib/d3-3.5.5',
        'datatables': 'lib/dataTables-1.10.7',
        'datatables.bootstrap': 'lib/dataTables.bootstrap-1.10.7',
        'jquery.hotkeys': 'empty:',
        'jquery.hotkeymap': 'empty:'
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
            'app/view-boots-job-kernel': 'app/view-boots-job-kernel.20150715',
            'app/view-builds-all': 'app/view-builds-all.20150626',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.20150709',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.20150703',
            'app/view-builds-job-kernel-defconfig-logs': 'app/view-builds-job-kernel-defconfig-logs.20150708',
            'app/view-index': 'app/view-index.20150701',
            'app/view-info-faq': 'app/view-info-faq.20150702',
            'app/view-jobs-all': 'app/view-jobs-all.20150701',
            'app/view-jobs-job': 'app/view-jobs-job.20150703',
            'app/view-jobs-job-branch': 'app/view-jobs-job-branch.20150702',
            'charts/passpie': 'charts/passpie.20150626',
            'utils/base': 'utils/base.20150623',
            'utils/bisect': 'utils/bisect.20150703',
            'utils/git-rules': 'utils/git-rules.20150702',
            'utils/init': 'utils/init.20150703',
            'utils/request': 'utils/request.20150630',
            'utils/show-hide-btns': 'utils/show-hide-btns.20150626',
            'utils/tables': 'utils/tables.20150702',
            'utils/urls': 'utils/urls.20150703',
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
    },
    modules: [
        {name: 'app/view-boots-all-job-kernel-defconfig.20150625'},
        {name: 'app/view-boots-all-job.20150701'},
        {name: 'app/view-boots-all-lab.20150701'},
        {name: 'app/view-boots-all.20150701'},
        {name: 'app/view-boots-board-job-kernel-defconfig.20150701'},
        {name: 'app/view-boots-board-job-kernel.20150626'},
        {name: 'app/view-boots-board-job.20150625'},
        {name: 'app/view-boots-board.20150702'},
        {name: 'app/view-boots-id.20150702'},
        {name: 'app/view-boots-job-kernel.20150715'},
        {name: 'app/view-builds-all.20150626'},
        {name: 'app/view-builds-job-kernel-defconfig-logs.20150708'},
        {name: 'app/view-builds-job-kernel-defconfig.20150703'},
        {name: 'app/view-builds-job-kernel.20150709'},
        {name: 'app/view-index.20150701'},
        {name: 'app/view-info-faq.20150702'},
        {name: 'app/view-jobs-all.20150701'},
        {name: 'app/view-jobs-job-branch.20150702'},
        {name: 'app/view-jobs-job.20150703'},
        {name: 'kci-boots-all'},
        {name: 'kci-boots-all-job'},
        {name: 'kci-boots-all-job-kernel-defconfig'},
        {name: 'kci-boots-all-lab'},
        {name: 'kci-boots-board'},
        {name: 'kci-boots-board-job'},
        {name: 'kci-boots-board-job-kernel'},
        {name: 'kci-boots-board-job-kernel-defconfig'},
        {name: 'kci-boots-id'},
        {name: 'kci-boots-job-kernel'},
        {name: 'kci-builds-all'},
        {name: 'kci-builds-job-kernel'},
        {name: 'kci-builds-job-kernel-defconfig'},
        {name: 'kci-index'},
        {name: 'kci-info-faq'},
        {name: 'kci-jobs-all'},
        {name: 'kci-jobs-job'},
        {name: 'kci-jobs-job-branch'}
    ]
})
