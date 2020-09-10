/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gTestTable;
    var gStatusDefaults;

    gTestTable = {};

    gStatusDefaults = {
        pass: 'Test executed successfully',
        fail: 'Test execution failed',
        offline: 'Test offline',
        default: 'Test execution status unknown'
    };

    /**
     * Function to render the date.
     *
     * @param {object} date: The date object.
     * @return {Element} The DOM element.
    **/
    gTestTable.dateNode = function(date) {
        return tcommon.dateNode(date);
    };

    /**
     * Create the test status element.
     *
     * @param {string} status: The test status.
     * @return {HTMLElement} The status node.
    **/
    gTestTable.statusNode = function(status) {
        return tcommon.statusNode(status, gStatusDefaults);
    };

    gTestTable.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    gTestTable.renderDetails = function(href, type, title) {
        return tcommon.renderDetails(href, type, title);
    };

    gTestTable.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };

    gTestTable.renderTestCount = function(settings) {
        settings.extraClasses = ['extra-margin'];
        settings.idStart = 'test-';
        return tcommon.countAll(settings);
    };

    return gTestTable;
});
