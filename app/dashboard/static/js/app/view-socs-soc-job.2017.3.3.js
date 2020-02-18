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
    'utils/html',
    'utils/table',
    'utils/request',
    'utils/error',
    'tables/soc'
], function($, init, format, html, table, request, error, tsoc) {
    'use strict';
    var gBatchCountMissing,
        gTestsTable,
        gJob,
        gNumberRange,
        gQueryStr,
        gSearchFilter,
        gSoc,
        gTableCount;

    document.getElementById('li-soc').setAttribute('class', 'active');

    gTableCount = {};
    gBatchCountMissing = {};

    function updateCountDetail(result) {
        if (result.result.length > 0) {
            html.replaceContent(
                document.getElementById(result.operation_id),
                document.createTextNode(
                    format.number(parseInt(result.result[0].count, 10)))
            );
        }
    }

    function getDetailsDone(response) {
        var results;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('count-list-badge', '?');
        } else {
            results.forEach(updateCountDetail);
        }
    }

    function getDetails() {
        var batchOps,
            deferred;

        batchOps = [];
        batchOps.push({
            method: 'GET',
            operation_id: 'tests-count',
            resource: 'count',
            document: 'test_case',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'devices-count',
            distinct: 'device_type',
            resource: 'test_case',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'labs-count',
            distinct: 'lab_name',
            resource: 'test_group',
            query: gQueryStr
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error)
            .done(getDetailsDone);
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

    function getTestCountFail() {
        html.replaceByClassHTML('count-badge', '&infin;');
    }

    function getTestCountDone(response) {
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
            // Invalidate the cells in column #3 before updating the DOM
            // elements. In this way we have the correct 'filter' values in the
            // global object that we can use to provide the search parameters.
            gTestsTable.invalidateColumn(3);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);

            gTestsTable
                .search(gSearchFilter);
        } else {
            html.replaceByClassTxt('count-badge', '?');
        }
    }

    function getTestCount(response) {
        var batchOps,
            deferred,
            results;

        batchOps = [];

        function _prepareBatchOps(result) {
            var kernel = result.kernel
            var filter = '&kernel=' + kernel;

            batchOps.push({
                operation_id: 'test-total-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'test_case',
                query: gQueryStr + filter
            });

            batchOps.push({
                operation_id: 'test-success-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'test_case',
                query: gQueryStr + '&status=PASS' + filter
            });

            batchOps.push({
                operation_id: 'test-fail-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'test_regression',
                query: gQueryStr + filter
            });

            batchOps.push({
                operation_id: 'test-unknown-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'test_case',
                query: gQueryStr +
                    '&status=FAIL&status=SKIP&regression_id=null' + filter
            });
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_prepareBatchOps);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getTestCountFail)
                .done(getTestCountDone);
        }
    }

    function getTestsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterTestCount(data) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('test-success-count-' + data)) {
            if (gTableCount['test-success-count-' + data]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('test-fail-count-' + data)) {
            if (gTableCount['test-fail-count-' + data]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function getTestsDone(response) {
        var columns,
            results;
        // Internal wrapper for the filter.
        function _renderTestCount(data, type) {
            if (type === 'filter') {
                return getFilterTestCount(data);
            } else {
                return tsoc.renderTestCount(data, type);
            }
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return tsoc.renderDetails(
                '/soc/' + gSoc + '/job/' + gJob + '/kernel/' + data, type);
        }

        /**
         * Create the table column title for the test count.
        **/
        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regression/Other test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column'
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'git_commit',
                    title: 'Commit',
                    type: 'string',
                    className: 'commit-column'
                },
                {
                    data: 'kernel',
                    title: _testColumnTitle(),
                    type: 'string',
                    orderable: false,
                    className: 'test-count pull-center',
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
                    data: 'kernel',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gTestsTable
                .columns(columns)
                .data(results)
                .paging(false)
                .info(false)
                .rowURL('/soc/%(mach)s/job/%(job)s/kernel/%(kernel)s/')
                .rowURLElements(['mach', 'job', 'kernel'])
                .order([4, 'desc'])
                .draw();
        }
    }

    function getTests() {
        var deferred;

        deferred = request.get(
            '/_ajax/test/case',
            {
                aggregate: 'kernel',
                limit: gNumberRange,
                field: [
                    'created_on',
                    'git_branch',
                    'git_commit',
                    'job',
                    'kernel',
                    'mach'
                ],
                job: gJob,
                mach: gSoc,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(error.error, getTestsFail)
            .done(getTestsDone, getTestCount);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('soc-name') !== null) {
        gSoc = document.getElementById('soc-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gQueryStr = 'mach=' + gSoc + '&job=' + gJob;
    gTestsTable = table({
        tableId: 'tests-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    getDetails();
    getTests();

    init.hotkeys();
    init.tooltip();
});
