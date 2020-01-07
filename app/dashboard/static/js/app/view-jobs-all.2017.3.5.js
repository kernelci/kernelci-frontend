/*!
 * Copyright (C) Linaro Limited 2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 *
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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/job',
    'utils/format',
    'utils/date'
], function($, init, e, r, table, html, appconst, jobt, format) {
    'use strict';
    var gBatchCountMissing;
    var gDateRange;
    var gDrawEventBound;
    var gJobsTable;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
    }, 15);

    // Used to check if the table draw event function has already been bound.
    // In order not to bind it multiple times.
    gDrawEventBound = false;
    gBatchCountMissing = {};

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

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
     * Function to be bound to the draw event of the table.
     * This is done to update dynamic elements that are not yet available
     * in the DOM due to the derefer rendering of dataTables.
    **/
    function updateJobsTable() {
        var key;

        if (Object.keys(gBatchCountMissing).length > 0) {
            for (key in gBatchCountMissing) {
                if (gBatchCountMissing.hasOwnProperty(key)) {
                    updateOrStageCount(key, gBatchCountMissing[key]);
                }
            }
        }
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results;

        function parseBatchData(data) {
            updateOrStageCount(
                data.operation_id, parseInt(data.result[0].count, 10));
        }

        results = response[0].result;
        if (results.length > 0) {
            results.forEach(parseBatchData);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gJobsTable.addDrawEvent(updateJobsTable);
            }
        }

        // Perform the table search now, after completing all operations.
        gJobsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBatchCount(response) {
        var batchOps;
        var branch;
        var deferred;
        var job;
        var kernel;
        var opId;
        var opIdTail;
        var qHead;
        var qStr;
        var results;

        function createBatchOp(result) {
            job = result.job;
            kernel = result.kernel;
            branch = result.git_branch;

            qStr = 'job=';
            qStr += job;
            qStr += '&kernel=';
            qStr += kernel;
            qStr += '&git_branch=';
            qStr += branch;

            opIdTail = job;
            opIdTail += '-';
            opIdTail += branch;

            // Get total build count.
            opId = 'build-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qStr
            });

            // Get successful build count.
            opId = 'build-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get failed build count.
            opId = 'build-fail-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get unknown build count.
            opId = 'build-unknown-count-';
            opId += opIdTail;
            qHead = 'status=UNKNOWN&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get total tests count.
            opId = 'tests-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qStr
            });

            // Get successful tests count.
            opId = 'tests-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead
            });

            // Get regressions count.
            opId = 'tests-fail-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_regression',
                query: qStr
            });

            // Get unknown boot reports count.
            opId = 'tests-unknown-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&status=SKIP&regression_id=null&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(createBatchOp);

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));
        }

        return deferred;
    }

    function getJobsFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getJobsDone(response) {
        var columns;
        var results;

        /**
         * Create the table column title for the builds count.
        **/
        function _buildColumTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Total/Successful/Failed/Unknown build reports for latest job');
            tooltipNode.appendChild(
                document.createTextNode('Latest Build Status'));

            return tooltipNode.outerHTML;
        }

        /**
         * Create the table column title for the test results count.
        **/
        function _testsColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Total/Successful/Regressions/Other tests for latest job');
            tooltipNode.appendChild(
                document.createTextNode('Latest Test Results'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type, object) {
            var href = '/job/';
            href += data;
            href += '/branch/';
            href += object.git_branch;
            href += '/';
            return jobt.renderDetails(href, type);
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderTestsCount(data, type, object) {
            var href;
            var nodeId;

            href = '/tests/all/job/';
            href += data;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += object.kernel;
            href += '/';

            nodeId = data;
            nodeId += '-';
            nodeId += object.git_branch;
            return jobt.renderTestsCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        function _renderBuildCount(data, type, object) {
            var href;
            var nodeId;

            href = '/build/';
            href += data;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += object.kernel;
            href += '/';

            nodeId = data;
            nodeId += '-';
            nodeId += object.git_branch;
            return jobt.renderBuildCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        function _renderTree(data, type) {
            var href = '/job/';
            href += data;
            href += '/';
            return jobt.renderTree(data, type, href);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No jobs data available.'));
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
                    className: 'branch-column'
                },
                {
                    data: 'job',
                    title: _buildColumTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderBuildCount
                },
                {
                    data: 'job',
                    title: _testsColumnTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderTestsCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: jobt.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: jobt.renderStatus
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gJobsTable
                .data(results)
                .columns(columns)
                .order([4, 'desc'])
                .languageLengthMenu('jobs per page')
                .rowURL('/job/%(job)s/branch/%(git_branch)s/')
                .rowURLElements(['job', 'git_branch'])
                .draw();
        }
    }

    // A deferred version of getJobsDone.
    function getJobsDoneD(response) {
        var deferred;

        deferred = $.Deferred();
        deferred.resolve(getJobsDone(response));

        return deferred.promise();
    }

    function getJobsDoneMulti(response) {
        $.when(getBatchCount(response), getJobsDoneD(response))
            .fail(e.error, getBatchCountFail)
            .done(getBatchCountDone);
    }

    function getJobs() {
        var data;
        var deferred;

        data = {
            aggregate: ['job', 'git_branch'],
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            field: [
                'job', 'kernel', 'status', 'created_on', 'git_branch'
            ]
        };

        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDoneMulti);
    }

    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gJobsTable = table({
        tableId: 'jobstable',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getJobs, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
