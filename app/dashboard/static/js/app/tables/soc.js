/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
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
