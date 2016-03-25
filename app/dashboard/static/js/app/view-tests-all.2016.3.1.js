/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'utils/init'
], function(init) {
    'use strict';
    var gTestList;

    document.getElementById('li-test').setAttribute('class', 'active');

    gTestList = document.getElementById('test-suite-names');
    if (gTestList !== null) {
        gTestList = String(gTestList.value).split(',');
    }

    init.hotkeys();
    init.tooltip();
});
