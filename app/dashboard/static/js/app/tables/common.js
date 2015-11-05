/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'utils/date'
], function(html) {
    'use strict';
    var tablesUtils;

    tablesUtils = {};

    /**
     * Function to render the date column on a table.
     *
     * @param {object} date: The date object.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    tablesUtils.renderTableDate = function(date, type) {
        var created,
            iNode,
            rendered,
            timeNode,
            tooltipNode;

        if (date === null) {
            rendered = date;
            if (type === 'display') {
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('Not available');

                iNode = document.createElement('i');
                iNode.className = 'fa fa-ban';

                tooltipNode.appendChild(iNode);
                rendered = tooltipNode.outerHTML;
            }
        } else {
            created = new Date(date.$date);
            rendered = created.toCustomISODate();

            if (type === 'display') {
                timeNode = document.createElement('time');
                timeNode.setAttribute('datetime', created.toISOString());
                timeNode.appendChild(
                    document.createTextNode(created.toCustomISODate()));
                rendered = timeNode.outerHTML;
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
    tablesUtils.renderTableStatus = function(status, defaults) {
        var tooltipNode;

        tooltipNode = html.tooltip();
        switch (status) {
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

    return tablesUtils;
});
