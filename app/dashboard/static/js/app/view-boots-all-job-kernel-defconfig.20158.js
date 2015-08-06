/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/urls'
], function($, i, b, e, r, t, u) {
    'use strict';
    var bootsTable,
        jobName = null,
        kernelName = null,
        defconfigFull = null,
        pageLen = null,
        searchFilter = null,
        fileServer = null,
        rowURLFmt;

    rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

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
            'Error loading data..</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns;

        if (resLen === 0) {
            b.removeElement('table-loading');
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No boot reports found.</strong></div>'
            );
        } else {
            columns = [
                {
                    'data': '_id',
                    'visible': false,
                    'searchable': false,
                    'orderable': false
                },
                {
                    'data': 'board',
                    'title': 'Board Model',
                    'className': 'board-column',
                    'render': function(data) {
                        return '<a class="table-link" href="/boot/' + data +
                            '/job/' + jobName + '/kernel/' +
                            kernelName + '/">' + data + '</a>';
                    }
                },
                {
                    'data': 'lab_name',
                    'title': 'Lab Name',
                    'class': 'lab-column',
                    'render': function(data) {
                        return '<a class="table-link" href="/boot/all/lab/' +
                            data + '/">' + data + '</a>';
                    }
                },
                {
                    'data': 'boot_result_description',
                    'title': 'Failure Reason',
                    'type': 'string',
                    'className': 'failure-column',
                    'render': function(data, type, object) {
                        var display = '&nbsp;',
                            status = object.status;
                        if (data !== null && status !== 'PASS') {
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
                            fileServerURI,
                            translatedURI,
                            fileServerURL = object.file_server_url,
                            fileServerResource = object.file_server_resource,
                            defconfig = object.defconfig_full,
                            lab = object.lab_name,
                            pathURI = null,
                            bootLog = data,
                            bootLogHtml = object.boot_log_html,
                            display = '',
                            lFileServer = fileServer,
                            fileServerData;

                        if (fileServerURL !== null &&
                                fileServerURL !== undefined) {
                            lFileServer = fileServerURL;
                        }

                        fileServerData = [
                            jobName, kernelName, arch + '-' + defconfig
                        ];
                        translatedURI = u.translateServerURL(
                            fileServerURL,
                            lFileServer, fileServerResource, fileServerData);
                        fileServerURI = translatedURI[0];
                        pathURI = translatedURI[1];

                        display = createBootLogContent(
                            bootLog,
                            bootLogHtml,
                            lab, fileServerURI, pathURI, '&nbsp;');

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
                        return created.getCustomISODate();
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
                                    '<i class="fa fa-check"></i></span>' +
                                    '</span>';
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
                    'className': 'pull-center',
                    'width': '30px',
                    'render': function(data, type, object) {
                        var lab = object.lab_name;
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for board&nbsp;' + data +
                            '&nbsp;with&nbsp;' +
                            jobName + '&dash;' + kernelName + '&dash;' +
                            defconfigFull +
                            '&nbsp;&dash;&nbsp;(' + lab + ')' +
                            '"><a href="/boot/' + data + '/job/' + jobName +
                            '/kernel/' + kernelName + '/defconfig/' +
                            defconfigFull +
                            '/lab/' + lab + '/?_id=' + object._id.$oid + '">' +
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
                    [
                        'board', 'job', 'kernel', 'defconfig_full', 'lab_name'
                    ]
                )
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
            'job': jobName,
            'kernel': kernelName,
            'defconfig_full': defconfigFull
        };
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    $(document).ready(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }
        if (document.getElementById('kernel-name') !== null) {
            kernelName = document.getElementById('kernel-name').value;
        }
        if (document.getElementById('defconfig-full') !== null) {
            defconfigFull = document.getElementById('defconfig-full').value;
        }
        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }
        if (document.getElementById('file-server') !== null) {
            fileServer = document.getElementById('file-server').value;
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
            'dd-defconfig',
            defconfigFull + '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" title="' +
            'Details for build&nbsp;' + jobName + '&nbsp;&dash;&nbsp;' +
            kernelName + '&nbsp;&dash;&nbsp;' + defconfigFull + '">' +
            '<a href="/build/' + jobName + '/kernel/' + kernelName +
            '/defconfig/' + defconfigFull +
            '/"><i class="fa fa-cube"></i></a></span>'
        );

        bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
        getBoots();
    });
});
