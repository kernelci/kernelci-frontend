/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/const',
    'utils/table',
    'tables/test'
], function($, init, format, html, error, request, appconst, table, ttest) {
    'use strict';
    var gDateRange;
    var gBoard;
    var gPageLen;
    var gSearchFilter;
    var gJobsTable;
    var gTableCount;
    var gBatchCountMissing;

    document.getElementById('li-test').setAttribute('class', 'active');

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gTableCount = {};
    gBatchCountMissing = {};

    function getCountsFail() {
        html.replaceByClass('count-list-badge', '&infin;');
    }

    function getCountsDone(response) {
        var results;

        results = response.result;
        results.forEach(function(result) {
            html.replaceContent(
                document.getElementById(result.operation_id),
                document.createTextNode(result.result[0].count));
        });
    }

    function getDetails() {
        var batchOps;
        var deferred;
        var data;
        var gBaseSelf = 'board=' + gBoard;

        data = {board: gBoard};
        batchOps = [];
        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'name',
            document: 'test_suite',
            operation_id: 'count-suites',
            query: gBaseSelf
        });
        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'build_id',
            document: 'test_suite',
            operation_id: 'count-builds',
            query: gBaseSelf
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .done(getCountsDone)
            .fail(error.error, getCountsFail);
    }

    function updateOrStageCount(elementId, count) {
        var element;
        element = document.getElementById(elementId);
        // If we do not have the element in the DOM, it means dataTables has
        // yet to add it.
        if (element) {
            html.replaceContent(
                element, document.createTextNode(format.number(count)));

            // Check if the data structure holding the data to update the
            // elements still holds the element.
            if (gBatchCountMissing.hasOwnProperty(elementId)) {
                delete gBatchCountMissing[elementId];
            }
        } else {
            // Store it in a dictionary for later access.
            if (!gBatchCountMissing.hasOwnProperty(elementId)) {
                gBatchCountMissing[elementId] = count;
            }
        }
    }

    /**
     * Function to be bound to the draw event of the table.
     * This is done to update dynamic elements that are not yet available
     * in the DOM due to the derefer rendering of dataTables.
    **/
    function updateCasesCount() {
        Object.keys(gBatchCountMissing).forEach(function(key) {
            updateOrStageCount(key, gBatchCountMissing[key]);
        });
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results;

        function _parseOperationsResult(result) {
            gTableCount[result.operation_id] =
                parseInt(result.result[0].count, 10);
        }

        function _updateTable(opId) {
            updateOrStageCount(opId, gTableCount[opId]);
        }

        results = response.result;
        if (results.length > 0) {
            // Parse all the results and update a global object with
            // the operation IDs and the count found.
            results.forEach(_parseOperationsResult);
            // Invalidate the cells in column #2 before updating the DOM
            // elements. In this way we have the correct 'filter' values in the
            // global object that we can use to provide the search parameters.
            gJobsTable.invalidateColumn(2);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);

            // Bind a new function to the draw event of the table.
            gJobsTable.addDrawEvent(updateCasesCount);
        }
    }

    function getBatchCount(response) {
        var batchOps;
        var deferred;
        var suiteId;
        var suiteTree;
        var suiteBranch;
        var suiteQuery;
        var queryStr;
        var queryData;
        var results;

        function _createOp(result) {
            suiteId = result._id;
            suiteTree = result.job;
            suiteBranch = result.git_branch;
            suiteQuery = 'board=' + gBoard + '&git_branch=' + suiteBranch;
            suiteQuery += '&job=' + suiteTree;

            if (suiteId) {
                queryStr = 'test_suite_id=' + suiteId.$oid;
            }

            batchOps.push({
                method: 'GET',
                operation_id: 'suites-count-' + suiteTree,
                resource: 'count',
                document: 'test_suite',
                query: suiteQuery
            });
            batchOps.push({
                method: 'GET',
                operation_id: 'cases-total-count-' + suiteTree,
                resource: 'count',
                document: 'test_case',
                query: queryStr
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-success-count-' + suiteTree,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=PASS'
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-fail-count-' + suiteTree,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=FAIL'
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-unknown-count-' + suiteTree,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=OFFLINE&status=UNKNOWN'
            });
        }

        function _getTestSuiteDone(resultz) {
            results = resultz.result;

            if (results.length > 0) {
                batchOps = [];
                // Only one result, latest test suite
                _createOp(results[0]);
                deferred = request.post(
                    '/_ajax/batch', JSON.stringify({batch: batchOps}));

                $.when(deferred)
                    .fail(error.error, getBatchCountFail)
                    .done(getBatchCountDone);
            }
        }

        function _getTestSuite(result) {
            // Query parameters to get the latest test suite
            queryData = {
                board: result.board,
                job: result.job,
                git_branch: result.git_branch,
                sort: 'created_on',
                sort_order: '-1',
                limit: '1'
            }

            // Get the latest test suite
            deferred = request.get('/_ajax/test/suite', queryData);
            $.when(deferred)
                .done(_getTestSuiteDone)
                .fail(function() {
                    document.getElementById('suites-count-'+ result.job)
                        .innerHTML ='&infin;';
                    ttest.getCountFail(result.job)
                });
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_getTestSuite);
        }
    }

    function getJobsFail() {
        html.removeElement(document.getElementById('jobs-table-loading'));
        html.replaceContent(
            document.getElementById('jobs-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterCasesCount(tree) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('cases-success-count-' + tree)) {
            if (gTableCount['cases-success-count-' + tree]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('cases-fail-count-' + tree)) {
            if (gTableCount['cases-fail-count-' + tree]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function getJobsDone(response) {
        var columns,
            results;

        // Internal wrapper to provide the href.
        function _renderSuitesCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'suites-',
                    extraClasses: ['suites-count-badge']
                });
            } else if (type === 'sort') {
                if (gTableCount.hasOwnProperty('suites-count-' + data)) {
                    rendered = gTableCount['suites-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        // Internal wrapper to provide the href.
        function _renderCasesCount(data, type) {
            if (type === 'filter') {
                return getFilterCasesCount(data);
            } else {
                return ttest.renderCasesCount(
                    data, type, 'cases-', '/test/board/' + gBoard + '/job/' + data + '/');
            }
        }

        // Internal wrapper to provide the href.
        function _renderTree(data, type) {
            return ttest.renderTree(
                data, type, '/test/board/' + gBoard + '/job/' + data + '/');
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails(
                '/test/board/' + gBoard + '/job/' + data + '/', type);
        }

        /**
         * Create the table column title for the tests set and case count.
        **/
        function _testsColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Failed/Other tests reports');
            tooltipNode.appendChild(
                document.createTextNode('Latest Tests Results'));

            return tooltipNode.outerHTML;
        }

        results = response.result;
        if (results.length > 0) {
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
                    title: 'Total Test Suite',
                    type: 'string',
                    className: 'test-suite-column',
                    render: _renderSuitesCount
                },

                {
                    data: 'job',
                    orderable: false,
                    type: 'string',
                    title: _testsColumnTitle(),
                    className: 'pull-center',
                    render: _renderCasesCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: ttest.renderDate
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gJobsTable
                .data(results)
                .columns(columns)
                .order([3, 'desc'])
                .rowURL('/test/board/' + gBoard + '/job/%(job)s/')
                .rowURLElements(['job'])
                .languageLengthMenu('trees per page')
                .draw();

            gJobsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);

        } else {
            html.removeElement(document.getElementById('jobs-table-loading'));
            html.replaceContent(
                document.getElementById('jobs-table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getJobs() {
        var deferred;

        deferred = request.get(
            '/_ajax/test/suite',
            {
                aggregate: 'job',
                date_range: gDateRange,
                field: [
                    'job', 'git_branch', 'created_on', 'board', 'name'
                ],
                board: gBoard,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(error.error, getJobsFail)
            .done(getJobsDone, getBatchCount);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('board') !== null) {
        gBoard = document.getElementById('board').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gJobsTable = table({
        tableId: 'jobs-table',
        tableDivId: 'jobs-table-div',
        tableLoadingDivId: 'jobs-table-loading'
    });

    getDetails();
    getJobs();

    init.hotkeys();
    init.tooltip();
});
