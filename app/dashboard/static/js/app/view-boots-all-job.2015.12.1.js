/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/format',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/table',
    'utils/html',
    'tables/boot',
    'utils/const'
], function($, format, e, init, r, table, html, boot, appconst) {
    'use strict';
    var gBootsTable,
        gJobName,
        gNumberRange,
        gPageLen,
        gSearchFilter,
        gTableCount;

    document.getElementById('li-boot').setAttribute('class', 'active');
    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    gNumberRange = appconst.MAX_NUMBER_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gTableCount = {};

    function getDetailsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boot-reports-count'), '&infin;');
        html.replaceContentHTML(
            document.getElementById('boot-boards-count'), '&infin;');
    }

    function getDetailsCountDone(response) {
        var boardsCount,
            reportsCount,
            results;

        results = response.result;
        reportsCount = 0;
        boardsCount = 0;

        if (results.length) {
            if (results[0].operation_id === 'boot-reports-count') {
                reportsCount = parseInt(results[0].result[0].count, 10);
                boardsCount = parseInt(results[1].result.length, 10);
            } else {
                reportsCount = parseInt(results[1].result[0].count, 10);
                boardsCount = parseInt(results[0].result.length, 10);
            }
        }

        html.replaceContent(
            document.getElementById('boot-reports-count'),
            document.createTextNode(format.number(reportsCount)));
        html.replaceContent(
            document.getElementById('boot-boards-count'),
            document.createTextNode(format.number(boardsCount)));
    }

    function getDetailsCount() {
        var batchQueries,
            deferred;

        batchQueries = [];
        batchQueries.push({
            method: 'GET',
            operation_id: 'boot-reports-count',
            resource: 'count',
            document: 'boot',
            query: 'job=' + gJobName
        });

        batchQueries.push({
            method: 'GET',
            operation_id: 'boot-boards-count',
            resource: 'boot',
            query: 'job=' + gJobName + '&aggregate=board&field=board'
        });

        deferred = r.post(
            '/_ajax/batch', JSON.stringify({batch: batchQueries}));
        $.when(deferred)
            .fail(e.error, getDetailsCountFail)
            .done(getDetailsCountDone);
    }

    function getBootsCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        function _parseOperationResult(result) {
            gTableCount[result.operation_id] =
                parseInt(result.result[0].count, 10);
        }

        function _updateTable(opId) {
            html.replaceContent(
                document.getElementById(opId),
                document.createTextNode(format.number(gTableCount[opId])));
        }

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('count-badge', '&#63;');
        } else {
            // Parse all the results and update a global object with
            // the operation IDs and the count found.
            results.forEach(_parseOperationResult);
            // Invalidate the cells in column #1 before updating the DOM
            // elements. In this way we have the correct 'sort' values in the
            // global object that we can use to provide the sort parameters.
            gBootsTable.invalidateColumn(1);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);
        }
        // Re-enable the search here.
        gBootsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBootsCount(response) {
        var batchOps,
            deferred,
            kernel,
            queryStr,
            results;

        function _createOp(result) {
            kernel = result.kernel;
            queryStr = 'job=' + gJobName + '&kernel=' + kernel;

            // Get the total count.
            batchOps.push({
                method: 'GET',
                operation_id: 'total-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: queryStr
            });

            // Get the success count.
            batchOps.push({
                method: 'GET',
                operation_id: 'success-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=PASS&' + queryStr
            });

            // Get the fail count.
            batchOps.push({
                method: 'GET',
                operation_id: 'fail-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=FAIL&' + queryStr
            });

            // Get the other count.
            batchOps.push({
                method: 'GET',
                operation_id: 'unknown-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=OFFLINE&status=UNKNOWN&' + queryStr
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(_createOp);

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));
            $.when(deferred)
                .fail(e.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading board data.'));
    }

    function getSortCount(key) {
        var sortValue;

        sortValue = null;
        if (gTableCount.hasOwnProperty(key)) {
            sortValue = gTableCount[key];
        }

        return sortValue;
    }

    function getBootsDone(response) {
        var columns,
            results,
            rowURLFmt;

        /**
         * Wrapper to provide the sort value.
        **/
        function _countTotal(data, type) {
            if (type === 'sort') {
                return getSortCount('total-count-' + data);
            } else {
                return boot.countTotal(data, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countSuccessful(data, type) {
            if (type === 'sort') {
                return getSortCount('success-count-' + data);
            } else {
                return boot.countSuccess(data, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countFailed(data, type) {
            if (type === 'sort') {
                return getSortCount('fail-count-' + data);
            } else {
                return boot.countFail(data, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countUnknown(data, type) {
            if (type === 'sort') {
                return getSortCount('unknown-count-' + data);
            } else {
                return boot.countUnknown(data, type);
            }
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No board data found'));
        } else {
            rowURLFmt = '/boot/all/job/%(job)s/kernel/%(kernel)s/';
            columns = [
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string'
                },
                {
                    data: 'kernel',
                    title: 'Total',
                    type: 'number',
                    className: 'pull-center',
                    render: _countTotal
                },
                {
                    data: 'kernel',
                    title: 'Successful',
                    type: 'number',
                    className: 'pull-center',
                    render: _countSuccessful
                },
                {
                    data: 'kernel',
                    title: 'Failed',
                    type: 'number',
                    className: 'pull-center',
                    render: _countFailed
                },
                {
                    data: 'kernel',
                    title: 'Other',
                    type: 'number',
                    className: 'pull-center',
                    render: _countUnknown
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: boot.renderDate
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: boot.renderTableDetailJob
                }
            ];

            gBootsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['job', 'kernel'])
                .noIdURL(true)
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                aggregate: 'kernel',
                job: gJobName,
                sort: 'created_on',
                sort_order: -1,
                limit: gNumberRange,
                field: ['job', 'kernel', 'created_on']
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
    }

    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gBootsTable = table({
        tableDivId: 'table-div',
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading'
    });
    getDetailsCount();
    getBoots();
});
