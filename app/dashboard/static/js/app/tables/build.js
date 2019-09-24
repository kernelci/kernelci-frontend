/*!
 * Copyright (C) Linaro Limited 2015,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
    var gBuildUtils,
        gStatusDefaults;

    gBuildUtils = {};

    gStatusDefaults = {
        pass: 'Build completed',
        build: 'Building',
        fail: 'Build failed',
        default: 'Unknown status'
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {object} data: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderTree = function(data, type) {
        return tcommon.renderTree(data, type, '/job/' + data + '/');
    };

    /**
     * Function to render the date column on a table.
     *
     * @param {object} data: The date object.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderDate = function(data, type) {
        return tcommon.renderDate(data, type);
    };

    /**
     * Function to render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderStatus = function(status, type) {
        return tcommon.renderStatus(status, type, gStatusDefaults);
    };

    /**
     * Function to render the detail column on a table.
     *
     * @param {string} href: The link to associate with the element.
     * @param {string} type: The type of the display option.
     * @param {string} tooltip: The tooltip title.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderDetails = function(href, type, tooltip) {
        return tcommon.renderDetails(href, type, tooltip);
    };

    /**
     * Render the kernel column on a table.
     *
     * @param {string} data: The actual data value.
     * @param {string} type: The type of the display option.
     * @param {string} href: The href to associate with the element.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderKernel = function(data, type, href) {
        return tcommon.renderKernel(data, type, href);
    };

    /**
     * Render the defconfig column on a table.
     *
     * @param {string} data: The actual data value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderDefconfig = function(data, type) {
        var rendered;
        var tooltipNode;

        rendered = data;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', data);
            tooltipNode.appendChild(document.createTextNode(data));

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    /**
     * Render the commit column.
     *
     * @param {string} data: The actual data value.
     * @param {string} type: The type of the display option.
     * @param {string} href: The href to associate with the element.
     * @return {string} The rendered element as a string.
    **/
    gBuildUtils.renderCommit = function(data, type, href) {
        var aNode;
        var rendered;
        var tooltipNode;

        rendered = data;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', data);

            if (href) {
                aNode = document.createElement('a');
                aNode.className = 'table-link';
                aNode.setAttribute('href', href);

                aNode.appendChild(document.createTextNode(data));
                tooltipNode.appendChild(aNode);
            } else {
                tooltipNode.appendChild(document.createTextNode(data));
            }

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    return gBuildUtils;
});
