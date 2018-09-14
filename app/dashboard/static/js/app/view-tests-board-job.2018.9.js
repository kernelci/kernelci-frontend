/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/const',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test'
], function($, init, format, html, appconst, error, request, table, ttest) {
    'use strict';

    var gBatchCountMissing,
        gTestsTable,
        gJob,
        gNumberRange,
        gQueryStr,
        gSearchFilter,
        gBoard,
        gDateRange,
        gTableCount;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    gTableCount = {};
    gBatchCountMissing = {};
    gDateRange = appconst.MAX_DATE_RANGE;

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
            operation_id: 'groups-count',
            resource: 'count',
            document: 'test_group',
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

    function getGroupsCountFail() {
        html.replaceByClassHTML('count-badge', '&infin;');
    }

    function getGroupsCountDone(response) {
        var results;

        function _parseOperationsResult(result) {
            if (gTableCount[result.operation_id]) {
                gTableCount[result.operation_id] +=
                    parseInt(result.result[0].count, 10);
            } else {
                gTableCount[result.operation_id] =
                    parseInt(result.result[0].count, 10);
            }
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

    function getGroupsCount(response) {
        var batchOps;
        var deferred;
        var groupId;
        var groupCommit;
        var queryStr;
        var queryData;
        var results;

        batchOps = [];

        function _createOp(result) {
            groupId = result._id;
            groupCommit = result.kernel;

            if (groupId) {
                queryStr = 'test_group_id=' + groupId.$oid;
            }

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-total-count-' + groupCommit,
                resource: 'count',
                document: 'test_case',
                query: queryStr
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-success-count-' + groupCommit,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=PASS'
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-fail-count-' + groupCommit,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=FAIL'
            });

            batchOps.push({
                method: 'GET',
                operation_id: 'cases-unknown-count-' + groupCommit,
                resource: 'count',
                document: 'test_case',
                query: queryStr + '&status=OFFLINE&status=UNKNOWN&status=SKIP'
            });
        }

        function _getTestGroupDone(resultz) {
            if (resultz.result) {
                batchOps = [];
                resultz.result.forEach(_createOp);
                deferred = request.post('/_ajax/batch', JSON.stringify({batch: batchOps}));
                $.when(deferred)
                    .fail(error.error, getGroupsCountFail)
                    .done(getGroupsCountDone);
            }
        }

        function _getTestGroup(result) {
            // Query parameters to get the latest test group
            queryData = {
                board: result.board,
                job: result.job,
                git_branch: result.git_branch,
                kernel: result.kernel,
                vcs_commit: result.vcs_commit,
                sort: 'created_on',
                sort_order: '-1',
                field: ['test_cases', 'kernel']
            };

            // Get the latest test group
            deferred = request.get('/_ajax/test/group', queryData);
            $.when(deferred)
                .done(_getTestGroupDone)
                .fail(function() {
                    ttest.getCountFail(result.vcs_commit);
                });
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_getTestGroup);
        }
    }

    function getGroupsFail() {
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

    function getGroupsDone(response) {
        var columns,
            results;

        // Internal wrapper for the filter.
        function _renderCasesCount(data, type) {
            if (type === 'filter') {
                return getFilterCasesCount(data);
            } else {
                return ttest.renderCasesCount(data, type, 'cases-');
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
                .info(false)
                .rowURL('/test/board/%(board)s/job/%(job)s/kernel/%(kernel)s/')
                .rowURLElements(['board', 'job', 'kernel'])
                .order([4, 'desc'])
                .draw();
        }
    }

    function getGroups() {
        var deferred;

        deferred = request.get(
            '/_ajax/test/group',
            {
                aggregate: 'kernel',
                date_range: gDateRange,
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
            .fail(error.error, getGroupsFail)
            .done(getGroupsDone, getGroupsCount);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('board-name') !== null) {
        gBoard = document.getElementById('board-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    gQueryStr = 'board=' + gBoard + '&job=' + gJob;
    gTestsTable = table({
        tableId: 'tests-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    getDetails();
    getGroups();

    init.hotkeys();
    init.tooltip();

});
