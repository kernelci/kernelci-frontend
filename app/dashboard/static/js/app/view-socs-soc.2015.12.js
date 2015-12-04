/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
        gSoc;

    gBatchCountMissing = {};
    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    function getDistinctBoardsTable(response) {
        var columns,
            dom,
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
            dom = '<"row"<"col-xs-12 col-sm-12 col-md-4 col-lg-4"' +
                '<"length-menu"l>>' +
                '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"<"table-process">>' +
                '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
                '<"row paging"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
                '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

            columns = [
                {
                    data: 'board',
                    title: 'Board'
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
                .dom(dom)
                .noIdURL(true)
                .rowURL('/boot/%(board)s/')
                .rowURLElements(['board'])
                .data(tableResults)
                .columns(columns)
                .lengthMenu([5, 10, 25, 50])
                .languageLengthMenu('boards per page')
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

    function getBootsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boots-count'), '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            html.replaceContent(
                document.getElementById('boots-count'),
                document.createTextNode(
                    format.number(parseInt(results[0].count, 10))));
        } else {
            html.replaceConten(
                document.getElementById('boots-count'),
                document.createTextNode('?'));
        }
    }

    function getDetails() {
        var data,
            deferred;

        data = {mach: gSoc};

        deferred = r.get('/_ajax/count/boot', data);

        $.when(deferred)
            .fail(e.error, getBootsCountFail)
            .done(getBootsCountDone);

        deferred = r.get('/_ajax/boot/distinct/board', data);

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

    function updateCount(result) {
        updateOrStageCount(
            result.operation_id, parseInt(result.result[0].count, 10));
    }

    /**
     * Function to be bound to the draw event of the table.
     * This is done to update dynamic elements that are not yet available
     * in the DOM due to the derefer rendering of dataTables.
    **/
    function updateBootCount() {
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

        results = response.result;
        if (results.length > 0) {
            results.forEach(updateCount);
            // Bind a new function to the draw event of the table.
            gJobsTable.addDrawEvent(updateBootCount);
        }
    }

    function getBatchCount(response) {
        var batchOps,
            deferred,
            job,
            jobId,
            queryStr,
            results;

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            queryStr = 'mach=' + gSoc;

            results.forEach(function(result) {
                job = result.job;
                jobId = result.job_id;

                if (jobId) {
                    jobId = '&job_id=' + jobId.$oid;
                } else {
                    // No job_id value, search only in the last X days.
                    jobId = '&date_range=' + gDateRange;
                }

                batchOps.push({
                    method: 'GET',
                    operation_id: 'boot-success-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: queryStr + '&status=PASS&job=' + job + jobId
                });

                batchOps.push({
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: queryStr + '&status=FAIL&job=' + job + jobId
                });
            });

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

    function getJobsDone(response) {
        var columns,
            results;

        // Internal wrapper to provide the href.
        function _renderBootCount(data, type) {
            return tsoc.renderBootCount(
                data, type, '/soc/' + gSoc + '/job/' + data + '/');
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

        results = response.result;
        if (results.length > 0) {
            columns = [
                {
                    data: 'job',
                    title: 'Tree',
                    className: 'tree-column',
                    render: _renderTree
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    className: 'branch-column'
                },
                {
                    data: 'job',
                    searchable: false,
                    orderable: false,
                    title: 'Latest Boot Results',
                    className: 'pull-center',
                    render: _renderBootCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    className: 'date-column pull-center',
                    render: tsoc.renderDate
                },
                {
                    data: 'job',
                    title: '',
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
                .noIdURL(true)
                .languageLengthMenu('trees per page')
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
            '/_ajax/boot',
            {
                aggregate: 'job',
                date_range: gDateRange,
                field: [
                    'job', 'job_id', 'git_branch', 'created_on', 'mach'
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

    document.getElementById('li-soc').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

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
});
