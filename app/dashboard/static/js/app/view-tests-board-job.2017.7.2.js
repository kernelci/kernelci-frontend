/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test'
], function($, init, format, html, error, request, table, ttest) {
    'use strict';

    var gBatchCountMissing,
        gTestsTable,
        gJob,
        gNumberRange,
        gQueryStr,
        gSearchFilter,
        gBoard,
        gTableCount;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

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
            operation_id: 'suites-count',
            resource: 'count',
            document: 'test_suite',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'boards-count',
            distinct: 'board',
            resource: 'test_suite',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'labs-count',
            distinct: 'lab_name',
            resource: 'test_suite',
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

    function getSuitesCountFail() {
        html.replaceByClassHTML('count-badge', '&infin;');
    }

    function getSuitesCountDone(response) {
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

    function getSuitesCount(response) {
        var batchOps,
            deferred,
            kernel,
            results;

        batchOps = [];

        function _prepareBatchOps(result) {
            batchOps.push({
                operation_id: 'useless-count',
                method: 'GET',
                resource: 'count',
                document: 'boot',
            });
            // TODO create the batch ops
/*            kernel = result.kernel;

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
            });*/
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_prepareBatchOps);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getSuitesCountFail)
                .done(getSuitesCountDone);
        }
    }

    function getSuitesFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterCasesCount(data) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('cases-success-count-' + data)) {
            if (gTableCount['cases-success-count-' + data]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('cases-fail-count-' + data)) {
            if (gTableCount['cases-fail-count-' + data]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function getSuitesDone(response) {
        var columns,
            results;

        // Internal wrapper for the filter.
        function _renderCasesCount(data, type) {
            if (type === 'filter') {
                return getFilterCasesCount(data);
            } else {
                return ttest.renderCasesCount(data, type);
            }
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails(
                '/test/board/' + gBoard + '/job/' + gJob + '/kernel/' + data, type);
        }

        /**
         * Create the table column title for the cases count.
        **/
        function _casesColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Failed/Other test reports');
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
                    data: 'vcs_commit',
                    title: 'Commit',
                    type: 'string',
                    className: 'commit-column'
                },
                // TODO implement this
                {
                    data: 'kernel',
                    title: _casesColumnTitle(),
                    type: 'string',
                    orderable: false,
                    className: 'cases-count pull-center',
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
                .rowURL('/test/board/%(board)s/job/%(job)s/kernel/%(kernel)s/')
                .rowURLElements(['board', 'job', 'kernel'])
                .order([4, 'desc'])
                .draw();
        }
    }

    function getSuites() {
        var deferred;

        deferred = request.get(
            '/_ajax/test/suite',
            {
                aggregate: 'kernel',
                limit: gNumberRange,
                field: [
                    'build_id',
                    'created_on',
                    'git_branch',
                    'vcs_commit',
                    'job',
                    'job_id',
                    'kernel',
                    'board'
                ],
                job: gJob,
                board: gBoard,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(error.error, getSuitesFail)
            .done(getSuitesDone, getSuitesCount);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('board-name') !== null) {
        gBoard = document.getElementById('board-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gQueryStr = 'board=' + gBoard + '&job=' + gJob;
    gTestsTable = table({
        tableId: 'tests-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    getDetails();
    getSuites();

    init.hotkeys();
    init.tooltip();

});
