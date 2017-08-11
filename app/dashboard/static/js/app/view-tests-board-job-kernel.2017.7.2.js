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
    var gFileServer,
        gJob,
        gKernel,
        gSearchFilter,
        gBoard;
    var gLabList;
    var gLabTable;
    var gTableCount;
    var gBatchCountMissing;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

   	gTableCount = {};
    gBatchCountMissing = {};
    gLabTable = [];

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
    function updateBatchCount() {
        Object.keys(gBatchCountMissing).forEach(function(key) {
            updateOrStageCount(key, gBatchCountMissing[key]);
        });
    }

    function getBatchCountFail() {
    	// TODO fix this
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(labTable, response) {
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
            labTable.invalidateColumn(2);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);

            // Bind a new function to the draw event of the table.
            labTable.addDrawEvent(updateBatchCount);
        }
    }

    function getBatchCount(lab, labTable, response) {
        var batchOps;
        var deferred;
        var suiteId;
        var queryStr;
        var results;

        function _createOp(result) {
        	suiteId = result._id.$oid;
            // TODO When sorting check if more than 1 result print conflict error
            batchOps.push({
                method: 'GET',
                operation_id: lab + '-sets-count-' + suiteId,
                resource: 'count',
                document: 'test_set',
                query: queryStr + suiteId
            });
            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-total-count-' + suiteId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + suiteId
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-success-count-' + suiteId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + suiteId + '&status=PASS'
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-fail-count-' + suiteId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + suiteId + '&status=FAIL'
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-unknown-count-' + suiteId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + suiteId + '&status=OFFLINE&status=UNKNOWN'
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            queryStr = 'test_suite_id=';
            results.forEach(_createOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBatchCountFail)
                .done(function(response) {
                	getBatchCountDone(labTable, response)
                });
        }
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

    function getTestsFail(lab) {
        html.replaceContent(
            document.getElementById("lab-" + lab),
            html.errorDiv('Error loading data.'));
    }


    function getTestsDone(lab, labTable, response) {
        var columns,
            results;

        // Internal wrapper to provide the href.
        function _renderSetsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: lab + '-sets-',
                    extraClasses: ['sets-count-badge']
                });
            } else if (type === 'sort') {
                if (gTableCount.hasOwnProperty(lab + '-sets-count-' + data)) {
                    rendered = gTableCount[lab + '-sets-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        // Internal wrapper for the filter.
        function _renderCasesCount(data, type) {
            if (type === 'filter') {
                return getFilterCasesCount(data);
            } else {
                return ttest.renderCasesCount(data, type, lab + '-cases-');
            }
        }

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails(
                '/test/suite/' + data, type);
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
                    data: 'name',
                    title: 'Test suite name',
                    type: 'string',
                    className: 'test-suite-column'
                },
                {
                    data: '_id.$oid',
                    title: 'Test suite ID',
                    type: 'string',
                    className: 'test-suite-ID-column'
                },
                {
                    data: '_id.$oid',
                    title: 'Total test sets',
                    type: 'string',
                    orderable: false,
                    className: 'sets-count pull-center',
                    render: _renderSetsCount
                },
                {
                    data: '_id.$oid',
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
                    data: '_id.$oid',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            labTable
                .columns(columns)
                .data(results)
                .info(false)
                .rowURL('/test/suite/%(_id)s/')
                .rowURLElements(['_id'])
                .order([5, 'desc'])
                .draw();
        }
    }

    function getTests() {
        var data;
        var deferred;

        data = {
        	board: gBoard,
        	job: gJob,
        	kernel: gKernel,
            sort: 'created_on',
            sort_order: '-1',
        };

        function getData(lab) {
            data.lab_name = lab;

		    gLabTable.push(table({
		        tableId: 'lab-table-' + lab,
		        tableLoadingDivId: 'lab-table-loading-' + lab,
		        tableDivId: 'lab-table-div-' + lab
		    }));
		    var labTable = gLabTable[gLabTable.length - 1];
            deferred = request.get('/_ajax/test/suite', data);
            $.when(deferred)
                .done(function(response) {
                    getTestsDone(lab, labTable, response);
                    getBatchCount(lab, labTable, response);
                })
                .fail(error.error, function() {
                    getTestsFail(lab);
                });
        }

        gLabList.forEach(getData);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('board-name') !== null) {
        gBoard = document.getElementById('board-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gLabList = document.getElementById('lab-names');
    if (gLabList !== null) {
        gLabList = String(gLabList.value).split(',');

        if (gLabList.length > 0) {
            gLabList = gLabList.sort();
            getTests();
        }
    }

    init.hotkeys();
    init.tooltip();

});
