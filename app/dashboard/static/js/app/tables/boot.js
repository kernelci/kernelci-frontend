/*!
 * Copyright (C) Linaro Limited 2015,2016,2017,2019
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
    'utils/boot',
    'utils/html',
    'utils/urls',
    'tables/common'
], function(boot, html, urls, tcommon) {
    'use strict';
    var gBootUtils;
    var gStatusDefaults;

    gBootUtils = {};

    gStatusDefaults = {
        pass: 'Board booted successfully',
        fail: 'Board boot failed',
        offline: 'Board offline',
        default: 'Board boot status unknown'
    };

    /**
     * Function to render the boot failure description.
     *
     * @private
     * @param {string} data: The failure description.
     * @return {Element} The DOM element.
    **/
    function _resultDescription(data) {
        var tooltipNode;
        data = html.escape(data);

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', data);
        tooltipNode.insertAdjacentHTML('beforeend', data);

        return tooltipNode;
    }

    /**
     * Function to render the lab column on a table.
     *
     * @param {string} lab: The lab name.
     * @param {string} type: The type of the display option.
     * @return {string} The HTML string of the cell node.
    **/
    gBootUtils.renderLab = function(lab, type) {
        var aNode;
        var rendered;
        var str;
        var tooltipNode;

        rendered = lab;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', lab);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            str = '/boot/all/lab/';
            str += lab;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(document.createTextNode(lab));

            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        }

        return rendered;
    };

    /**
     * Function to render the board column on a table.
     *
     * @param {string} board: The board value.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderBoard = function(board, type, object) {
        var aNode;
        var rendered;
        var str;
        var tooltipNode;

        rendered = board;
        if (type === 'display') {

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', board);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            str = '/boot/';
            str += board;
            str += '/job/';
            str += object.job;
            str += '/kernel/';
            str += object.kernel;
            str += '/';
            aNode.setAttribute('href', str);

            aNode.appendChild(document.createTextNode(board));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        }

        return rendered;
    };

    /**
     * Function to render the success count column on a table.
     *
     * @param {string} data: The data value being passed.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.countSuccess = function(kernel, type) {
        var node;
        var rendered;

        rendered = null;
        if (type === 'display') {
            node = tcommon.countBadge(kernel, 'success');
            rendered = node.outerHTML;
            // Remove the node.
            node.remove();
        }

        return rendered;
    };

    /**
     * Function to render the fail count column on a table.
     *
     * @param {string} data: The data value being passed.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.countFail = function(data, type) {
        var node;
        var rendered;

        rendered = null;
        if (type === 'display') {
            node = tcommon.countBadge(data, 'fail');
            rendered = node.outerHTML;
            // Remove the node.
            node.remove();
        }

        return rendered;
    };

    /**
     * Function to render the total count column on a table.
     *
     * @param {string} data: The data value being passed.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.countTotal = function(data, type) {
        var node;
        var rendered;

        rendered = null;
        if (type === 'display') {
            node = tcommon.countBadge(data, 'total');
            rendered = node.outerHTML;
            // Remove the node.
            node.remove();
        }

        return rendered;
    };

    /**
     * Function to render the count of other/unknown on a table.
     *
     * @param {string} data: The data value being passed.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.countUnknown = function(data, type) {
        var node;
        var rendered;

        rendered = null;
        if (type === 'display') {
            node = tcommon.countBadge(data, 'unknown');
            rendered = node.outerHTML;
            // Remove the node.
            node.remove();
        }
        return rendered;
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {string} tree: The tree value.
     * @param {string} type: The type of the display option.
     * @param {string} href: The href value to associate wit the node.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };

    /**
     * Function to render the defconfig column on a table.
     *
     * @param {string} defconfig: The defconfig value.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderDefconfig = function(defconfig, type, object) {
        var aNode;
        var rendered;
        var str;
        var tooltipNode;

        rendered = defconfig;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', defconfig);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            str = '/boot/';
            str += object.board;
            str += '/job/';
            str += object.job;
            str += '/branch/';
            str += object.git_branch;
            str += '/kernel/';
            str += object.kernel;
            str += '/defconfig/';
            str += defconfig;
            str += '/';
            aNode.setAttribute('href', str);

            aNode.appendChild(document.createTextNode(defconfig));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        }

        return rendered;
    };

    /**
     * Function to render the kernel column on a table.
     *
     * @param {string} kernel: The kernel value.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderKernel = function(kernel, type, object) {
        var aNode;
        var str;
        var tooltipNode;
        var rendered;

        rendered = kernel;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', kernel);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            str = '/boot/all/job/';
            str += object.job;
            str += '/branch/';
            str += object.git_branch;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);

            aNode.appendChild(document.createTextNode(kernel));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;

            // Remove the nodes.
            aNode.remove();
            tooltipNode.remove();
        }

        return rendered;
    };

    /**
     * Function to render the boot failure description.
     *
     * @param {string} data: The failure description.
     * @return {Element} The DOM element.
    **/
    gBootUtils.resultDescriptionNode = function(data) {
        return _resultDescription(data);
    };

    /**
     * Function to render the boot failure description column on a table.
     *
     * @param {string} data: The failure description.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderResultDescription = function(data, type) {
        var rendered;

        rendered = '';
        if (data) {
            rendered = data;

            if (type === 'display') {
                rendered = _resultDescription(data).outerHTML;
            }
        }
        return rendered;
    };

    /**
     * Function to render the boot logs column on a table.
     *
     * @param {string} data: The file server URL as from the data.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderBootLogs = function(data, type, object) {
        var logNode;
        var rendered;
        var translatedURI;

        rendered = null;
        if (type === 'display') {

            if (!data) {
                data = object.default_file_server;
            }

            translatedURI = urls.createFileServerURL(data, object);

            logNode = boot.createBootLog(
                object.boot_log,
                object.boot_log_html,
                object.lab_name,
                translatedURI[0],
                translatedURI[1]
            );

            if (logNode) {
                rendered = logNode.outerHTML;
                // Remove the node.
                logNode.remove();
            }
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
    gBootUtils.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };

    /**
     * Function to render the date.
     *
     * @param {object} date: The date object.
     * @return {Element} The DOM element.
    **/
    gBootUtils.dateNode = function(date) {
        return tcommon.dateNode(date);
    };

    /**
     * Create the boot status element.
     *
     * @param {string} status: The boot status.
     * @return {HTMLElement} The status node.
    **/
    gBootUtils.statusNode = function(status) {
        return tcommon.statusNode(status, gStatusDefaults);
    };

    /**
     * Function to render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderStatus = function(status, type) {
        return tcommon.renderStatus(status, type, gStatusDefaults);
    };

    /**
     * Function to render the boot detail.
     *
     * @param {string} board: The board name.
     * @param {object} object: The entire data set.
     * @return {Element} The DOM element.
    **/
    gBootUtils.detailsNode = function(board, object) {
        var aNode;
        var str;
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'More info');

        aNode = document.createElement('a');
        str = '/boot/id/';
        str += object._id.$oid;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        return tooltipNode;
    };

    /**
     * Function to render the detail column on a table.
     * This is tightly couple with how dataTables work.
     *
     * @param {string} data: The board name.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderDetails = function(data, type) {
        var href = '/boot/id/';
        href += data.$oid;
        href += '/';
        return tcommon.renderDetails(href, type);
    };

    /**
     * Function to render the detail column on a table, with job links.
     *
     * @param {string} job: The job name.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableDetailJob = function(job, type, object) {
        var aNode;
        var rendered;
        var str;
        var tooltipNode;

        rendered = null;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            str = 'Boot reports for&nbsp;';
            str += job;
            str += '&nbsp;&ndash;&nbsp;';
            str += object.kernel;
            str += '&nbsp;(';
            str += object.git_branch;
            str += ')';
            tooltipNode.setAttribute('title', str);

            aNode = document.createElement('a');
            str = '/boot/all/job/';
            str += job;
            str += '/branch/';
            str += object.git_branch;
            str += '/kernel/';
            str += object.kernel;
            str += '/';
            aNode.setAttribute('href', str);

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    /**
     * Create the boot logs element.
     *
     * @param {string} txtLog: The TXT boot log file name.
     * @param {string} htmlLog: The HTML boot log file name.
     * @param {string} labName: The name of the boot lab.
     * @param {URI} serverURI: The URI of the file server.
     * @param {string} pathURI: The path part to the log file on the server.
     * @return {Element} An HTML node if at least on of txtLog or htmlLog
     * are not null or null.
    **/
    gBootUtils.createBootLog = function(
            txtLog, htmlLog, labName, serverURI, pathURI) {
        return boot.createBootLog(
            txtLog, htmlLog, labName, serverURI, pathURI);
    };

    return gBootUtils;
});
