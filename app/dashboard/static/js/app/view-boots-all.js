// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
define([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/tables',
    'sprintf'
], function($, i, b, e, r, t, p) {
    'use strict';
    var searchFilter = null,
        pageLen = null,
        bootsTable = null,
        dateRange = 14,
        eDiv,
        rowURLFmt,
        hrefFmt,
        bootAllUrl,
        bootAllJKUrl,
        bootBoardJKUrl,
        bootDefconfigUrl,
        tooltipFmt,
        successLabel,
        failLabel,
        offlineLabel,
        unknownLabel;

    eDiv = '<div class="pull-center"><h4>%s</h4></div>';
    rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';
    bootAllUrl = '/boot/all/job/%s/';
    bootAllJKUrl = '/boot/all/job/%s/kernel/%s/';
    bootBoardJKUrl = '/boot/%s/job/%s/kernel/%s/';
    bootDefconfigUrl = '/boot/%s/job/%s/kernel/%s/defconfig/%s/';
    hrefFmt = '<a class="table-link" href="%s">%s</a>';
    tooltipFmt = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="%s">%s</span>';
    successLabel = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Boot completed"><span class="label label-success">' +
        '<i class="fa fa-check"></i></span></span>';
    failLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Boot failed"> <span class="label label-danger">' +
        '<i class="fa fa-exclamation-triangle"></i></span></span>';
    offlineLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Board offline" <span class="label label-info">' +
        '<i class="fa fa-power-off"></i></span></span>';
    unknownLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Unknown status"><span class="label label-warning">' +
        '<i class="fa fa-question"></i></span></span>';

    function getBootsFail() {
        b.replaceById('table-loading', p.sprintf(eDiv, 'Error loading data.'));
    }

    function getBootsDone(response) {
        var results = response.result,
            len = results.length,
            tableDiv,
            columns;

        if (len === 0) {
            tableDiv = b.checkElement('table-div');
            b.replaceById(
                tableDiv[0], p.sprintf(eDiv, 'No boots data available.'));
        } else {
            columns = [
                {
                    'data': '_id',
                    'visible': false,
                    'searchable': false,
                    'orderable': false
                },
                {
                    'data': 'job',
                    'title': 'Tree &dash; Branch',
                    'type': 'string',
                    'className': 'tree-column',
                    'render': function(data, type, object) {
                        var display,
                            hrefData,
                            tTitle,
                            branch = object.git_branch;

                        hrefData = data;
                        tTitle = data;
                        if (branch !== null && branch !== undefined) {
                            tTitle = data + '&nbsp;&dash;&nbsp;' + branch;
                            hrefData = data + '&nbsp;&dash;&nbsp;<small>' +
                                branch + '</small>';
                        }
                        display = p.sprintf(
                            tooltipFmt,
                            tTitle,
                            p.sprintf(
                                hrefFmt,
                                p.sprintf(bootAllUrl, data), hrefData)
                        );

                        return display;
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'className': 'kernel-column',
                    'render': function(data, type, object) {
                        var display = p.sprintf(
                            tooltipFmt,
                            data,
                            p.sprintf(
                                hrefFmt,
                                p.sprintf(bootAllJKUrl, object.job, data),
                                data)
                        );
                        return display;
                    }
                },
                {
                    'data': 'board',
                    'title': 'Board Model',
                    'type': 'string',
                    'className': 'board-column',
                    'render': function(data, type, object) {
                        var display = p.sprintf(
                            tooltipFmt,
                            data,
                            p.sprintf(
                                hrefFmt,
                                p.sprintf(
                                    bootBoardJKUrl,
                                    data,
                                    object.job,
                                    object.kernel),
                                data
                            )
                        );
                        return display;
                    }
                },
                {
                    'data': 'defconfig_full',
                    'title': 'Defconfig',
                    'className': 'defconfig-column',
                    'render': function(data, type, object) {
                        var display = null,
                            href = null,
                            board = object.board,
                            job = object.job,
                            kernel = object.kernel;

                        href = p.sprintf(
                            bootDefconfigUrl, board, job, kernel, data);
                        display = p.sprintf(
                            tooltipFmt,
                            data,
                            p.sprintf(hrefFmt, href, data)
                        );
                        return display;
                    }
                },
                {
                    'data': 'arch',
                    'title': 'Arch.',
                    'type': 'string'
                },
                {
                    'data': 'lab_name',
                    'title': 'Lab Name',
                    'className': 'lab-column',
                    'render': function(data) {
                        return '<small>' + data + '</small>';
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
                                displ = successLabel;
                                break;
                            case 'FAIL':
                                displ = failLabel;
                                break;
                            case 'OFFLINE':
                                displ = offlineLabel;
                                break;
                            default:
                                displ = unknownLabel;
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
                            'with&nbsp;' + job + '&dash;' + kernel +
                            '&dash;' + defconfigFull + '&nbsp;&dash;&nbsp;(' +
                            lab + ')"><a href="/boot/' + data + '/job/' +
                            job + '/kernel/' + kernel + '/defconfig/' +
                            defconfigFull + '/lab/' + lab + '/?_id=' +
                            object._id.$oid + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([7, 'desc'])
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
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': [
                '_id', 'job', 'kernel', 'board', 'created_on',
                'status', 'lab_name', 'defconfig_full', 'arch', 'git_branch'
            ]
        };
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    $(document).ready(function() {
        // Setup and perform base operations.
        i();

        document.getElementById('li-boot').setAttribute('class', 'active');

        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }
        if (document.getElementById('date-range') !== null) {
            dateRange = document.getElementById('date-range').value;
        }

        bootsTable = t(['bootstable', 'table-loading', 'table-div'], true);
        getBoots();
    });
});
