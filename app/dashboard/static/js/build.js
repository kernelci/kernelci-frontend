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
            'app/view-boots-all': 'app/view-boots-all.201583',
            'app/view-boots-all-job': 'app/view-boots-all-job.201583',
            'app/view-boots-all-job-kernel-defconfig': 'app/view-boots-all-job-kernel-defconfig.201583',
            'app/view-boots-all-lab': 'app/view-boots-all-lab.201583',
            'app/view-boots-board': 'app/view-boots-board.201583',
            'app/view-boots-board-job': 'app/view-boots-board-job.201583',
            'app/view-boots-board-job-kernel': 'app/view-boots-board-job-kernel.201583',
            'app/view-boots-board-job-kernel-defconfig': 'app/view-boots-board-job-kernel-defconfig.201583',
            'app/view-boots-id': 'app/view-boots-id.201583',
            'app/view-boots-job-kernel': 'app/view-boots-job-kernel.201583',
            'app/view-builds-all': 'app/view-builds-all.201583',
            'app/view-builds-job-kernel': 'app/view-builds-job-kernel.201583',
            'app/view-builds-job-kernel-defconfig': 'app/view-builds-job-kernel-defconfig.201583',
            'app/view-builds-job-kernel-defconfig-logs': 'app/view-builds-job-kernel-defconfig-logs.201583',
            'app/view-index': 'app/view-index.201583',
            'app/view-info-faq': 'app/view-info-faq.201583',
            'app/view-jobs-all': 'app/view-jobs-all.201583',
            'app/view-jobs-job': 'app/view-jobs-job.201583',
            'app/view-jobs-job-branch': 'app/view-jobs-job-branch.201583',
            'app/view-stats': 'app/view-stats.201583'
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
        {name: 'app/view-boots-all-job-kernel-defconfig.201583'},
        {name: 'app/view-boots-all-job.201583'},
        {name: 'app/view-boots-all-lab.201583'},
        {name: 'app/view-boots-all.201583'},
        {name: 'app/view-boots-board-job-kernel-defconfig.201583'},
        {name: 'app/view-boots-board-job-kernel.201583'},
        {name: 'app/view-boots-board-job.201583'},
        {name: 'app/view-boots-board.201583'},
        {name: 'app/view-boots-id.201583'},
        {name: 'app/view-boots-job-kernel.201583'},
        {name: 'app/view-builds-all.201583'},
        {name: 'app/view-builds-job-kernel-defconfig-logs.201583'},
        {name: 'app/view-builds-job-kernel-defconfig.201583'},
        {name: 'app/view-builds-job-kernel.201583'},
        {name: 'app/view-index.201583'},
        {name: 'app/view-info-faq.201583'},
        {name: 'app/view-jobs-all.201583'},
        {name: 'app/view-jobs-job-branch.201583'},
        {name: 'app/view-jobs-job.201583'},
        {name: 'app/view-stats.201583'},
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
