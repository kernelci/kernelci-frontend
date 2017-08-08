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
    var gSuite;
    var gPageLen;
    var gSearchFilter;
    var gSetsTable;
    var gBoardsTable;
    var gTableCount;
    var gBatchCountMissing;

    document.getElementById('li-test').setAttribute('class', 'active');

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gTableCount = {};
    gBatchCountMissing = {};

    function getDistinctBoardsTableDone(response) {
        var columns,
            results,
            tableResults;

        /**
         * Internally used to remap an array of strings into an array of
         * objects whose key is 'board'.
         *
         * @param {string} element: The element from the array.
         * @return {object} An object with key 'board' and value the passed
         * one.
        **/
        function _remapResults(element) {
            return {board: element};
        }

        // Internal wrapper to provide the href and title.
        function _boardDetails(data, type) {
            return ttest.renderDetails(
                // TODO create the destination page
                '/test/' + gSuite + '/board/' + data + '/', type,
                'View test sets reports');
        }

        results = response.result;
        if (results.length > 0) {
            columns = [
                {
                    data: 'board',
                    title: 'Board'
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _boardDetails
                }
            ];

            // Remap the distinct results into an array of objets.
            tableResults = results.map(_remapResults);

            gBoardsTable
                .rowURL('/test/' + gSuite + '/board/%(board)s/')
                .rowURLElements(['board'])
                .data(tableResults)
                .columns(columns)
                .lengthMenu([5, 10, 25, 50])
                .languageLengthMenu('boards per page')
                .order([0, 'asc'])
                .draw();
            }
    }

    function getDistinctBoardsTableFail() {
            html.removeElement(
                document.getElementById('boards-table-loading'));
            html.replaceContent(
                document.getElementById('boards-table-div'),
                html.errorDiv('No data found.'));
    }

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
        var gBaseSelf = "name=";
        var gBaseOthers = "test_suite_name="

        data = {name: gSuite};
        batchOps = [];
        batchOps.push({
            method: 'GET',
            resource: 'count',
            document: 'test_suite',
            operation_id: 'count-suites',
            query: gBaseSelf + gSuite
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            document: 'test_set',
            operation_id: 'count-sets',
            query: gBaseOthers + gSuite
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            document: 'test_case',
            operation_id: 'count-cases',
            query: gBaseOthers + gSuite
        });
        // TODO remove this info ? not sure it's usefull
        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'build_id',
            document: 'test_suite',
            operation_id: 'count-builds',
            query: gBaseSelf + gSuite
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'board',
            document: 'test_suite',
            operation_id: 'count-boards',
            query: gBaseSelf + gSuite
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .done(getCountsDone)
            .fail(error.error, getCountsFail);

        deferred = request.get('/_ajax/suite/distinct/board', data);

        $.when(deferred)
            .fail(error.error, getDistinctBoardsTableFail)
            .done(getDistinctBoardsTableDone);

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
            gSetsTable.invalidateColumn(2);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);

            // Bind a new function to the draw event of the table.
            gSetsTable.addDrawEvent(updateCasesCount);
        }
    }

    function getBatchCount(response) {
        var batchOps;
        var deferred;
        var set;
        var suiteId;
        var queryStr;
        var results;

        function _createOp(result) {
            set = result.name;
            suiteId = result.test_suite_id;

            if (suiteId) {
                suiteId = '&test_suite_id=' + suiteId.$oid;
            } else {
                // No test_suite_id value, search only in the last X days.
                // TODO add this
                // suiteId = '&date_range=' + gDateRange;
            }

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-total-count-' + set,
                resource: 'count',
                document: 'test_case',
                query: queryStr + suiteId
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-success-count-' + set,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=PASS&' + suiteId
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-fail-count-' + set,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=FAIL&' + suiteId
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-unknown-count-' + set,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=OFFLINE&status=UNKNOWN&' +
                    suiteId
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            queryStr = 'test_suite_name=' + gSuite;
            results.forEach(_createOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBatchCountFail)
                .done(getBatchCountDone);
        }
    }

    function getSetsFail() {
        html.removeElement(document.getElementById('sets-table-loading'));
        html.replaceContent(
            document.getElementById('sets-table-div'),
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

    function getSetsDone(response) {
        var columns,
            results;

        // Internal wrapper to provide the href.
        function _renderCasesCount(data, type) {
            if (type === 'filter') {
                return getFilterCasesCount(data);
            } else {
                return ttest.renderCasesCount(
                    data, type, '/test/' + gSuite + '/set/' + data + '/');
            }
        }

        // Internal wrapper to provide the href.
        function _renderTree(data, type) {
            return ttest.renderTree(
                data, type, '/test/' + gSuite + '/set/' + data + '/');
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails(
                '/test/' + gSuite + '/set/' + data + '/', type);
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
                    data: 'name',
                    title: 'Test set',
                    type: 'string',
                    className: 'tree-column',
                    render: _renderTree
                },
                // TODO add this ? it's not in the DB
/*                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
*/
                {
                    data: 'name',
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
                    data: 'name',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gSetsTable
                .data(results)
                .columns(columns)
                .order([3, 'desc'])
                .rowURL('/test/' + gSuite + '/set/%(name)s/')
                .rowURLElements(['name'])
                .languageLengthMenu('trees per page')
                .draw();

            gSetsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        } else {
            html.removeElement(document.getElementById('sets-table-loading'));
            html.replaceContent(
                document.getElementById('sets-table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getSets() {
        var deferred;

        deferred = request.get(
            '/_ajax/test/set',
            {
                aggregate: 'name',
                // TODO add a date range
                // date_range: gDateRange,
                // TODO add a git branch ?
                field: [
                    'name', 'created_on', 'test_suite_id'
                ],
                test_suite_name: gSuite,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(error.error, getSetsFail)
            .done(getSetsDone, getBatchCount);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('suite') !== null) {
        gSuite = document.getElementById('suite').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gSetsTable = table({
        tableId: 'sets-table',
        tableDivId: 'sets-table-div',
        tableLoadingDivId: 'sets-table-loading'
    });

    gBoardsTable = table({
        tableId: 'boards-table',
        tableDivId: 'boards-table-div',
        tableLoadingDivId: 'boards-table-loading'
    });

    getDetails();
    getSets();

    init.hotkeys();
    init.tooltip();
});
