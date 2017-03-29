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
        var opId;
        var opIdTail;
        var qHead;
        var qStr;
        var results;

        function createBatchOp(result) {
            job = result.job;
            kernel = result.kernel;
            branch = result.git_branch;

            qStr = 'job=';
            qStr += job;
            qStr += '&kernel=';
            qStr += kernel;
            qStr += '&git_branch=';
            qStr += branch;

            opIdTail = job;
            opIdTail += '-';
            opIdTail += branch;

            // Get total build count.
            opId = 'build-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qStr
            });

            // Get successful build count.
            opId = 'build-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get failed build count.
            opId = 'build-fail-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get unknown build count.
            opId = 'build-unknown-count-';
            opId += opIdTail;
            qHead = 'status=UNKNOWN&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get total boot reports count.
            opId = 'boot-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qStr
            });

            // Get successful boot reports count.
            opId = 'boot-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
            });

            // Get failed boot reports count.
            opId = 'boot-fail-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
            });

            // Get unknown boot reports count.
            opId = 'boot-unknown-count-';
            opId += opIdTail;
            qHead = 'status=OFFLINE&status=UNTRIED&status=UNKNOWN&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
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
        function _renderDetails(data, type, object) {
            var href = '/job/';
            href += data;
            href += '/branch/';
            href += object.git_branch;
            href += '/';
            return jobt.renderDetails(href, type);
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderBootCount(data, type, object) {
            var href;
            var nodeId;

            href = '/boot/all/job/';
            href += data;
            href += '/';

            nodeId = data;
            nodeId += '-';
            nodeId += object.git_branch;
            return jobt.renderBootCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        function _renderBuildCount(data, type, object) {
            var href;
            var nodeId;

            href = '/build/';
            href += data;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += object.kernel;

            nodeId = data;
            nodeId += '-';
            nodeId += object.git_branch;
            return jobt.renderBuildCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        function _renderTree(data, type) {
            var href = '/job/';
            href += data;
            href += '/';
            return jobt.renderTree(data, type, href);
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
                    className: 'tree-column',
                    render: _renderTree
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
                    render: _renderBuildCount
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
                .rowURL('/job/%(job)s/branch/%(git_branch)s/')
                .rowURLElements(['job', 'git_branch'])
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
            aggregate: ['job', 'git_branch'],
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
