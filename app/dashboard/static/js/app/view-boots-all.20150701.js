// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/tables'
], function($, i, b, e, r, t) {
    'use strict';
    var searchFilter = null,
        pageLen = null,
        bootsTable = null,
        dateRange = 14,
        rowURLFmt,
        successLabel,
        failLabel,
        offlineLabel,
        unknownLabel;

    rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';
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
        b.replaceById(
            'table-loading',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            len = results.length,
            columns;

        if (len === 0) {
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No boots data available.</strong></div>'
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
                    'data': 'job',
                    'title': 'Tree &dash; Branch',
                    'type': 'string',
                    'className': 'tree-column',
                    'render': function(data, type, object) {
                        var hrefData = data,
                            tTitle = data,
                            branch = object.git_branch;
                        if (branch !== null && branch !== undefined) {
                            tTitle = data + '&nbsp;&dash;&nbsp;' + branch;
                            hrefData = data + '&nbsp;&dash;&nbsp;<small>' +
                                branch + '</small>';
                        }
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + tTitle + '">' +
                            '<a class="table-link" href="' +
                            '/boot/all/job/' + data + '/">' + hrefData +
                            '</a></span>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'className': 'kernel-column',
                    'render': function(data, type, object) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="' +
                            '/boot/all/job/' + object.job +
                            '/kernel/' + data + '/">' + data + '</a></span>';
                    }
                },
                {
                    'data': 'board',
                    'title': 'Board Model',
                    'type': 'string',
                    'className': 'board-column',
                    'render': function(data, type, object) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="' +
                            '/boot/' + data + '/job/' + object.job +
                            '/kernel/' + object.kernel + '/">' +
                            data + '</a></span>';
                    }
                },
                {
                    'data': 'defconfig_full',
                    'title': 'Defconfig',
                    'className': 'defconfig-column',
                    'render': function(data, type, object) {
                        var href = null,
                            board = object.board,
                            job = object.job,
                            kernel = object.kernel;

                        href = '/boot/' + board + '/job/' + job +
                            '/kernel/' + kernel + '/defconfig/' + data + '/';

                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="' + href + '">' +
                            data + '</a></span>';
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
            'date_range': dateRange
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
