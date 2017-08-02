/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test-set'
], function($, init, format, html, error, request, table, ttestset) {
    'use strict';
    var gTestSuite;
    var gTestSuiteID;
    var gTestSetsTable;
    var gTestCasesTable;
    var gBatchOpBase;
    var gBatchCountMissing;
    var gCasesCount;
    var gDrawEventBound;

    document.getElementById('li-test').setAttribute('class', 'active');

    gBatchOpBase = 'test_set_id=';
    gBatchCountMissing = {};
    gCasesCount = {};
    // Used to check if the table draw event function has already been bound.
    // In order not to bind it multiple times.
    gDrawEventBound = false;

    function updateOrStageCount(opId, count) {
        var element;

        console.log('updateOrStageCount: opId: %o, count: %o', opId, count);

        element = document.getElementById(opId);
        // If we do not have the element in the DOM, it means dataTables has
        // yet to add it.
        if (element) {
            html.replaceContent(
                element, document.createTextNode(format.number(count)));

            // Check if the data structure holding the data to update the
            // elements still holds the element.
            if (gBatchCountMissing.hasOwnProperty(opId)) {
                delete gBatchCountMissing[opId];
            }
        } else {
            // Store it in a dictionary for later access.
            if (!gBatchCountMissing.hasOwnProperty(opId)) {
                gBatchCountMissing[opId] = count;
            }
        }
    }

/**
 *  This block is related to getTestCases
**/
    // TODO: implement the cases count results
    function getCasesResultsCount() {
        console.log('getCasesResultsCount: not implemented yet');
        html.replaceByClassHTML('cases-count-results-badge', '&infin;');
    }

    function getTestCasesFail() {
        // TODO
        console.error('getTestCasesFail: nothing to print');
    }

    function getTestCasesDone(response) {
        var results;
        var columns;

        // TODO: fix this
        function _renderDetails(data, type, object) {
            var href;

            href = '/test/suite/' +
                object.test_suite_name + '/case/' + object.name + '/' +
                data.$oid + '/';
            return ttestset.renderDetails(href, type);
        }

        // TODO: Print success / fail Test Cases using filter
        function _renderTestCasesCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttestset.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'cases-',
                    extraClasses: ['cases-count-results-badge']
                });
            } else {
                rendered = NaN;
            }

            return rendered;

        }

        results = response.result;
        if (results.length > 0) {
            gTestCasesTable = table({
                tableId: 'test-cases-table',
                tableDivId: 'test-cases-table-div'
            });

            columns = [
                {
                    data: 'name',
                    title: 'Name',
                    type: 'string'
                },
                // TODO: update this view
                {
                    data: 'name',
                    title: 'Latest results',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderTestCasesCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: ttestset.renderDate
                },
                {
                    data: '_id',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gTestCasesTable
                .data(results)
                .columns(columns)
                .lengthMenu([10, 25, 50, 75, 100])
                .order([2, 'asc'])
                .languageLengthMenu('Test cases per page')
                .draw();

            setTimeout(getCasesResultsCount.bind(null, results), 25);
        } else {
            html.replaceContent(
                document.getElementById('test-cases'),
                html.errorDiv('No test cases available.'));
        }
    }

    function getTestCases(response) {
        var data;
        var deferred;

        data = {
            test_suite_id: gTestSuiteID
        };

        deferred = request.get('/_ajax/test/case', data);
        $.when(deferred)
            .fail(error.error, getTestCasesFail)
            .done(getTestCasesDone);
    }

/**
 *  End of block
**/

/**
 *  This block is related to getTestSets
**/

    /**
     * Function to be bound to the draw event of the table.
     * This is done to update dynamic elements that are not yet available
     * in the DOM due to the derefer rendering of dataTables.
    **/
    function updateSetsTable() {
        var key;

        if (Object.keys(gBatchCountMissing).length > 0) {
            for (key in gBatchCountMissing) {
                if (gBatchCountMissing.hasOwnProperty(key)) {
                    updateOrStageCount(key, gBatchCountMissing[key]);
                }
            }
        }
    }

    function getCasesCountFail() {
        console.error('getCasesCountFail: nothing to print');
        html.replaceByClassHTML('cases-count-badge', '&infin;');
    }

    function getCasesCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateCasesCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gCasesCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateCasesCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestSetsTable.addDrawEvent(updateSetsTable);
            }
        } else {
            html.replaceByClassTxt('cases-count-badge', '?');
        }
    }

    function getCasesCount(response) {
        var batchOps;
        var deferred;

        console.log('getCasesCountDone: response: %o', response);
        function createBatchOp(value) {
            var set = value.name;
            var query = gBatchOpBase;
            query += value._id.$oid;
            console.log('createBatchOp: query: %s', query);
            batchOps.push({
                method: 'GET',
                operation_id: 'cases-count-' + set,
                resource: 'count',
                document: 'test_case',
                query: query
            });
        }

        if (response.length > 0) {
            console.log('Creating batch ops');

            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getCasesCountFail)
                .done(getCasesCountDone);
        }
    }

    function getTestSetsFail() {
        // TODO
        console.error('getTestSetsFail: nothing to print');
    }

    function getTestSetsDone(response) {
        var results;
        var columns;

        // TODO: fix this
        function _renderDetails(data, type, object) {
            var href;

            href = '/test/suite/' +
                object.test_suite_name + '/set/' + object.name + '/' +
                data.$oid + '/';
            return ttestset.renderDetails(href, type);
        }

        // TODO: Print success / fail Test Cases using filter
        function _renderTestCasesCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttestset.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'cases-',
                    extraClasses: ['cases-count-badge']
                });
            } else {
                rendered = NaN;
            }

            return rendered;

        }

        results = response.result;
        if (results.length > 0) {
            gTestSetsTable = table({
                tableId: 'test-sets-table',
                tableDivId: 'test-sets-table-div'
            });

            columns = [
                {
                    data: 'name',
                    title: 'Name',
                    type: 'string'
                },
                {
                    data: 'name',
                    title: 'Total Test Cases',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderTestCasesCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: ttestset.renderDate
                },
                {
                    data: '_id',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gTestSetsTable
                .data(results)
                .columns(columns)
                .lengthMenu([10, 25, 50, 75, 100])
                .order([2, 'asc'])
                .languageLengthMenu('Test sets per page')
                .draw();

            setTimeout(getCasesCount.bind(null, results), 25);
        } else {
            html.replaceContent(
                document.getElementById('test-sets'),
                html.errorDiv('No test sets available.'));
        }
    }

    function getTestSets(response) {
        var data;
        var deferred;

        data = {
            test_suite_id: gTestSuiteID
        };

        deferred = request.get('/_ajax/test/set', data);
        $.when(deferred)
            .fail(error.error, getTestSetsFail)
            .done(getTestSetsDone);
    }
/**
 *  End of block
**/

/**
 * This block is related to getCounts
**/
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

    // TODO: It seems this is printing to much information, and some of them are random (verify)
    function getCounts() {
        var batchOps;
        var deferred;
        var queryStr;

        console.log('Test suite ID: %o', gTestSuiteID);

        batchOps = [];
        queryStr = 'test_suite_id=' + gTestSuiteID;

        batchOps.push({
            method: 'GET',
            resource: 'count',
            document: 'test_set',
            operation_id: 'count-test-sets',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            document: 'test_case',
            operation_id: 'count-test-cases',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'build_id',
            document: 'test_suite',
            operation_id: 'count-builds',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'boot_id',
            document: 'test_suite',
            operation_id: 'count-boots',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'count',
            distinct: 'board',
            document: 'test_suite',
            operation_id: 'count-boards',
            query: queryStr
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .done(getCountsDone)
            .fail(error.error, getCountsFail);
    }
/**
 *  End of block
**/


    function getTestSuiteParse(response) {
        gTestSuiteID = response.result[0]._id.$oid;
        // TODO: use timeouts for function calls: setTimeout
        // Update the "count-*" IDs
        getCounts();
        // Update the test-set ID
        getTestSets(response);
        // Update the test-case ID
        getTestCases(response);
    }

    function getTestSuiteFail() {
        // TODO
        console.error('getTestSuiteFail: nothing to print');
    }

    /**
     * Get the test suite data from the test suite name
     *
    **/
    function getTestSuiteInfo() {
        var data;
        var deferred;

        data = {
            name: gTestSuite
        };

        deferred = request.get('/_ajax/test/suite', data);
        $.when(deferred)
            .done(getTestSuiteParse)
            .fail(error.error, getTestSuiteFail);
    }

    gTestSuite = document.getElementById('test-suite');
    if (gTestSuite) {
        gTestSuite = gTestSuite.value;
        getTestSuiteInfo();
    }

    init.hotkeys();
    init.tooltip();
});
