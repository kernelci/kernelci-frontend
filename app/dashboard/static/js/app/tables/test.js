/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gTestTable;

    gTestTable = {};

    /**
     * Function to render the test suite column on a table.
     *
     * @param {string} suite: The suite value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
    gTestTable.renderTestSuite = function(suite, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', suite + '&nbsp;test suite report');

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/test/' + suite + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(suite));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        } else {
            rendered = suite;
        }

        return rendered;
    };

    /**
     * Function to render the test-set column on a table.
     *
     * @param {string} set: The test-set value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
    gTestTable.renderTestSet = function(set, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Reports for test set&nbsp;' + set);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/test/set/' + set + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(set));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        } else {
            rendered = set;
        }

        return rendered;
    };

    /**
     * Function to render the test-case column on a table.
     *
     * @param {string} case: The test-case value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
/*    gTestTable.renderTestCase = function(case, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Reports for test case&nbsp;' + case);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/test/case/' + case + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(case));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        } else {
            rendered = case;
        }

        return rendered;
    };
*/

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

    gTestTable.renderCasesCount = function(data, type, href) {
        return tcommon.countAll({
            data: data,
            type: type,
            href: href,
            extraClasses: ['extra-margin'],
            idStart: 'cases-'
        });
    };

   gTestTable.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };

    return gTestTable;
});
