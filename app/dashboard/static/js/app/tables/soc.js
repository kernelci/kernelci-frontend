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

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        } else {
            rendered = soc;
        }

        return rendered;
    };

    gSocTables.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    gSocTables.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };

    gSocTables.countBadge = function(settings) {
        return tcommon.countBadge(
            settings.data,
            settings.type, settings.extraClasses, settings.idStart).outerHTML;
    };

    gSocTables.renderBootCount = function(data, type, href) {
        return tcommon.countAll({
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
