/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
    'utils/request',
    'utils/error',
    'utils/const',
    'utils/html',
    'tables/soc',
    'utils/table'
], function($, init, format, r, e, appconst, html, tsoc, table) {
    'use strict';
    var gBatchCountMissing,
        gBoardsTable,
        gDateRange,
        gJobsTable,
        gPageLen,
        gSearchFilter,
        gSoc,
        gTableCount;

    document.getElementById('li-soc').setAttribute('class', 'active');

    gBatchCountMissing = {};
    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gTableCount = {};

    function getDistinctBoardsTable(response) {
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
            return tsoc.renderDetails(
                '/boot/' + data + '/', type, 'View boot reports');
        }

        results = response.result;
        if (results.length > 0) {
            columns = [
                {
                    data: 'board',
                    title: 'Device type'
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
                .rowURL('/boot/%(board)s/')
                .rowURLElements(['board'])
                .data(tableResults)
                .columns(columns)
                .lengthMenu([5, 10, 25, 50])
                .languageLengthMenu('device types per page')
                .order([0, 'asc'])
                .draw();

        } else {
            html.removeElement(
                document.getElementById('boards-table-loading'));
            html.replaceContent(
                document.getElementById('boards-table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getDistinctBoardsFail() {
        html.replaceContentHTML(
            document.getElementById('boards-count'), '&infin;');
    }

    function getDistinctBoardsCount(response) {
        html.replaceContent(
            document.getElementById('boards-count'),
            document.createTextNode(format.number(response.result.length)));
    }

    function getTestCountFail() {
        html.replaceContentHTML(
            document.getElementById('tests-count'), '&infin;');
    }

    function getTestCountDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            html.replaceContent(
                document.getElementById('tests-count'),
                document.createTextNode(
                    format.number(parseInt(results[0].count, 10))));
        } else {
            html.replaceConten(
                document.getElementById('tests-count'),
                document.createTextNode('?'));
        }
    }

    function getDetails() {
        var data,
            deferred;

        data = {mach: gSoc};

        deferred = r.get('/_ajax/count/test_case', data);

        $.when(deferred)
            .fail(e.error, getTestCountFail)
            .done(getTestCountDone);

        deferred = r.get('/_ajax/test/distinct/device_type/', data);

        $.when(deferred)
            .fail(e.error, getDistinctBoardsFail)
            .done(getDistinctBoardsCount, getDistinctBoardsTable);
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
    function updateTestCount() {
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
            gJobsTable.addDrawEvent(updateTestCount);
        }
    }

    function getBatchCount(response) {
        var batchOps,
            deferred,
            queryStr,
            results;

        function _createOp(result) {
            var job = result.job;
            var filter = '&job=' + job + '&kernel=' + result.kernel;

            batchOps.push({
                method: 'GET',
                operation_id: 'test-total-count-' + job,
                resource: 'count',
                document: 'test_case',
                query: queryStr + filter
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'test-success-count-' + job,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=PASS' + filter
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'test-fail-count-' + job,
                resource: 'count',
                document: 'test_regression',
                query: queryStr + filter
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'test-unknown-count-' + job,
                resource: 'count',
                document: 'test_case',
                query: queryStr +
                    '&status=FAIL&status=SKIP&regression_id=null' + filter
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            queryStr = 'mach=' + gSoc;
            results.forEach(_createOp);

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(e.error, getBatchCountFail)
                .done(getBatchCountDone);
        }
    }

    function getJobsFail() {
        html.removeElement(document.getElementById('jobs-table-loading'));
        html.replaceContent(
            document.getElementById('jobs-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterTestCount(tree) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('test-success-count-' + tree)) {
            if (gTableCount['test-success-count-' + tree]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('test-fail-count-' + tree)) {
            if (gTableCount['test-fail-count-' + tree]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function getJobsDone(response) {
        var columns,
            results;

        // Internal wrapper to provide the href.
        function _renderTestCount(data, type) {
            if (type === 'filter') {
                return getFilterTestCount(data);
            } else {
                return tsoc.renderTestCount(
                    data, type, '/soc/' + gSoc + '/job/' + data + '/');
            }
        }

        // Internal wrapper to provide the href.
        function _renderTree(data, type) {
            return tsoc.renderTree(
                data, type, '/soc/' + gSoc + '/job/' + data + '/');
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return tsoc.renderDetails(
                '/soc/' + gSoc + '/job/' + data + '/', type);
        }

        /**
         * Create the table column title for the test count.
        **/
        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regressions/Other results');
            tooltipNode.appendChild(
                document.createTextNode('Latest Test Results'));

            return tooltipNode.outerHTML;
        }

        results = response.result;
        console.log("results:")
        console.log(results)
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
                    orderable: false,
                    type: 'string',
                    title: _testColumnTitle(),
                    className: 'pull-center',
                    render: _renderTestCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: tsoc.renderDate
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
                .rowURL('/soc/%(mach)s/job/%(job)s/')
                .rowURLElements(['mach', 'job'])
                .languageLengthMenu('branches per page')
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

        deferred = r.get(
            '/_ajax/test/case',
            {
                aggregate: 'job',
                date_range: gDateRange,
                field: [
                    'job', 'git_branch', 'created_on', 'mach', 'kernel',
                ],
                mach: gSoc,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDone, getBatchCount);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('soc') !== null) {
        gSoc = document.getElementById('soc').value;
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

    gBoardsTable = table({
        tableId: 'boards-table',
        tableDivId: 'boards-table-div',
        tableLoadingDivId: 'boards-table-loading'
    });

    getDetails();
    getJobs();

    init.hotkeys();
    init.tooltip();
});
