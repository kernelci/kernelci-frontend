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
    'utils/format',
    'utils/html',
    'utils/table',
    'utils/request',
    'utils/error',
    'tables/soc'
], function($, init, format, html, table, request, error, tsoc) {
    'use strict';
    var gBatchCountMissing,
        gBootsTable,
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
        html.replaceContent(
            document.getElementById(result.operation_id),
            document.createTextNode(
                format.number(parseInt(result.result[0].count, 10)))
        );
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
            operation_id: 'boots-count',
            resource: 'count',
            document: 'boot',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'boards-count',
            distinct: 'board',
            resource: 'boot',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'labs-count',
            distinct: 'lab_name',
            resource: 'boot',
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

    function getBootsCountFail() {
        html.replaceByClassHTML('count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
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
            gBootsTable.invalidateColumn(3);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);

            gBootsTable
                .search(gSearchFilter);
        } else {
            html.replaceByClassTxt('count-badge', '?');
        }
    }

    function getBootsCount(response) {
        var batchOps,
            deferred,
            kernel,
            results;

        batchOps = [];

        function _prepareBatchOps(result) {
            kernel = result.kernel;

            batchOps.push({
                operation_id: 'boot-total-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: gQueryStr + '&kernel=' + kernel
            });

            batchOps.push({
                operation_id: 'boot-success-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: gQueryStr + '&status=PASS&kernel=' + kernel
            });

            batchOps.push({
                operation_id: 'boot-fail-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: gQueryStr + '&status=FAIL&kernel=' + kernel
            });

            batchOps.push({
                operation_id: 'boot-unknown-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: gQueryStr +
                    '&status=OFFLINE&status=UNKNOWN&status=UNTRIED&kernel=' +
                    kernel
            });
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_prepareBatchOps);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterBootCount(data) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('boot-success-count-' + data)) {
            if (gTableCount['boot-success-count-' + data]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('boot-fail-count-' + data)) {
            if (gTableCount['boot-fail-count-' + data]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function getBootsDone(response) {
        var columns,
            results;

        // Internal wrapper for the filter.
        function _renderBootCount(data, type) {
            if (type === 'filter') {
                return getFilterBootCount(data);
            } else {
                return tsoc.renderBootCount(data, type);
            }
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return tsoc.renderDetails(
                '/soc/' + gSoc + '/job/' + gJob + '/kernel/' + data, type);
        }

        /**
         * Create the table column title for the boots count.
        **/
        function _bootColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Failed/Other boot reports');
            tooltipNode.appendChild(
                document.createTextNode('Boot Results'));

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
                    title: _bootColumnTitle(),
                    type: 'string',
                    orderable: false,
                    className: 'boot-count pull-center',
                    render: _renderBootCount
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

            gBootsTable
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

    function getBoots() {
        var deferred;

        deferred = request.get(
            '/_ajax/boot',
            {
                aggregate: 'kernel',
                limit: gNumberRange,
                field: [
                    'build_id',
                    'created_on',
                    'git_branch',
                    'git_commit',
                    'job',
                    'job_id',
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
            .fail(error.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
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
    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    getDetails();
    getBoots();

    init.hotkeys();
    init.tooltip();
});
