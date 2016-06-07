/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/boot',
    'utils/html',
    'utils/urls',
    'tables/common'
], function(boot, html, urls, tcommon) {
    'use strict';
    var gBootUtils,
        gStatusDefaults;

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
        var tooltipNode;

        rendered = lab;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', lab);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute('href', '/boot/all/lab/' + lab + '/');
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
        var job;
        var kernel;
        var tooltipNode;
        var rendered;

        rendered = board;
        if (type === 'display') {
            job = object.job;
            kernel = object.kernel;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', board);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute(
                'href',
                '/boot/' + board + '/job/' + job + '/kernel/' + kernel + '/');

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
    gBootUtils.countFail = function(kernel, type) {
        var node;
        var rendered;

        rendered = null;
        if (type === 'display') {
            node = tcommon.countBadge(kernel, 'fail');
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
        var board;
        var job;
        var kernel;
        var rendered;
        var tooltipNode;

        rendered = defconfig;
        if (type === 'display') {
            board = object.board;
            job = object.job;
            kernel = object.kernel;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', defconfig);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute(
                'href',
                '/boot/' + board + '/job/' + job +
                '/kernel/' + kernel + '/defconfig/' +
                defconfig + '/'
            );

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
        var job;
        var tooltipNode;
        var rendered;

        rendered = kernel;
        if (type === 'display') {
            job = object.job;
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', kernel);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute(
                'href',
                '/boot/all/job/' + job + '/kernel/' +
                kernel + '/'
            );

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
        var arch;
        var defconfig;
        var job;
        var kernel;
        var logNode;
        var pathURI;
        var rendered;
        var serverResource;
        var serverURI;
        var translatedURI;

        rendered = null;
        if (type === 'display') {

            if (!data) {
                data = object.default_file_server;
            }

            arch = object.arch;
            defconfig = object.defconfig_full;
            job = object.job;
            kernel = object.kernel;
            serverResource = object.file_server_resource;

            translatedURI = urls.translateServerURL(
                data, serverResource, [job, kernel, arch + '-' + defconfig]
            );
            serverURI = translatedURI[0];
            pathURI = translatedURI[1];

            logNode = boot.createBootLog(
                object.boot_log,
                object.boot_log_html,
                object.lab_name,
                serverURI,
                pathURI
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
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'More info');

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/id/' + object._id.$oid + '/');

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
        return tcommon.renderDetails('/boot/id/' + data.$oid + '/', type);
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
        var aNode,
            kernel,
            rendered,
            tooltipNode;

        rendered = null;
        if (type === 'display') {
            kernel = object.kernel;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + job + '&nbsp;&dash;&nbsp;' + kernel
            );
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/boot/all/job/' + job + '/kernel/' + kernel + '/');

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
