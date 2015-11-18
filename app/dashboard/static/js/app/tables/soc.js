/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gSocTables;

    gSocTables = {};

    /**
     * Function to render the SoC column on a table.
     *
     * @param {string} soc: The SoC value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
    gSocTables.renderSoc = function(soc, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boards and boot reports for SoC&nbsp;' + soc);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + soc + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(soc));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;
        } else {
            rendered = soc;
        }

        return rendered;
    };

    gSocTables.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    gSocTables.renderBoardDetail = function(board, type) {
        var aNode,
            tooltipNode,
            rendered;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for&nbsp;' + board);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/boot/' + board + '/');

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        } else {
            rendered = board;
        }

        return rendered;
    };

    gSocTables.renderTree = function(tree, type, href) {
        var aNode,
            rendered;

        rendered = tree;
        if (type === 'display') {
            if (href) {
                aNode = document.createElement('a');
                aNode.className = 'table-link';
                aNode.setAttribute('href', href);
                aNode.appendChild(document.createTextNode(tree));

                rendered = aNode.outerHTML;
            }
        }

        return rendered;
    };

    gSocTables.countBadge = function(settings) {
        return tcommon.countBadge(
            settings.data,
            settings.type, settings.extraClasses, settings.idStart).outerHTML;
    };

    gSocTables.countSuccessFail = function(settings) {
        return tcommon.countSuccessFail(settings);
    };

    gSocTables.renderBootCount = function(data, type, href) {
        return tcommon.countSuccessFail({
            data: data,
            type: type,
            href: href,
            extraClasses: ['extra-margin'],
            idStart: 'boot-'
        });
    };

    gSocTables.renderDetails = function(href, type, title) {
        return tcommon.renderDetails(href, type, title);
    };

    return gSocTables;
});
