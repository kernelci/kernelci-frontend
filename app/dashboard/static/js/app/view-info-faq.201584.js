/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init'
], function($, i) {
    'use strict';
    $(document).ready(function() {
        document.getElementById('li-info').setAttribute('class', 'active');
        i();
    });
});
