/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request'
], function($, b, e, i, r) {
    $(document).ready(function() {
        document.getElementById('li-compare').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();
    });
});
