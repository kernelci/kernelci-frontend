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
     * @return {Element} The DOM element.
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
    gTablesUtils.renderTableDate = function(date, type) {
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
    gTablesUtils.renderTableStatus = function(status, defaults) {
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

    return gTablesUtils;
});
