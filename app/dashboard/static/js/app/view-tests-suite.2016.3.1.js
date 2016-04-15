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
        console.log(response);
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
            resource: 'test_suite',
            distinct: 'build_id',
            operation_id: 'count-builds',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'test_suite',
            distinct: 'boot_id',
            operation_id: 'count-boots',
            query: queryStr
        });

        batchOps.push({
            method: 'GET',
            resource: 'test_suite',
            distinct: 'board',
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
