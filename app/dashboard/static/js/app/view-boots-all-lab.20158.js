/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables'
], function($, b, e, i, r, t) {
    'use strict';
    var bootsTable,
        labName,
        dateRange,
        pageLen,
        searchFilter,
        rowURLFmt;

    rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

    function getBootsFail() {
        b.removeElement('table-loading');
        b.replaceById(
            'table-div',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns;

        if (resLen > 0) {
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
                        var branch = object.git_branch,
                            tTitle = data,
                            hrefData = data,
                            href;
                        if (branch !== null && branch !== undefined) {
                            tTitle = data + '&nbsp;&dash;&nbsp;' + branch;
                            hrefData = data + '&nbsp;&dash;&nbsp;<small>' +
                                branch + '</small>';
                        }
                        href = '<a class="table-link" href="/boot/all/job/' +
                            data + '/">' + hrefData + '</a>';
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + tTitle + '">' + href + '</span>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'className': 'kernel-column',
                    'render': function(data, type, object) {
                        var href;
                        href = '<a class="table-link" href="/boot/all/job/' +
                            object.job + '/kernel/' + data + '/">' + data +
                            '</a>';
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' + href + '</span>';
                    }
                },
                {
                    'data': 'board',
                    'title': 'Board Model',
                    'className': 'board-column',
                    'render': function(data, type, object) {
                        var href = '<a class="table-link" href="/boot/' + data +
                            '/job/' + object.job + '/kernel/' +
                            object.kernel + '/">' + data + '</a>';
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' + href + '</span>';
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

                        href = '/boot/' + board + '/job/' + job + '/kernel/' +
                            kernel + '/defconfig/' + data + '/';

                        return '<span rel="tooltip" ' +
                            'data-toggle="tooltip" title="' + data + '">' +
                            '<a class="table-link" href="' + href + '">' +
                            data + '</a></span>';
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
                                    '<i class="fa fa-check"></i>' +
                                    '</span></span>';
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
                            '&dash;' + defconfigFull +
                            '&nbsp;&dash;&nbsp;(' + lab + ')' +
                            '"><a href="/boot/' + data + '/job/' + job +
                            '/kernel/' + kernel + '/defconfig/' +
                            defconfigFull + '/lab/' + lab + '/?_id=' +
                            object._id.$oid + '">' +
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
        } else {
            b.removeElement('table-loading');
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No data found.</strong></div>');
        }
    }

    function getBoots() {
        var deferred,
            data;
        data = {
            'lab_name': labName,
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

        if (document.getElementById('lab-name') !== null) {
            labName = document.getElementById('lab-name').value;
        }
        if (document.getElementById('date-range') !== null) {
            dateRange = document.getElementById('date-range').value;
        }
        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }

        bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
        getBoots();
    });
});
