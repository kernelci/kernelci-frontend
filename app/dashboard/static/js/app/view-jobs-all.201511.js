/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/const',
    'tables/job',
    'utils/date'
], function($, init, e, r, t, html, appconst, jobt) {
    'use strict';
    var gDateRange,
        gJobsTable,
        gPageLen,
        gSearchFilter;

    document.getElementById('li-job').setAttribute('class', 'active');
    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    /**
     * Create the table column title for the boots count.
     * @private
    **/
    function _bootColumnTitle() {
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Successful/Failed boot reports for latest job');
        tooltipNode.appendChild(
            document.createTextNode('Latest Boot Status'));

        return tooltipNode.outerHTML;
    }

    /**
     * Create the table column title for the builds count.
     * @private
    **/
    function _buildColumTitle() {
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Successful/Failed build reports for latest job');
        tooltipNode.appendChild(
            document.createTextNode('Latest Build Status'));

        return tooltipNode.outerHTML;
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var bResult,
            results;

        results = response[0].result;
        if (results.length > 0) {
            results.forEach(function(result) {
                bResult = result.result[0];
                html.replaceContent(
                    document.getElementById(result.operation_id),
                    document.createTextNode(bResult.count));
            });
        }

        // Perform the table search now, after completing all operations.
        gJobsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBatchCount(response) {
        var batchElements,
            batchOps,
            deferred,
            idx,
            jdx,
            job,
            kernel,
            queriesLen,
            resLen,
            results;

        results = response.result;
        resLen = results.length;

        if (resLen > 0) {
            idx = 0;
            jdx = 0;
            batchElements = 4;
            queriesLen = resLen * 4;
            batchOps = new Array(queriesLen);
            job = '';
            kernel = '';

            for (idx; idx < queriesLen; idx += batchElements) {
                jdx = idx;
                job = results[idx / batchElements].job;
                kernel = results[idx / batchElements].kernel;

                // Get successful build count.
                batchOps[idx] = {
                    method: 'GET',
                    operation_id: 'build-success-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed build count.
                batchOps[jdx + 1] = {
                    method: 'GET',
                    operation_id: 'build-fail-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchOps[jdx + 2] = {
                    method: 'GET',
                    operation_id: 'boot-success-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchOps[jdx + 3] = {
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };
            }

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));
        }

        return deferred;
    }

    function getJobsFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getJobsDone(response) {
        var columns,
            results;

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No jobs data available.'));
        } else {
            columns = [
                {
                    data: 'job',
                    title: 'Tree',
                    render: jobt.renderTree
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    className: 'branch-column'
                },
                {
                    data: 'job',
                    title: _buildColumTitle(),
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: jobt.renderTableBuildCount
                },
                {
                    data: 'job',
                    title: _bootColumnTitle(),
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: jobt.renderTableBootCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: jobt.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    className: 'pull-center',
                    render: jobt.renderStatus
                },
                {
                    data: 'job',
                    title: '',
                    searchable: false,
                    orderable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: jobt.renderDetails
                }
            ];

            gJobsTable
                .data(results)
                .columns(columns)
                .order([4, 'desc'])
                .languageLengthMenu('jobs per page')
                .rowURL('/job/%(job)s/')
                .rowURLElements(['job'])
                .noIdURL(true)
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
        var data,
            deferred;

        data = {
            aggregate: 'job',
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            field: [
                'job', 'kernel', 'status', 'created_on', 'git_branch'
            ]
        };

        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDoneMulti);
    }

    init.hotkeys();
    init.tooltip();

    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gJobsTable = t(['jobstable', 'table-loading', 'table-div'], true);
    getJobs();
});
