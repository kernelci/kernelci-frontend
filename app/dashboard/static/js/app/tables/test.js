/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gTestTable;

    gTestTable = {};

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
