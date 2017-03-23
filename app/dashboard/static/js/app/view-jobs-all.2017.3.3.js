/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/job',
    'utils/date'
], function($, init, e, r, table, html, appconst, jobt) {
    'use strict';
    var gDateRange;
    var gJobsTable;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results;

        function parseBatchData(data) {
            html.replaceContent(
                document.getElementById(data.operation_id),
                document.createTextNode(data.result[0].count));
        }

        results = response[0].result;
        if (results.length > 0) {
            results.forEach(parseBatchData);
        }

        // Perform the table search now, after completing all operations.
        gJobsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBatchCount(response) {
        var batchOps;
        var branch;
        var deferred;
        var job;
        var kernel;
        var queryStr;
        var results;

        function createBatchOp(result) {
            job = result.job;
            kernel = result.kernel;
            branch = result.git_branch;

            queryStr = 'job=';
            queryStr += job;
            queryStr += '&kernel=';
            queryStr += kernel;
            queryStr += '&git_branch=';
            queryStr += branch;

            // Get total build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-total-count-' + job,
                resource: 'count',
                document: 'build',
                query: queryStr
            });

            // Get successful build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-success-count-' + job,
                resource: 'count',
                document: 'build',
                query: 'status=PASS&' + queryStr
            });

            // Get failed build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-fail-count-' + job,
                resource: 'count',
                document: 'build',
                query: 'status=FAIL&' + queryStr
            });

            // Get unknown build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-unknown-count-' + job,
                resource: 'count',
                document: 'build',
                query: 'status=UNKNOWN&' + queryStr
            });

            // Get total boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-total-count-' + job,
                resource: 'count',
                document: 'boot',
                query: queryStr
            });

            // Get successful boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-success-count-' + job,
                resource: 'count',
                document: 'boot',
                query: 'status=PASS&' + queryStr
            });

            // Get failed boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-fail-count-' + job,
                resource: 'count',
                document: 'boot',
                query: 'status=FAIL&' + queryStr
            });

            // Get unknown boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-unknown-count-' + job,
                resource: 'count',
                document: 'boot',
                query: 'status=OFFLINE&status=UNTRIED&status=UNKNOWN&' +
                    queryStr
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(createBatchOp);

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
        var columns;
        var results;

        /**
         * Create the table column title for the builds count.
        **/
        function _buildColumTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Total/Successful/Failed/Unknown build reports for latest job');
            tooltipNode.appendChild(
                document.createTextNode('Latest Build Status'));

            return tooltipNode.outerHTML;
        }

        /**
         * Create the table column title for the boots count.
        **/
        function _bootColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Total/Successful/Failed/Other boot reports for latest job');
            tooltipNode.appendChild(
                document.createTextNode('Latest Boot Status'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type) {
            var href = '/job/';
            href += data;
            href += '/';
            return jobt.renderDetails(href, type);
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderBootCount(data, type) {
            var href = '/boot/all/job/';
            href += data;
            href += '/';
            return jobt.renderTableBootCount(data, type, href);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No jobs data available.'));
        } else {
            columns = [
                {
                    data: 'job',
                    title: 'Tree',
                    type: 'string',
                    render: jobt.renderTree
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'job',
                    title: _buildColumTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: jobt.renderTableBuildCount
                },
                {
                    data: 'job',
                    title: _bootColumnTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderBootCount
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
                    type: 'string',
                    className: 'pull-center',
                    render: jobt.renderStatus
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gJobsTable
                .data(results)
                .columns(columns)
                .order([4, 'desc'])
                .languageLengthMenu('jobs per page')
                .rowURL('/job/%(job)s/')
                .rowURLElements(['job'])
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
        var data;
        var deferred;

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

    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gJobsTable = table({
        tableId: 'jobstable',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getJobs, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
