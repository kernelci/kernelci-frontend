/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common',
    'utils/date'
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
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBootCount = function(job, type) {
        return tcommon.countAll({
            data: job,
            type: type,
            extraClasses: ['extra-margin'],
            idStart: 'boot-',
            href: '/boot/all/job/' + job + '/'
        });
    };

    /**
     * Function to render the builds count column on a table.
     *
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBuildCount = function(job, type) {
        return tcommon.countAll({
            data: job,
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
    gJobUtils.renderTree = function(job, type) {
        var aNode,
            rendered;

        rendered = job;
        if (type === 'display') {
            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute('href', '/job/' + job + '/');

            aNode.appendChild(document.createTextNode(job));

            rendered = aNode.outerHTML;
        }

        return rendered;
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
        var rendered;

        rendered = status;
        if (type === 'display') {
            rendered = tcommon.renderStatus(
                status, gStatusDefaults).outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the detail column on a table.
     *
     * @param {string} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderDetails = function(job, type) {
        var aNode,
            rendered,
            tooltipNode;

        rendered = null;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for&nbsp;' + job);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/job/' + job + '/');

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    return gJobUtils;
});
