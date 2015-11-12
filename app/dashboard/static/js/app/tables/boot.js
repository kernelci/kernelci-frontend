/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'utils/urls',
    'tables/common'
], function(html, urls, tcommon) {
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
     * Create the boot logs element.
     *
     * @private
     * @param {string} txtLog: The TXT boot log file name.
     * @param {string} htmlLog: The HTML boot log file name.
     * @param {string} labName: The name of the boot lab.
     * @param {URI} serverURI: The URI of the file server.
     * @param {string} pathURI: The path part to the log file on the server.
     * @return {Element} An HTML node if at least on of txtLog or htmlLog
     * are not null or null.
    **/
    function _createBootLog(txtLog, htmlLog, labName, serverURI, pathURI) {
        var aNode,
            logPath,
            retVal,
            tooltipNode;

        retVal = null;
        if (txtLog || htmlLog) {
            retVal = document.createElement('span');

            if (txtLog) {
                if (txtLog.search(labName) === -1) {
                    logPath = pathURI + '/' + labName + '/' + txtLog;
                } else {
                    logPath = pathURI + '/' + txtLog;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View raw text log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href', serverURI.path(logPath).normalizePath().href());
                aNode.appendChild(document.createTextNode('txt'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                tooltipNode.appendChild(aNode);
                retVal.appendChild(tooltipNode);
            }

            if (htmlLog) {
                if (txtLog) {
                    retVal.insertAdjacentHTML(
                        'beforeend', '&nbsp;&mdash;&nbsp;');
                }

                if (htmlLog.search(labName) === -1) {
                    logPath = pathURI + '/' + labName + '/' + htmlLog;
                } else {
                    logPath = pathURI + '/' + htmlLog;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View HTML log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href', serverURI.path(logPath).normalizePath().href());
                aNode.appendChild(document.createTextNode('html'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                tooltipNode.appendChild(aNode);
                retVal.appendChild(tooltipNode);
            }
        }

        return retVal;
    }

    /**
     * Create the actual count badge.
     *
     * @private
    **/
    function _tableKernelCount(kernel, type) {
        var classes,
            iNode,
            nodeId,
            spanNode;

        switch (type) {
            case 'success':
                nodeId = 'success-count-' + kernel;
                classes = [
                    'badge', 'alert-success', 'count-badge'
                ];
                break;
            default:
                nodeId = 'fail-count-' + kernel;
                classes = [
                    'badge', 'alert-danger', 'count-badge'
                ];
                break;
        }

        spanNode = document.createElement('span');
        spanNode.id = nodeId;
        spanNode.className = classes.join(' ');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cog fa-spin';

        spanNode.appendChild(iNode);

        return spanNode.outerHTML;
    }

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
     * Function to render the detail column on a table.
     *
     * @private
     * @param {string} board: The board name.
     * @param {object} object: The entire data set.
     * @return {Element} The DOM element.
    **/
    function _bootDetail(board, object) {
        var aNode,
            tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot report details');

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/' + board + '/job/' + object.job +
            '/kernel/' + object.kernel +
            '/defconfig/' + object.defconfig_full +
            '/lab/' + object.lab_name + '/?_id=' + object._id.$oid
        );

        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        return tooltipNode;
    }

    /**
     * Function to render the lab column on a table.
     *
     * @param {string} lab: The lab name.
     * @param {string} type: The type of the display option.
     * @return {string} The HTML string of the cell node.
    **/
    gBootUtils.renderTableLabAll = function(lab, type) {
        var aNode,
            rendered,
            tooltipNode;

        rendered = lab;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for lab&nbsp;' + lab);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute('href', '/boot/all/lab/' + lab + '/');
            aNode.appendChild(document.createTextNode(lab));

            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
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
    gBootUtils.renderTableBoard = function(board, type, object) {
        var aNode,
            job,
            kernel,
            tooltipNode,
            rendered;

        rendered = board;
        if (type === 'display') {
            job = object.job;
            kernel = object.kernel;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for board&nbsp;' + board +
                '&nbsp;with&nbsp;' + job + '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute(
                'href',
                '/boot/' + board + '/job/' + job + '/kernel/' + kernel + '/'
            );

            aNode.appendChild(document.createTextNode(board));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the kernel column on a table.
     * Special case for the count of builds/boots.
     *
     * @param {string} kernel: The kernel value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableKernelCountSuccess = function(kernel, type) {
        var rendered;

        rendered = null;
        if (type === 'display') {
            rendered = _tableKernelCount(kernel, 'success');
        }

        return rendered;
    };

    /**
     * Function to render the kernel column on a table with.
     * Special case for the count of builds/boots.
     *
     * @param {string} kernel: The kernel value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableKernelCountFail = function(kernel, type) {
        var rendered;

        rendered = null;
        if (type === 'display') {
            rendered = _tableKernelCount(kernel, 'fail');
        }

        return rendered;
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {string} tree: The tree value.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableTree = function(tree, type, object) {
        var aNode,
            rendered,
            tooltipNode;

        rendered = tree;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Boot reports for&nbsp;' + tree);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute(
                'href', '/boot/' + object.board + '/job/' + tree + '/');

            aNode.appendChild(document.createTextNode(tree));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the tree column on a table.
     *
     * @param {string} tree: The tree value.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row, plus the
     * default value for the file server URL.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableTreeAll = function(tree, type) {
        var aNode,
            rendered,
            tooltipNode;

        rendered = tree;
        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Boot reports for&nbsp;' + tree);

            aNode = document.createElement('a');
            aNode.className = 'table-link';
            aNode.setAttribute('href', '/boot/all/job/' + tree + '/');

            aNode.appendChild(document.createTextNode(tree));
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        }

        return rendered;
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
    gBootUtils.renderTableDefconfig = function(defconfig, type, object) {
        var aNode,
            board,
            job,
            kernel,
            rendered,
            tooltipNode;

        rendered = defconfig;
        if (type === 'display') {
            board = object.board;
            job = object.job;
            kernel = object.kernel;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for&nbsp;' + defconfig);

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
    gBootUtils.renderTableKernel = function(kernel, type, object) {
        var aNode,
            job,
            tooltipNode,
            rendered;

        rendered = kernel;
        if (type === 'display') {
            job = object.job;
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for&nbsp;' + kernel);

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
        }

        return rendered;
    };

    /**
     * Function to render the boot failure description.
     *
     * @param {string} data: The failure description.
     * @return {Element} The DOM element.
    **/
    gBootUtils.resultDescription = function(data) {
        return _resultDescription(data);
    };

    /**
     * Function to render the boot failure description column on a table.
     *
     * @param {string} data: The failure description.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableResultDescription = function(data, type) {
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
    gBootUtils.renderTableLogs = function(data, type, object) {
        var arch,
            defconfig,
            job,
            kernel,
            logNode,
            pathURI,
            rendered,
            serverResource,
            serverURI,
            translatedURI;

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

            logNode = _createBootLog(
                object.boot_log,
                object.boot_log_html,
                object.lab_name,
                serverURI,
                pathURI
            );
            if (logNode) {
                rendered = logNode.outerHTML;
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
    gBootUtils.renderTableDate = function(date, type) {
        return tcommon.renderTableDate(date, type);
    };

    /**
     * Function to render the date.
     *
     * @param {object} date: The date object.
     * @return {Element} The DOM element.
    **/
    gBootUtils.bootDate = function(date) {
        return tcommon.dateNode(date);
    };

    /**
     * Create the boot status element.
     *
     * @param {string} status: The boot status.
     * @return {HTMLElement} The status node.
    **/
    gBootUtils.statusNode = function(status) {
        return tcommon.renderTableStatus(status, gStatusDefaults);
    };

    /**
     * Function to render the status column on a table.
     *
     * @param {string} status: The status value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableStatus = function(status, type) {
        var rendered;

        rendered = status;
        if (type === 'display') {
            rendered = tcommon.renderTableStatus(
                status, gStatusDefaults).outerHTML;
        }

        return rendered;
    };

    /**
     * Function to render the boot detail.
     *
     * @param {string} board: The board name.
     * @param {object} object: The entire data set.
     * @return {Element} The DOM element.
    **/
    gBootUtils.bootDetail = function(board, object) {
        return _bootDetail(board, object);
    };

    /**
     * Function to render the detail column on a table.
     * This is tightly couple with how dataTables work.
     *
     * @param {string} board: The board name.
     * @param {string} type: The type of the display option.
     * @param {object} object: The entire data set for the row.
     * @return {string} The rendered element as a string.
    **/
    gBootUtils.renderTableDetail = function(board, type, object) {
        var rendered;

        rendered = null;
        if (type === 'display') {
            rendered = _bootDetail(board, object).outerHTML;
        }

        return rendered;
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
     * Function to render the SoC column on a table.
     *
     * @param {string} soc: The SoC value.
     * @param {string} type: The type of the display option.
     * @return {string} The rendered element as string.
    **/
    gBootUtils.renderTableSoc = function(soc, type) {
        var aNode,
            rendered,
            tooltipNode;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for SoC&nbsp;' + soc);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + soc + '/');
            aNode.className = 'table-link';
            aNode.appendChild(document.createTextNode(soc));

            tooltipNode.appendChild(aNode);
            rendered = tooltipNode.outerHTML;
        } else {
            rendered = soc;
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
        return _createBootLog(txtLog, htmlLog, labName, serverURI, pathURI);
    };

    return gBootUtils;
});
