/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'utils/init'
], function(init) {
    'use strict';
    document.getElementById('li-home').setAttribute('class', 'active');

    init.hotkeys();
    init.tooltip();
});
