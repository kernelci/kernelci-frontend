/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'utils/date'
], function(html) {
    'use strict';
    var gTablesUtils;

    gTablesUtils = {};

    /**
     * Function to render the date.
     *
     * @private
     * @param {object} date: The date object.
     * @return {Element} A DOM element.
    **/
    function _dateNode(date) {
        var created,
            timeNode;

        if (date) {
            created = new Date(date.$date);

            timeNode = document.createElement('time');
            timeNode.setAttribute('datetime', created.toISOString());
            timeNode.appendChild(
                document.createTextNode(created.toCustomISODate()));
        } else {
            timeNode = html.nonavail();
        }

        return timeNode;
    }

    /**
     * Create the actual count badge.
     *
     * @return {Element} A DOM element.
    **/
    function _countBadge(data, type, extraClasses, idStart) {
        var classes,
            iNode,
            nodeId,
            spanNode;

        if (idStart && idStart.length > 0) {
            nodeId = idStart;
        } else {
            nodeId = '';
        }

        switch (type) {
            case 'success':
                nodeId = nodeId + 'success-count-' + data;
                classes = ['badge', 'alert-success', 'count-badge'];
                break;
            case 'fail':
                nodeId = nodeId + 'fail-count-' + data;
                classes = ['badge', 'alert-danger', 'count-badge'];
                break;
            default:
                nodeId = nodeId + 'count-' + data;
                classes = ['badge', 'count-badge'];
                break;
        }

        if (extraClasses && extraClasses.length > 0) {
            classes = classes.concat(extraClasses);
        }

        spanNode = document.createElement('span');
        spanNode.id = nodeId;
        spanNode.className = classes.join(' ');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cog fa-spin count-content';

        spanNode.appendChild(iNode);

        return spanNode;
    }

    /**
     * Create the actual count badge.
     *
     * @private
     * @param {String} data: The data value.
     * @param {String} type: The type of the badge: 'success' or 'fail'.
     * @param {Array} extraClasses: Array of classes to add to the badges.
     * @param {String} idStart: Head string for the id of the badge.
     * @return {Element} The badge node as an HTMLElement.
    **/
    gTablesUtils.countBadge = function(data, type, extraClasses, idStart) {
        return _countBadge(data, type, extraClasses, idStart);
    };

    /**
     * Create the success/count fail count badges.
     *
     * @param {Object} settings: An object with the necessary data. Its
     * properties include:
     * - data: The actual data.
     * - href: The href attribute for the link.
     * - extraClasses: Extra CSS classes to add to the badge.
     * - idStart: Head element for the id of the badge.
    **/
    gTablesUtils.countSuccessFail = function(settings) {
        var aNode,
            divNode,
            failNode,
            successNode,
            rendered;

        if (settings.type === 'display') {
            divNode = document.createElement('div');

            successNode = _countBadge(
                settings.data,
                'success', settings.extraClasses, settings.idStart);
            failNode = _countBadge(
                settings.data,
                'fail', settings.extraClasses, settings.idStart);

            if (settings.href) {
                aNode = document.createElement('a');
                aNode.className = 'clean-link';
                aNode.setAttribute('href', settings.href);

                aNode.appendChild(successNode);
                aNode.appendChild(failNode);

                divNode.appendChild(aNode);
            } else {
                divNode.appendChild(successNode);
                divNode.appendChild(failNode);
            }

            rendered = divNode.outerHTML;
        } else {
            rendered = null;
        }

        return rendered;
    };

    /**
     * Function to render the date.
     *
     * @param {object} date: The date object.
     * @return {Element} The DOM element.
    **/
    gTablesUtils.dateNode = function(date) {
        return _dateNode(date);
    };

    /**
     * Function to render the date column on a table.
     *
     * @param {object} date: The date object.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gTablesUtils.renderDate = function(date, type) {
        var created,
            rendered;

        if (date) {
            if (type === 'display') {
                rendered = _dateNode(date).outerHTML;
            } else {
                created = new Date(date.$date);
                rendered = created.toCustomISODate();
            }
        } else {
            rendered = date;
            if (type === 'display') {
                rendered = html.nonavail().outerHTML;
            }
        }

        return rendered;
    };

    /**
     * Render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {object} defaults: The default values for the status string.
     * @return {Element} The DOM element.
    **/
    gTablesUtils.renderStatus = function(status, defaults) {
        var tooltipNode;

        tooltipNode = html.tooltip();
        switch (status) {
            case 'BUILD':
                tooltipNode.setAttribute('title', defaults.build);
                tooltipNode.appendChild(html.building());
                break;
            case 'PASS':
                tooltipNode.setAttribute('title', defaults.pass);
                tooltipNode.appendChild(html.success());
                break;
            case 'FAIL':
                tooltipNode.setAttribute('title', defaults.fail);
                tooltipNode.appendChild(html.fail());
                break;
            case 'OFFLINE':
                tooltipNode.setAttribute('title', defaults.offline);
                tooltipNode.appendChild(html.offline());
                break;
            default:
                tooltipNode.setAttribute('title', defaults.default);
                tooltipNode.appendChild(html.unknown());
                break;
        }

        return tooltipNode;
    };

    /**
     * Render the details column on a table.
     *
     * @param {String} href: The link location.
     * @param {String} type: The type of the display option.
     * @param {String} title: The title for the tooltip.
    **/
    gTablesUtils.renderDetails = function(href, type, title) {
        var aNode,
            rendered,
            tooltipNode;

        rendered = null;
        if (type === 'display') {
            tooltipNode = html.tooltip();

            if (title && title.length > 0) {
                tooltipNode.setAttribute('title', title);
            } else {
                tooltipNode.setAttribute('title', 'More info');
            }

            aNode = document.createElement('a');
            aNode.setAttribute('href', href);

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    return gTablesUtils;
});
