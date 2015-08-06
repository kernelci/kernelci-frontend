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
    var buildsTable,
        searchFilter,
        pageLen,
        dateRange = 14,
        rowURLFmt;

    rowURLFmt = '/build/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/';

    function getBuildsFail() {
        b.removeElement('table-loading');
        b.replaceById(
            'table-div',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
    }

    function getBuildsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns;

        if (resLen === 0) {
            b.removeElement('table-loading');
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No data available.</strong></div>'
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
                    'className': 'tree-column',
                    'render': function(data, type, object) {
                        var display = '<a class="table-link" href="/job/' +
                            data + '/">' + data;

                        if (object.git_branch !== null) {
                            display += '&nbsp;&dash;&nbsp;<small>' +
                                object.git_branch + '</small>';
                        }
                        return display + '</a>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'className': 'kernel-column',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'defconfig_full',
                    'title': 'Defconfig',
                    'className': 'defconfig-column',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'arch',
                    'title': 'Arch.'
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
                                    'title="Build completed">' +
                                    '<span class="label label-success">' +
                                    '<li class="fa fa-check"></li>' +
                                    '</span></span>';
                                break;
                            case 'FAIL':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Build failed">' +
                                    '<span class="label label-danger">' +
                                    '<li class="fa fa-exclamation-triangle">' +
                                    '</li></span></span>';
                                break;
                            default:
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Unknown status">' +
                                    '<span class="label label-warning">' +
                                    '<li class="fa fa-question">' +
                                    '</li></span></span>';
                                break;
                        }
                        return displ;
                    }
                },
                {
                    'data': 'job',
                    'title': '',
                    'orderable': false,
                    'searchable': false,
                    'className': 'pull-center',
                    'render': function(data, type, object) {
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for&nbsp;' + data +
                            '&nbsp;&dash;&nbsp;' + object.kernel +
                            '&nbsp;&dash;&nbsp;' + object.defconfig_full +
                            '">' +
                            '<a href="/build/' + data +
                            '/kernel/' + object.kernel + '/defconfig/' +
                            object.defconfig_full + '/">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            buildsTable
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
                .menu('build reports per page')
                .rowURL(rowURLFmt)
                .rowURLElements(['job', 'kernel', 'defconfig_full'])
                .draw();

            buildsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBuilds() {
        var deferred,
            data;
        data = {
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': [
                '_id', 'job', 'kernel', 'status',
                'arch', 'created_on', 'git_branch', 'defconfig_full'
            ]
        };
        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone);
    }

    $(document).ready(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
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

        buildsTable = t(['builds-table', 'table-loading', 'table-div'], true);
        getBuilds();
    });
});
