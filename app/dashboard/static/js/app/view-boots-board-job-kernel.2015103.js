/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/urls',
    'utils/date'
], function($, b, e, init, r, t, u) {
    'use strict';
    var bootsTable,
        pageLen,
        searchFilter,
        boardName,
        kernelName,
        jobName,
        fileServer;

    function createBootLogContent(
            bootLogTxt, bootLogHtml, lab, fileServerURI, pathURI, na) {
        var retVal = na,
            logPath,
            displ = '';
        if (bootLogTxt !== null || bootLogHtml !== null) {
            if (bootLogTxt !== null) {
                if (bootLogTxt.search(lab) === -1) {
                    logPath = pathURI + '/' + lab + '/' + bootLogTxt;
                } else {
                    logPath = pathURI + '/' + bootLogTxt;
                }
                displ = '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View raw text boot log"><a href="' +
                    fileServerURI.path(logPath).normalizePath().href() +
                    '">txt' +
                    '&nbsp;<i class="fa fa-external-link"></i></a></span>';
            }

            if (bootLogHtml !== null) {
                if (bootLogTxt !== null) {
                    displ += '&nbsp;&mdash;&nbsp;';
                }
                if (bootLogHtml.search(lab) === -1) {
                    logPath = pathURI + '/' + lab + '/' + bootLogHtml;
                } else {
                    logPath = pathURI + '/' + bootLogHtml;
                }

                displ += '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View HTML boot log"><a href="' +
                    fileServerURI.path(logPath).normalizePath().href() +
                    '">html&nbsp;' +
                    '<i class="fa fa-external-link"></i></a></span>';
            }
            retVal = displ;
        }
        return retVal;
    }

    function getBootsFail() {
        b.removeElement('table-loading');
        b.replaceById(
            'table-div',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>');
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns,
            rowURLFmt;

        rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
            '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

        if (resLen === 0) {
            b.removeElement('table-loading');
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No data found.</strong></div>');
        } else {
            columns = [
                {
                    'data': '_id',
                    'visible': false,
                    'searchable': false,
                    'orderable': false
                },
                {
                    'data': 'lab_name',
                    'title': 'Lab Name',
                    'type': 'string',
                    'render': function(data) {
                        return '<a class="table-link" href="/boot/all/lab/' +
                            data + '/">' + data + '</a>';
                    }
                },
                {
                    'data': 'defconfig_full',
                    'title': 'Defconfig',
                    'className': 'defconfig-column',
                    'render': function(data) {
                        return '<span rel="tooltip" ' +
                            'data-toggle="tooltip" ' +
                            'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'boot_result_description',
                    'title': 'Failure Reason',
                    'type': 'string',
                    'className': 'failure-column',
                    'render': function(data, type, object) {
                        var display = '',
                            status = object.status;
                        if (data !== null && status !== 'PASS') {
                            data = b.escapeHtml(data);
                            display = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="' + data + '">' + data + '</span>';
                        }
                        return display;
                    }
                },
                {
                    'data': 'boot_log',
                    'title': 'Boot Log',
                    'type': 'string',
                    'render': function(data, type, object) {
                        var arch = object.arch,
                            fileServerURL = object.file_server_url,
                            fileServerResource = object.file_server_resource,
                            defconfigFull = object.defconfig_full,
                            lab = object.lab_name,
                            bootLogHtml = object.boot_log_html,
                            display = '',
                            fileServerData,
                            translatedURI;

                        if (fileServerURL === null ||
                                fileServerURL === undefined) {
                            fileServerURL = fileServer;
                        }

                        fileServerData = [
                            jobName, kernelName, arch + '-' + defconfigFull
                        ];
                        translatedURI = u.translateServerURL(
                            fileServerURL, fileServerResource, fileServerData);

                        display = createBootLogContent(
                            data,
                            bootLogHtml,
                            lab, translatedURI[0], translatedURI[1], '&nbsp;');

                        return display;
                    }
                },
                {
                    'data': 'created_on',
                    'title': 'Date',
                    'type': 'date',
                    'className': 'date-column pull-center',
                    'render': function(data) {
                        var created = new Date(data.$date);
                        return created.toCustomISODate();
                    }
                },
                {
                    'data': 'status',
                    'title': 'Status',
                    'type': 'string',
                    'className': 'pull-center',
                    'render': function(data) {
                        var displ;
                        switch (data) {
                            case 'PASS':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Boot completed">' +
                                    '<span class="label label-success">' +
                                    '<i class="fa fa-check"></i></span></span>';
                                break;
                            case 'FAIL':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Boot failed">' +
                                    '<span class="label label-danger">' +
                                    '<i class="fa fa-exclamation-triangle">' +
                                    '</i></span></span>';
                                break;
                            case 'OFFLINE':
                                displ = '<span rel="tooltip"' +
                                    'data-toggle="tooltip"' +
                                    'title="Board offline"' +
                                    '<span class="label label-info">' +
                                    '<i class="fa fa-power-off">' +
                                    '</i></span></span>';
                                break;
                            default:
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Unknown status">' +
                                    '<span class="label label-warning">' +
                                    '<i class="fa fa-question">' +
                                    '</i></span></span>';
                                break;
                        }
                        return displ;
                    }
                },
                {
                    'data': 'board',
                    'title': '',
                    'orderable': false,
                    'searchable': false,
                    'width': '30px',
                    'className': 'pull-center',
                    'render': function(data, type, object) {
                        var defconfigFull = object.defconfig_full,
                            kernel = object.kernel,
                            job = object.job,
                            lab = object.lab_name;

                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for board&nbsp;' + data +
                            ' with&nbsp;' + job + '&dash;' + kernel +
                            '&dash;' + defconfigFull + '&nbsp;&dash;&nbsp;(' +
                            lab + ')"><a href="/boot/' + data + '/job/' +
                            job + '/kernel/' + kernel + '/defconfig/' +
                            defconfigFull + '/lab/' + lab +
                            '/?_id=' + object._id.$oid + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
                .menu('boot reports per page')
                .rowURL(rowURLFmt)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name'])
                .draw();

            bootsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBoots() {
        var deferred,
            data;
        data = {
            'board': boardName,
            'job': jobName,
            'kernel': kernelName
        };
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    $(document).ready(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
        // Setup and perform base operations.
        init.hotkeys();
        init.tooltip();

        if (document.getElementById('board-name') !== null) {
            boardName = document.getElementById('board-name').value;
        }
        if (document.getElementById('kernel-name') !== null) {
            kernelName = document.getElementById('kernel-name').value;
        }
        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }
        if (document.getElementById('file-server') !== null) {
            fileServer = document.getElementById('file-server').value;
        }
        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }

        b.replaceById(
            'dd-tree',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + jobName + '">' +
            '<a href="/boot/all/job/' + jobName + '">' + jobName +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + jobName +
            '"><a href="/job/' + jobName +
            '"><i class="fa fa-sitemap"></i></a></span>'
        );
        b.replaceById(
            'dd-git-describe',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot report details for&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' +
            kernelName + '"><a href="/boot/all/job/' + jobName +
            '/kernel/' + kernelName + '">' + kernelName +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' +
            kernelName + '"><a href="/build/' + jobName +
            '/kernel/' + kernelName +
            '"><i class="fa fa-cube"></i></a></span>'
        );
        b.replaceById(
            'dd-board',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="All boot reports for board&nbsp;&#171;' + boardName +
            '&#187;"><a href="/boot/' + boardName + '/">' + boardName +
            '&nbsp;<i class="fa fa-search"></i></a></span>'
        );

        bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
        getBoots();
    });
});
