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
     * Function to render the Board column on a table.
     *
     * @param {string} board: The Board value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
    gTestTable.renderBoard = function(board, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Test reports for board&nbsp;' + board);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/test/board/' + board + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(board));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        } else {
            rendered = board;
        }

        return rendered;
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

    /**
     * Function to render the case detail.
     *
     * @param {object} object: The entire data set.
     * @return {Element} The DOM element.
    **/
    gTestTable.detailsNode = function(object) {
        var aNode;
        var str;
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'More info');

        aNode = document.createElement('a');
        str = '/test/case/id/';
        str += object._id.$oid;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        return tooltipNode;
    };

    gTestTable.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    gTestTable.renderDetails = function(href, type, title) {
        return tcommon.renderDetails(href, type, title);
    };

    gTestTable.countBadge = function(settings) {
        return tcommon.countBadge(
            settings.data,
            settings.type, settings.extraClasses, settings.idStart).outerHTML;
    };

    gTestTable.renderCasesCount = function(data, type, id_str, href) {
        return tcommon.countAll({
            data: data,
            type: type,
            href: href,
            extraClasses: ['extra-margin'],
            idStart: id_str
        });
    };

   gTestTable.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };

    return gTestTable;
});