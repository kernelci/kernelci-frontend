/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gJobUtils,
        gStatusDefaults;

    gJobUtils = {};

    gStatusDefaults = {
        pass: 'Build completed',
        build: 'Building',
        fail: 'Build failed',
        default: 'Unknown status'
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
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTree = function(tree, type) {
        return tcommon.renderTree(tree, type, '/job/' + tree + '/');
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
