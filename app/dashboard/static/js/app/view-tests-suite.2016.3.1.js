/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test-set'
], function($, init, html, err, request, table, ttestset) {
    'use strict';
    var gTestSuite;
    var gTestSetsTable;

    document.getElementById('li-test').setAttribute('class', 'active');

    function getTestSetsFail() {
        // TODO
    }

    function getTestSetsDone(response) {
        var results;
        var columns;

        function _renderDetails(data, type, object) {
            var href;

            href = '/test/suite/' +
                object.test_suite_name + '/set/' + object.name + '/' +
                data.$oid + '/';
            return ttestset.renderDetails(href, type);
        }

        function _renderTestCasesCount(data, type) {
            if (type === 'sort') {
                return data.length;
            } else if (type === 'display') {
                // TODO
            }
        }

        results = response.result;
        if (results.length > 0) {
            // TODO
            console.log(results);

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
                    data: 'test_case',
                    title: 'Total Test Cases',
                    type: 'num',
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
        } else {
            html.replaceContent(
                document.getElementById('test-sets'),
                html.errorDiv('No test sets available.'));
        }
    }

    function getTestSets() {
        var data;
        var deferred;

        data = {
            test_suite_name: gTestSuite
        };

        deferred = request.get('/_ajax/test/set', data);
        $.when(deferred)
            .done(getTestSetsDone)
            .fail(err.error, getTestSetsFail);
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

    function getCounts() {
        var batchOps;
        var deferred;
        var queryStr;

        batchOps = [];
        queryStr = 'test_suite_name=' + gTestSuite;

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
            .fail(err.error, getCountsFail);
    }

    gTestSuite = document.getElementById('test-suite');
    if (gTestSuite) {
        gTestSuite = gTestSuite.value;

        getCounts();
        getTestSets();
    }

    init.hotkeys();
    init.tooltip();
});
