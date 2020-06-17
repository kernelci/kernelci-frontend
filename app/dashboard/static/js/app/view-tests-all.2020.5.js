/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2020 Collabora Limited
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * Copyright (c) 2017 BayLibre, SAS.
 * Author: Loys Ollivier <lollivier@baylibre.com>
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/test',
    'tables/job',
    'URI'
], function(
        $,
        init, format, error, request, table, html, appconst, ttest, jobt, URI) {
    'use strict';

    var gDateRange;
    var gSearchFilter;
    var gPageLen;
    var gTestsTable;
    var gTestCount = {};
    var gDrawEventBound = false;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;

    function updateOrStageCount(opId, count) {
        var element;

        element = document.getElementById(opId);
        // If we do not have the element in the DOM, it means dataTables has
        // yet to add it.
        if (element) {
            html.replaceContent(
                element, document.createTextNode(format.number(count)));

            // Check if the data structure holding the data to update the
            // elements still holds the element.
            if (gTestCount.hasOwnProperty(opId)) {
                delete gTestCount[opId];
            }
        } else {
            // Store it in a dictionary for later access.
            if (!gTestCount.hasOwnProperty(opId)) {
                gTestCount[opId] = count;
            }
        }
    }

    function updateTestTable(){
        var key;

        if (Object.keys(gTestCount).length > 0) {
            for (key in gTestCount) {
                if (gTestCount.hasOwnProperty(key)) {
                    updateOrStageCount(key, gTestCount[key]);
                }
            }
        }
    }

    function getBatchTestCountDone(results) {
        var batchData;
        batchData = results[0].result;

        function parseBatchData(data) {
            updateOrStageCount(
                data.operation_id, parseInt(data.result[0].count, 10));
        }

        if (batchData.length > 0) {
            batchData.forEach(parseBatchData);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestsTable.addDrawEvent(updateTestTable);
            }
        }
    }

    function getBatchTestCountFailed() {
        console.log("getBatchTestCountFailed()");
    }

    function getBatchTestCount(results) {
        var batchOps;
        var deferred;
        function createBatchOp(result) {
            var qStr;
            var qHead;
            var opId;
            var opIdTail = result._id.$oid;

            qStr = URI.buildQuery({
                'kernel': result.kernel,
                'plan': result.name,
            });

            // Get total tests count.
            opId = 'test-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qStr,
            });

            // Get successful tests count.
            opId = 'test-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead,
            });

            // Get regressions count.
            opId = 'test-fail-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });

            // Get unknown test reports count.
            opId = 'test-unknown-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&status=SKIP&regression_id=null&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead,
            });
        }

        if (results.length > 0) {
            batchOps = []
            results.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));
        }

        return deferred;
    }

    function getTestTableDone(response) {
        var columns;

        function _renderTree(data, type) {
            return ttest.renderTree(
                data, type, '/job/' + data + '/');
        }

        function _renderKernel(data, type, object) {
            var href = '/test/job/';
            href += object.job;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += data;
            href += '/';
            return jobt.renderKernel(data, type, href);
        }

        function _renderBranch(data, type, object) {
            var href;

            href = '/job/';
            href += object.job;
            href += '/branch/';
            href += object.git_branch;
            href += '/';

            return jobt.renderKernel(data, type, href);
        }

        /**
        * Create the table column title for the tests count.
        **/
        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regressions/Other test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
         **/
        function _renderTestCount(data, type, object) {
            var href;
            var nodeId;

            href = '/test/job/';
            href += object.job;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += object.kernel;
            href += '/plan/';
            href += object.name;
            href += '/';

            nodeId = data;
            return ttest.renderTestCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        if (response.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
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
                    className: 'branch-column',
                    render: _renderBranch
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: _renderKernel
                },
                {
                    data: 'name',
                    title: 'Test Plan',
                    type: 'string',
                    className: 'plan-column',
                },
                {
                    data: '_id.$oid',
                    title: _testColumnTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'test-count pull-center',
                    render: _renderTestCount
                },
                {
                    data: 'created_on',
                    type: 'datetime',
                    title: 'Date',
                    className: 'date-column',
                    render: ttest.renderDate
                }
            ];

            gTestsTable
                .data(response)
                .columns(columns)
                .order([5, 'desc'])
                .languageLengthMenu('Tests per page')
                .rowURL('/test/job/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/plan/%(name)s/')
                .rowURLElements(['job', 'git_branch', 'kernel', 'name'])
                .draw();
        }
    }

    function enableSearch() {
        gTestsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getTestTableDoneD(response) {
        var deferred;

        deferred = $.Deferred();
        deferred.resolve(getTestTableDone(response));

        return deferred.promise();
    }

    function getTestsDone(response){

        $.when(getBatchTestCount(response), getTestTableDoneD(response))
        .fail(error.error, getBatchTestCountFailed)
        .done(getBatchTestCountDone);
    }

    function getTestsParse(response) {
        var results;
        // Internal filter function to check valid test values.
        function _isValidBoard(data) {
            if (data && data !== null && data !== undefined) {
                return true;
            }
            return false;
        }
        // Convert a value into an object.
        function _toObject(data) {
            return  data.result;
        }

        results = response.result;
        if (results) {
            results = results.filter(_isValidBoard);
            results = results.map(_toObject);
        }
        setTimeout(getTestsDone.bind(null, results), 25);
        setTimeout(enableSearch, 25);
    }

    function getTestsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getTests() {
        var deferred;
        var reqData;

        reqData = {
            aggregate: ['name', 'kernel'],
            parent_id: 'null',
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            limit: appconst.MAX_QUERY_LIMIT,
            distinct: ['board', 'kernel'],
        }

        deferred = request.get('/_ajax/test/group', reqData);
        $.when(deferred)
            .fail(error.error, getTestsFail)
            .done(getTestsParse);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gTestsTable = table({
        tableId: 'tests-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getTests, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
