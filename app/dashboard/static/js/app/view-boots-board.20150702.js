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
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables'
], function($, b, e, i, r, t) {
    'use strict';
    var bootsTable,
        boardName,
        dateRang,
        pageLen,
        searchFilter;

    function getBootsFail() {
        b.removeElement('table-loading');
        b.replaceById(
            'table-div',
            '<div class="pull-center"><strong>' +
            'Error loading board data.</strong></div>'
        );
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
                'No board data found.</strong></div>'
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
                    'title': 'Tree',
                    'type': 'string',
                    'className': 'tree-column',
                    'render': function(data) {
                        return '<a class="table-link" href="/boot/' +
                            boardName + '/job/' + data + '/">' +
                            data + '</a>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'render': function(data, type, object) {
                        return '<a class="table-link" href="/boot/all/job/' +
                            object.job + '/kernel/' + data + '/">' + data +
                            '</a>';
                    }
                },
                {
                    'data': 'defconfig_full',
                    'title': 'Defconfig',
                    'className': 'defconfig-column',
                    'render': function(data, type, object) {
                        var href = null,
                            job = object.job,
                            kernel = object.kernel;

                        href = '/boot/' + boardName + '/job/' + job +
                            '/kernel/' + kernel + '/defconfig/' + data + '/';

                        return '<span rel="tooltip" ' +
                            'data-toggle="tooltip" ' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="' + href + '">' +
                            data + '</a></span>';
                    }
                },
                {
                    'data': 'lab_name',
                    'title': 'Lab Name',
                    'type': 'string'
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
                            'with&nbsp;' +
                            job + '&dash;' + kernel + '&dash;' +
                            defconfigFull +
                            '&nbsp;&dash;&nbsp;(' + lab + ')' +
                            '"><a href="/boot/' + data + '/job/' + job +
                            '/kernel/' + kernel + '/defconfig/' +
                            defconfigFull +
                            '/lab/' + lab + '/?_id=' + object._id.$oid +
                            '"><i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
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

        if (document.getElementById('board-name') !== null) {
            boardName = document.getElementById('board-name').value;
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
