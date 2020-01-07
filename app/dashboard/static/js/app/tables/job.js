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
    var gJobUtils;
    var gStatusDefaults;

    gJobUtils = {};

    gStatusDefaults = {
        pass: 'Build completed',
        build: 'Building',
        fail: 'Build failed',
        default: 'Unknown status'
    };

    gJobUtils.renderTestsCount = function(settings) {
        settings.extraClasses = ['extra-margin'];
        settings.idStart = 'tests-';
        return tcommon.countAll(settings);
    };

    gJobUtils.renderBuildCount = function(settings) {
        settings.extraClasses = ['extra-margin'];
        settings.idStart = 'build-';
        return tcommon.countAll(settings);
    };

    /**
     * Function to render the boots count column on a table.
     *
     * @param {string} data: The actual data passed (tree or kernel).
     * @param {string} type: The type of the display option.
     * @param {string} href: The href to associate with the element.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBootCount = function(data, type, href) {
        return tcommon.countAll({
            data: data,
            type: type,
            extraClasses: ['extra-margin'],
            idStart: 'boot-',
            href: href
        });
    };

    /**
     * Function to render the builds count column on a table.
     *
     * @param {string} data: The actual data passed (tree or kernel).
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBuildCount = function(data, type) {
        return tcommon.countAll({
            data: data,
            type: type,
            extraClasses: ['extra-margin'],
            idStart: 'build-'
        });
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {object} data: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @param {String} href The URL for the link node.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTree = function(data, type, href) {
        return tcommon.renderTree(data, type, href);
    };

    /**
     * Function to render the date column on a table.
     *
     * @param {object} date: The date object.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    /**
     * Function to render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderStatus = function(status, type) {
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
    gJobUtils.renderDetails = function(href, type, tooltip) {
        return tcommon.renderDetails(href, type, tooltip);
    };

    /**
     * Render the kernel column.
     *
     * @param {string} data: The actual data value.
     * @param {string} type: The type of the display option.
     * @param {string} href: The href to associate with the element.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderKernel = function(data, type, href) {
        return tcommon.renderKernel(data, type, href);
    };

    /**
     * Render the commit column.
     *
     * @param {string} data: The actual data value.
     * @param {string} type: The type of the display option.
     * @param {string} href: The href to associate with the element.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderCommit = function(data, type, href) {
        var aNode,
            rendered,
            tooltipNode;

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

    return gJobUtils;
});
