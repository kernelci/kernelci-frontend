/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'tables/common'
], function(tcommon) {
    'use strict';
    var gTestSetTable;

    gTestSetTable = {};

    gTestSetTable.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    gTestSetTable.renderDetails = function(href, type, title) {
        return tcommon.renderDetails(href, type, title);
    };

    return gTestSetTable;
});
