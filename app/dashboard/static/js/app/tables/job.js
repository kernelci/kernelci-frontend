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
     * Create the count badges.
     *
     * @private
     * @param {string} job: The name of the tree/job.
     * @param {string} type: If this is a 'build' or 'boot'.
     * @param {string} href: The base value of the href, the passed job value
     * will be appended.
    **/
    function _tableCount(job, type, href) {
        var failClasses,
            successClasses,
            failNodeId,
            successNodeId,
            divNode,
            iNode,
            badgeNode,
            aNode;

        successClasses = [
            'badge', 'alert-success', 'extra-margin', 'count-badge'
        ];
        failClasses = [
            'badge', 'alert-danger', 'extra-margin', 'count-badge'
        ];
        switch (type) {
            case 'build':
                successNodeId = 'build-success-count-' + job;
                failNodeId = 'build-fail-count-' + job;
                break;
            default:
                successNodeId = 'boot-success-count-' + job;
                failNodeId = 'boot-fail-count-' + job;
                break;
        }

        divNode = document.createElement('div');

        aNode = document.createElement('a');
        aNode.className = 'clean-link';
        aNode.setAttribute('href', href + job + '/');

        badgeNode = document.createElement('span');
        badgeNode.id = successNodeId;
        badgeNode.className = successClasses.join(' ');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cog fa-spin';

        badgeNode.appendChild(iNode);
        aNode.appendChild(badgeNode);

        badgeNode = document.createElement('span');
        badgeNode.id = failNodeId;
        badgeNode.className = failClasses.join(' ');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cog fa-spin';

        badgeNode.appendChild(iNode);
        aNode.appendChild(badgeNode);

        divNode.appendChild(aNode);

        return divNode;
    }

    /**
     * Function to render the boots count column on a table.
     *
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBootCount = function(job, type) {
        var rendered;

        rendered = null;
        if (type === 'display') {
            rendered = _tableCount(job, 'boot', '/boot/all/job/').outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the builds count column on a table.
     *
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableBuildCount = function(job, type) {
        var rendered;

        rendered = null;
        if (type === 'display') {
            rendered = _tableCount(job, 'build', '/job/').outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {object} job: The name of the tree/job.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableTree = function(job, type) {
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
    gJobUtils.renderTableDate = function(date, type) {
        return tcommon.renderTableDate(date, type);
    };

    /**
     * Function to render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gJobUtils.renderTableStatus = function(status, type) {
        var rendered;

        rendered = status;
        if (type === 'display') {
            rendered = tcommon.renderTableStatus(
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
    gJobUtils.renderTableDetail = function(job, type) {
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
