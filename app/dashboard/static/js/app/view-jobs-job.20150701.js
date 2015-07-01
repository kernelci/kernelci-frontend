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
    'utils/request',
    'utils/error',
    'utils/tables',
    'charts/passrate'
], function($, i, b, r, e, t, chart) {
    'use strict';
    var jobName = null,
        dateRange = null,
        buildsTable = null,
        searchFilter = null,
        pageLen = null;

    function getBootStatsFail() {
        var content = '<div class="pull-center">' +
            '<h4>Error loading boot data.</h4></div>';
        b.replaceById('boot-pass-rate', content);
    }

    function getBootStatsDone(response) {
        chart.bootpassrate('boot-pass-rate', response);
    }

    function getBootStats() {
        var deferred,
            data;

        data = {
            job: jobName,
            sort: 'created_on',
            sort_order: 1,
            date_range: dateRange * 2,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootStatsFail)
            .done(getBootStatsDone);
    }

    function getDefconfigsStatsFail() {
        var content = '<div class="pull-center">' +
            '<h4>Error loading build data.</h4></div>';
        b.replaceById('build-pass-rate', content);
    }

    function getDefconfigsStatsDone(response) {
        chart.buildpassrate('build-pass-rate', response);
    }

    function getDefconfigsStats() {
        var deferred,
            data;

        data = {
            job: jobName,
            sort: 'created_on',
            sort_order: 1,
            date_range: dateRange * 2,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/defconf', data);
        $.when(deferred)
            .fail(e.error, getDefconfigsStatsFail)
            .done(getDefconfigsStatsDone);
    }

    function getBuildBootCountFail() {
        b.replaceByClass('.count-badge', '&infin;');
    }

    function getBuildBootCountDone(response) {
        var batchData = response.result,
            batchLen = batchData.length,
            batchCount = null,
            idx = 0;

        if (batchLen > 0) {
            for (idx; idx < batchLen; idx = idx + 1) {
                batchCount = batchData[idx].result[0].count;
                b.replaceById(batchData[idx].operation_id, batchCount);
            }
        }
        // Perform the table search now, after completing all operations.
        buildsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBuildBootCount(response) {
        var localData = response.result,
            len = localData.length,
            queriesLen = len * 4,
            batchElements = 4,
            data,
            kernel,
            deferred,
            z = 0,
            j = 0,
            k = 0,
            batchQueries = new Array(queriesLen);

        if (len > 0) {
            for (z; z < queriesLen; z += batchElements) {
                j = z;
                k = z / batchElements;
                kernel = localData[k].kernel;

                // Get successful defconfig count.
                batchQueries[z] = {
                    'method': 'GET',
                    'operation_id': 'build-success-count-' + k,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=PASS&date_range=' + dateRange +
                        '&job=' + jobName + '&kernel=' + kernel
                };

                // Get failed defconfig count.
                batchQueries[j + 1] = {
                    'method': 'GET',
                    'operation_id': 'build-fail-count-' + k,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=FAIL&date_range=' + dateRange +
                        '&job=' + jobName + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchQueries[j + 2] = {
                    'method': 'GET',
                    'operation_id': 'boot-success-count-' + k,
                    'collection': 'count',
                    'document_id': 'boot',
                    'query': 'status=PASS&date_range=' + dateRange +
                        '&job=' + jobName + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchQueries[j + 3] = {
                    'method': 'GET',
                    'operation_id': 'boot-fail-count-' + k,
                    'collection': 'count',
                    'document_id': 'boot',
                    'query': 'status=FAIL&date_range=' + dateRange +
                        '&job=' + jobName + '&kernel=' + kernel
                };
            }

            data = JSON.stringify({
                'batch': batchQueries
            });

            deferred = r.post('/_ajax/batch', data);

            $.when(deferred)
                .fail(e.error, getBuildBootCountFail)
                .done(getBuildBootCountDone);
        } else {
            b.replaceByClass('count-badge', '?');
        }
    }

    function getDefconfigsDone(data) {
        var localData = data.result,
            len = localData.length,
            columns;

        if (len === 0) {
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No builds data available.</strong></div>'
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
                    'data': 'kernel',
                    'title': 'Kernel',
                    'type': 'string',
                    'className': 'kernel-column',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'git_branch',
                    'title': 'Branch',
                    'type': 'string',
                    'className': 'branch-column',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'git_commit',
                    'title': 'Commit',
                    'type': 'string',
                    'className': 'commit-column',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="' + data + '">' + data + '</span>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="Successful/Failed defconfigs built">' +
                        'Build Status</span>',
                    'type': 'string',
                    'className': 'build-count pull-center',
                    'render': function(data, type, object, meta) {
                        var idx = meta.row,
                            rend;
                        rend = '<span ' +
                            'class="badge alert-success extra-margin">' +
                            '<span id="build-success-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="build-fail-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>';
                        return rend;
                    }
                },
                {
                    'data': 'kernel',
                    'title': '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="Successful/Failed boot reports">' +
                        'Boot Status</span>',
                    'type': 'string',
                    'className': 'boot-count pull-center',
                    'render': function(data, type, object, meta) {
                        var href,
                            rend,
                            idx = meta.row;
                        href = '/boot/all/job/' + object.job + '/kernel/' +
                            data + '/';
                        rend = '<a href="' + href + '">' +
                            '<span class="badge alert-success extra-margin">' +
                            '<span id="boot-success-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="boot-fail-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '</a>';

                        return rend;
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
                    'data': 'kernel',
                    'title': '',
                    'orderable': false,
                    'searchable': false,
                    'width': '30px',
                    'className': 'pull-center',
                    'render': function(data, type, object) {
                        var job = object.job,
                            href = '/build/' + job + '/kernel/' + data + '/';
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="Details for build&nbsp;' + job +
                            '&nbsp;&dash;&nbsp;' + data + '">' +
                            '<a href="' + href + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            buildsTable
                .noIDUrl(true)
                .tableData(localData)
                .columns(columns)
                .order([6, 'desc'])
                .menu('builds per page')
                .rowURLElements(['job', 'kernel'])
                .draw();
        }
    }

    function getDefconfigsFailed() {
        var content = '<div class="pull-center">' +
            '<h4>Error loading builds data.</h4>' +
            '</div>';
        b.replaceById('table-loading', '');
        b.replaceById('table-div', content);
    }

    function getDefconfigs() {
        var data,
            deferred;

        data = {
            'aggregate': 'kernel',
            'job': jobName,
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': [
                'job', 'kernel', 'created_on', 'git_branch', 'git_commit'
            ]
        };

        deferred = r.get('/_ajax/defconf', data);
        $.when(deferred)
            .fail(e.error, getDefconfigsFailed)
            .done(getDefconfigsDone)
            .done(getBuildBootCount);
    }

    function getDetailsDone(data) {
        var localData = data.result,
            dataLen = localData.length,
            firstResult = null,
            secondResult = null,
            thirdResult = null,
            firstCount = 0,
            secondCount = 0,
            thirdCount = 0;

        if (dataLen === 3) {
            firstResult = localData[0];
            secondResult = localData[1];
            thirdResult = localData[2];

            firstCount = firstResult.result[0].count;
            secondCount = secondResult.result[0].count;
            thirdCount = thirdResult.result[0].count;

            b.replaceById(firstResult.operation_id, firstCount);
            b.replaceById(secondResult.operation_id, secondCount);
            b.replaceById(thirdResult.operation_id, thirdCount);
        } else {
            b.replaceByClass('.count-list-badge', '?');
        }
    }

    function getDetailsFailed() {
        b.replaceByClass('count-list-badge', '&infin;');
    }

    function getDetails() {
        var queryString = 'job=' + jobName + '&date_range=' + dateRange,
            batchQueries = new Array(3),
            data,
            deferred;

        batchQueries[0] = {
            'operation_id': 'builds-count',
            'method': 'GET',
            'collection': 'count',
            'document_id': 'job',
            'query': queryString
        };

        batchQueries[1] = {
            'operation_id': 'defconfs-count',
            'method': 'GET',
            'collection': 'count',
            'document_id': 'defconfig',
            'query': queryString
        };

        batchQueries[2] = {
            'operation_id': 'boot-reports-count',
            'method': 'GET',
            'collection': 'count',
            'document_id': 'boot',
            'query': queryString
        };

        data = JSON.stringify({
            'batch': batchQueries
        });

        deferred = r.post('/_ajax/batch', data);
        $.when(deferred)
            .fail(e.error, getDetailsFailed)
            .done(getDetailsDone);
    }

    // Setup and perform base operations.
    i();

    document.getElementById('li-job').setAttribute('class', 'active');

    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }

    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }

    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }

    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }

    if (jobName !== null && dateRange !== null) {
        buildsTable = t(['jobstable', 'table-loading', 'table-div'], true);
        getDetails();
        getDefconfigs();
        getDefconfigsStats();
        getBootStats();
    } else {
        getDetailsFailed();
        getDefconfigsFailed();
        getBuildBootCountFail();
        getBootStatsFail();
    }
});
