/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/html',
    'utils/error',
    'utils/request'
], function($, init, html, err, request) {
    'use strict';
    var gTestSuite;

    document.getElementById('li-test').setAttribute('class', 'active');

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
        var queryStr;
        var deferred;

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
    }

    init.hotkeys();
    init.tooltip();
});
