/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'utils/init',
    'compare/choose'
], function(init, choose) {
    'use strict';
    document.getElementById('li-compare').setAttribute('class', 'active');

    choose(document.getElementById('compare-div')).create();

    init.hotkeys();
    init.tooltip();
    init.popover();
});
