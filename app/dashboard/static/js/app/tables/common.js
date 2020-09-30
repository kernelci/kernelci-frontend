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
    'utils/html'
], function(html) {
    'use strict';
    var gCache,
        gTablesUtils;

    gCache = {};
    gTablesUtils = {};

    /**
     * Function to render the date.
     *
     * @private
     * @param {object} date: The date object.
     * @return {Element} A DOM element.
    **/
    function _dateNode(date) {
        var timeNode;

        if (date) {
            timeNode = html.time(date);
        } else {
            timeNode = html.nonavail();
        }

        return timeNode;
    }

    function _toStatusCacheKey(status, defaults) {
        var objKey;

        objKey = status;
        Object.keys(defaults).forEach(function(key) {
            objKey = objKey + key + defaults[key];
        });

        return objKey;
    }

    /**
     * Create the actual count badge.
     *
     * @return {Element} A DOM element.
     **/
    function _countBadge(settings, type) {
        var classes;
        var iNode;
        var nodeId;
        var spanNode;

        switch (type) {
            case 'pass':
                classes = ['badge', 'alert-success', 'count-badge'];
                break;
            case 'fail':
                classes = ['badge', 'alert-danger', 'count-badge'];
                break;
            case 'warning':
                classes = ['badge', 'alert-warning', 'count-badge'];
                break;
            case 'total':
            default:
                classes = ['badge', 'count-badge'];
                break;
        }

        nodeId = settings.idStart || '';
        if (type)
            nodeId += type + '-';
        nodeId += 'count-' + settings.data;

        if (settings.extraClasses && settings.extraClasses.length > 0) {
            classes = classes.concat(settings.extraClasses);
        }

        spanNode = document.createElement('span');
        spanNode.id = nodeId;
        spanNode.className = classes.join(' ');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-circle-o-notch fa-spin fa-fw count-content';
        spanNode.appendChild(iNode);

        return spanNode;
    }

    function _statusNode(status, defaults) {
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
            case 'WARNING':
                tooltipNode.setAttribute('title', defaults.warning);
                tooltipNode.appendChild(html.warning());
                break;
            default:
                tooltipNode.setAttribute('title', defaults.default);
                tooltipNode.appendChild(html.unknown());
                break;
        }

        return tooltipNode;
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
    gTablesUtils.countBadge = function(settings, badgeType=null) {
        return _countBadge(settings, badgeType).outerHTML;
    };

    /**
     * Create the total/success/fail/other count badges.
     *
     * @param {Object} settings: An object with the necessary data. Its
     * properties include:
     * - data: The actual data.
     * - href: The href attribute for the link.
     * - extraClasses: Extra CSS classes to add to the badge.
     * - idStart: Head element for the id of the badge.
    **/
    gTablesUtils.countAll = function(settings, badgeTypes) {
        var aNode;
        var divNode;
        var rendered;
        var badges = [];

        if (settings.type === 'display') {
            divNode = document.createElement('div');

            badgeTypes.forEach(function(badgeType) {
                badges.push(_countBadge(settings, badgeType));
            });

            if (settings.href) {
                aNode = document.createElement('a');
                aNode.className = 'clean-link';
                aNode.setAttribute('href', settings.href);

                badges.forEach(function(badge) {
                    aNode.appendChild(badge);
                });

                divNode.appendChild(aNode);
            } else {
                badges.forEach(function(badge) {
                    divNode.appendChild(badge);
                });
            }

            rendered = divNode.outerHTML;

            // Remove the nodes.
            badges.forEach(function(badge) {
                badge.remove();
            });
            if (aNode) {
                aNode.remove();
            }
            divNode.remove();
        } else {
            rendered = null;
        }

        return rendered;
    };

    gTablesUtils.renderTree = function(tree, type, href) {
        var aNode;
        var rendered;
        var tooltipNode;

        rendered = tree;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', tree);
            if (href && href.length > 0) {
                aNode = document.createElement('a');
                aNode.className = 'table-link';
                aNode.setAttribute('href', href);
                aNode.appendChild(document.createTextNode(tree));
                tooltipNode.appendChild(aNode);
            } else {
                tooltipNode.appendChild(document.createTextNode(tree));
            }
            rendered = tooltipNode.outerHTML;
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
        var created;
        var node;
        var rendered;

        if (date) {
            if (type === 'display') {
                node = _dateNode(date).firstElementChild;
                rendered = node.outerHTML;
            } else {
                created = new Date(date.$date);
                rendered = created.toCustomISODate();
            }
        } else {
            rendered = date;
            if (type === 'display') {
                node = html.nonavail().firstElementChild;
                rendered = node.outerHTML;
            }
        }

        return rendered;
    };

    gTablesUtils.statusNode = function(status, defaults) {
        return _statusNode(status, defaults);
    };

    /**
     * Render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {object} defaults: The default values for the status string.
     * @return {Element} The DOM element.
    **/
    gTablesUtils.renderStatus = function(status, type, defaults) {
        var cacheKey;
        var node;
        var rendered;

        if (type === 'display') {
            cacheKey = _toStatusCacheKey(status, defaults);
            if (gCache.hasOwnProperty(cacheKey)) {
                rendered = gCache[cacheKey];
            } else {
                node = _statusNode(status, defaults);
                rendered = node.outerHTML;
                gCache[cacheKey] = rendered;
                // Remove the node.
                node.remove();
            }
        } else {
            rendered = status;
        }

        return rendered;
    };

    /**
     * Render the details column on a table.
     *
     * @param {String} href: The link location.
     * @param {String} type: The type of the display option.
     * @param {String} title: The title for the tooltip.
    **/
    gTablesUtils.renderDetails = function(href, type, title) {
        var aNode;
        var rendered;
        var tooltipNode;

        rendered = null;
        if (type === 'display') {
            tooltipNode = html.tooltip();

            if (title && title.length > 0) {
                tooltipNode.setAttribute('title', title);
            } else {
                tooltipNode.setAttribute('title', 'More info');
            }

            if (href) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', href);
            } else {
                aNode = document.createElement('span');
            }

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        }

        return rendered;
    };

    /**
     * Render the kernel column on a table.
     *
     * @param {String} href: The link location.
     * @param {String} type: The type of the display option.
     * @param {String} href: The href to associate with the node.
     * @return {String} The HTML string to be rendered by dataTables.
    **/
    gTablesUtils.renderKernel = function(data, type, href) {
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
            // Remove the nodes.
            if (aNode) {
                aNode.remove();
            }
            tooltipNode.remove();
        }

        return rendered;
    };

    return gTablesUtils;
});
