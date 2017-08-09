/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test'
], function($, init, format, html, error, request, table, ttestset) {
    'use strict';

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

});
