/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'sprintf',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/tables'
], function($, p, i, b, e, r, t) {
    'use strict';
    var searchFilter = null,
        pageLen = null,
        dateRange = 14,
        jobsTable = null,
        eDiv,
        jobURL,
        rowURLFmt,
        hrefFmt,
        tooltipFmt,
        buildLabel,
        passLabel,
        failLabel,
        unknownLabel,
        nonAvail;

    nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i></span>';
    eDiv = '<div class="pull-center"><h4>%s</h4></div>';
    jobURL = '/job/%s';
    rowURLFmt = '/job/%(job)s/';
    hrefFmt = '<a class="table-link" href="%s">%s</a>';
    tooltipFmt =
        '<span rel="tooltip" data-toggle="tooltip" title="%s">%s</span>';
    buildLabel =
        '<span class="label label-info"><i class="fa fa-cogs"></i></span>';
    passLabel =
        '<span class="label label-success"><i class="fa fa-check"></i></span>';
    failLabel = '<span class="label label-danger">' +
        '<i class="fa fa-exclamation-triangle"></i></span>';
    unknownLabel = '<span class="label label-warning">' +
        '<i class="fa fa-question"></i></span>';

    function getBatchCountFail() {
        b.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results = response[0].result,
            len = results.length,
            bResult,
            idx = 0;

        if (len > 0) {
            for (idx; idx < len; idx = idx + 1) {
                bResult = results[idx].result[0];
                b.replaceById(results[idx].operation_id, bResult.count);
            }
        }

        // Perform the table search now, after completing all operations.
        jobsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBatchCount(response) {
        var results = response.result,
            len = results.length,
            idx = 0,
            j = 0,
            batchElements = 4,
            queriesLen = len * 4,
            batchOps = new Array(queriesLen),
            job = '',
            kernel = '',
            deferred = null,
            data;

        if (len > 0) {
            for (idx; idx < queriesLen; idx += batchElements) {
                j = idx;
                job = results[idx / batchElements].job;
                kernel = results[idx / batchElements].kernel;

                // Get successful build count.
                batchOps[idx] = {
                    method: 'GET',
                    operation_id: 'defconf-success-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed build count.
                batchOps[j + 1] = {
                    method: 'GET',
                    operation_id: 'defconf-fail-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchOps[j + 2] = {
                    method: 'GET',
                    operation_id: 'boot-success-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchOps[j + 3] = {
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };
            }

            data = JSON.stringify({batch: batchOps});
            deferred = r.post('/_ajax/batch', data);
        }

        return deferred;
    }

    function getJobsFail() {
        b.replaceById('table-loading', p.sprintf(eDiv, 'Error loading data.'));
    }

    function getJobsDone(response) {
        var results = response.result,
            len = response.count,
            tableDiv = null,
            columns;

        if (len === 0) {
            tableDiv = b.checkElement('table-div');
            b.replaceById(
                tableDiv[0], p.sprintf(eDiv, 'No jobs data available.'));
        } else {
            columns = [
                {
                    'data': 'job',
                    'title': 'Tree &dash; Branch',
                    'type': 'string',
                    'render': function(data, type, object) {
                        var display,
                            hrefData,
                            branch = object.git_branch;

                        hrefData = data;
                        if (branch !== null && branch !== undefined) {
                            hrefData = data + '&nbsp;&dash;&nbsp;<small>' +
                                branch + '</small>';
                        }
                        display = p.sprintf(
                            hrefFmt, p.sprintf(jobURL, data), hrefData);

                        return display;
                    }
                },
                {
                    'data': 'job',
                    'title': p.sprintf(
                        tooltipFmt,
                        'Successful/Failed defconfigs built for latest job',
                        'Latest Build Status'),
                    'type': 'string',
                    'searchable': false,
                    'orderable': false,
                    'className': 'pull-center',
                    'render': function(data) {
                        return '<a class="clean-link" href="/job/' + data +
                            '"><span class="badge alert-success ' +
                            'extra-margin">' +
                            '<span id="defconf-success-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="defconf-fail-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span></a>';
                    }
                },
                {
                    'data': 'job',
                    'title': p.sprintf(
                        tooltipFmt,
                        'Successful/Failed boot reports for latest job',
                        'Latest Boot Status'),
                    'type': 'string',
                    'searchable': false,
                    'orderable': false,
                    'className': 'pull-center',
                    'render': function(data) {
                        return '<a class="clean-link" href="/boot/all/job/' +
                            data + '"><span class="badge alert-success ' +
                            'extra-margin">' +
                            '<span id="boot-success-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="boot-fail-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span></a>';
                    }
                },
                {
                    'data': 'created_on',
                    'title': 'Date',
                    'type': 'date',
                    'className': 'pull-center',
                    'render': function(data) {
                        var created;
                        if (data === null) {
                            created = nonAvail;
                        } else {
                            created = (new Date(data.$date)).getCustomISODate();
                        }
                        return created;
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
                            case 'BUILD':
                                displ = p.sprintf(
                                    tooltipFmt, 'Building', buildLabel);
                                break;
                            case 'PASS':
                                displ = p.sprintf(
                                    tooltipFmt, 'Build complete', passLabel);
                                break;
                            case 'FAIL':
                                displ = p.sprintf(
                                    tooltipFmt, 'Build failed', failLabel);
                                break;
                            default:
                                displ = p.sprintf(
                                    tooltipFmt, 'Unknown status', unknownLabel);
                                break;
                        }
                        return displ;
                    }
                },
                {
                    'data': 'job',
                    'title': '',
                    'searchable': false,
                    'orderable': false,
                    'width': '30px',
                    'className': 'pull-center',
                    'render': function(data) {
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for&nbsp;' + data + '">' +
                            '<a href="/job/' + data + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ];

            jobsTable
                .tableData(results)
                .columns(columns)
                .order([3, 'desc'])
                .menu('jobs per page')
                .rowURL(rowURLFmt)
                .rowURLElements(['job'])
                .noIDUrl(true)
                .draw();
        }
    }

    // A deferred version of getJobsDone.
    function getJobsDoneD(response) {
        var deferred;
        deferred = $.Deferred();
        deferred.resolve(getJobsDone(response));
        return deferred.promise();
    }

    function getJobsDoneMulti(response) {
        $.when(getBatchCount(response), getJobsDoneD(response))
            .fail(e.error, getBatchCountFail)
            .done(getBatchCountDone);
    }

    function getJobs() {
        var deferred,
            data;

        data = {
            'aggregate': 'job',
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': [
                'job', 'kernel', 'status', 'created_on', 'git_branch'
            ]
        };

        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDoneMulti);
    }

    $(document).ready(function() {
        // Setup and perform base operations.
        i();

        document.getElementById('li-job').setAttribute('class', 'active');

        if (document.getElementById('search-filter') !== null) {
            searchFilter = document.getElementById('search-filter').value;
        }
        if (document.getElementById('page-len') !== null) {
            pageLen = document.getElementById('page-len').value;
        }
        if (document.getElementById('date-range') !== null) {
            dateRange = document.getElementById('date-range').value;
        }

        jobsTable = t(['jobstable', 'table-loading', 'table-div'], true);
        getJobs();
    });
});
