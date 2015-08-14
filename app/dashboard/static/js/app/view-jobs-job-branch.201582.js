/*! Kernel CI Dashboard v2015.8.2 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error',
    'utils/tables',
    'utils/urls',
    'charts/passrate'
], function($, i, b, r, e, t, u, chart) {
    'use strict';
    var jobName = null,
        branchName = null,
        numberRange = 20,
        buildsTable = null,
        searchFilter = null,
        pageLen = null;

    function getBootStatsFail() {
        b.replaceById(
            'boot-pass-rate',
            '<div class="pull-center">' +
            '<strong>Error loading boot data.</strong></div>'
        );
    }

    function getBootStatsDone(response) {
        chart.bootpassrate('boot-pass-rate', response);
    }

    function getBootStats(startDate, dateRange) {
        var deferred,
            data;

        data = {
            job: jobName,
            git_branch: branchName,
            sort: 'created_on',
            sort_order: 1,
            created_on: startDate,
            date_range: dateRange,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootStatsFail)
            .done(getBootStatsDone);
    }

    function getDefconfigsStatsFail() {
        b.replaceById('build-pass-rate',
            '<div class="pull-center">' +
            '<strong>Error loading build data.</strong></div>');
    }

    function getDefconfigsStatsDone(response) {
        chart.buildpassrate('build-pass-rate', response);
    }

    function getDefconfigsStats(startDate, dateRange) {
        var deferred,
            data;

        data = {
            job: jobName,
            git_branch: branchName,
            sort: 'created_on',
            sort_order: 1,
            created_on: startDate,
            date_range: dateRange,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getDefconfigsStatsFail)
            .done(getDefconfigsStatsDone);
    }

    function getTrendsData(response) {
        var results = response.result,
            resLen = results.length,
            firstDate,
            lastDate,
            lDateRange = 0;

        if (resLen > 0) {
            firstDate = new Date(results[0].created_on.$date);
            if (resLen > 1) {
                lastDate = new Date(results[resLen - 1].created_on.$date);
                lDateRange = Math.round((firstDate - lastDate) / 86400000);
            }

            getDefconfigsStats(firstDate.getCustomISODate(), lDateRange);
            getBootStats(firstDate.getCustomISODate(), lDateRange);
        } else {
            b.replaceById(
                'build-pass-rate',
                '<div class="pull-center">' +
                '<strong>No build data available.</strong></div>');
            b.replaceById(
                'boot-pass-rate',
                '<div class="pull-center">' +
                '<strong>No boot data available.</strong></div>'
            );
        }
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

                // Get successful build count.
                batchQueries[z] = {
                    method: 'GET',
                    operation_id: 'build-success-count-' + k,
                    resource: 'count',
                    document: 'build',
                    query: 'status=PASS&job=' + jobName + '&kernel=' + kernel
                };

                // Get failed build count.
                batchQueries[j + 1] = {
                    method: 'GET',
                    operation_id: 'build-fail-count-' + k,
                    resource: 'count',
                    document: 'build',
                    query: 'status=FAIL&job=' + jobName + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchQueries[j + 2] = {
                    method: 'GET',
                    operation_id: 'boot-success-count-' + k,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + jobName + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchQueries[j + 3] = {
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + k,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + jobName + '&kernel=' + kernel
                };
            }

            data = JSON.stringify({
                batch: batchQueries
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
                            'title="' + data + '">' +
                            '<a class="table-link" href="/build/' + jobName +
                            '/kernel/' + data + '">' + data + '</a></span>';
                    }
                },
                {
                    'data': 'git_commit',
                    'title': 'Commit',
                    'type': 'string',
                    'className': 'commit-column',
                    'render': function(data, type, object) {
                        var gitURLs,
                            href = data;
                        gitURLs = u.translateCommit(object.git_url, data);
                        if (gitURLs[1] !== null) {
                            href = '<a class="table-link" href="' +
                                gitURLs[1] + '">' + data + '</a>';
                        }
                        return '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="' + data + '">' + href + '</span>';
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
                        return '<span ' +
                            'class="badge alert-success extra-margin">' +
                            '<span id="build-success-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="build-fail-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>';
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
                            idx = meta.row;
                        href = '/boot/all/job/' + object.job + '/kernel/' +
                            data + '/';
                        return '<a href="' + href + '">' +
                            '<span class="badge alert-success extra-margin">' +
                            '<span id="boot-success-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="boot-fail-count-' + idx +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i></span></span>' +
                            '</a>';
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
                .lengthChange(false)
                .paging(false)
                .info(false)
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
            aggregate: 'kernel',
            job: jobName,
            git_branch: branchName,
            sort: 'created_on',
            sort_order: -1,
            limit: numberRange,
            field: [
                'job', 'kernel', 'created_on', 'git_commit', 'git_url'
            ]
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(
                e.error,
                getDefconfigsFailed, getDefconfigsStats, getBootStatsFail)
            .done(getTrendsData, getDefconfigsDone, getBuildBootCount);
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

            b.replaceById(
                firstResult.operation_id, b.formatNumber(firstCount));
            b.replaceById(
                secondResult.operation_id, b.formatNumber(secondCount));
            b.replaceById(
                thirdResult.operation_id, b.formatNumber(thirdCount));
        } else {
            b.replaceByClass('count-list-badge', '?');
        }
    }

    function getDetailsFailed() {
        b.replaceByClass('count-list-badge', '&infin;');
    }

    function getDetails() {
        var queryString,
            batchQueries = new Array(3),
            data,
            deferred;

        queryString = 'job=' + jobName + '&git_branch=' + branchName +
            '&limit=' + numberRange;

        batchQueries[0] = {
            operation_id: 'builds-count',
            method: 'GET',
            resource: 'count',
            document: 'job',
            query: queryString
        };

        batchQueries[1] = {
            operation_id: 'defconfs-count',
            method: 'GET',
            resource: 'count',
            document: 'build',
            query: queryString
        };

        batchQueries[2] = {
            operation_id: 'boot-reports-count',
            method: 'GET',
            resource: 'count',
            document: 'boot',
            query: queryString
        };

        data = JSON.stringify({
            batch: batchQueries
        });

        deferred = r.post('/_ajax/batch', data);
        $.when(deferred)
            .fail(e.error, getDetailsFailed)
            .done(getDetailsDone);
    }

    $(document).ready(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        if (document.getElementById('number-name') !== null) {
            numberRange = document.getElementById('number-name').value;
        }
        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }
        if (document.getElementById('branch-name') !== null) {
            branchName = document.getElementById('branch-name').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }
        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }

        buildsTable = t(['jobstable', 'table-loading', 'table-div'], true);
        getDetails();
        getDefconfigs();
    });
});
