/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/urls',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test'
], function($, init, format, urls, html, error, request, table, ttest) {
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
    gLabList = [];

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
        var groupId;
        var queryStr;
        var results;

        function _createOp(result) {
            groupId = result._id.$oid;
            // TODO When sorting check if more than 1 result print conflict error
            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-total-count-' + groupId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + groupId
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-success-count-' + groupId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + groupId + '&status=PASS'
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-fail-count-' + groupId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + groupId + '&status=FAIL'
            });

            batchOps.push({
                method: 'GET',
                operation_id: lab + '-cases-unknown-count-' + groupId,
                resource: 'count',
                document: 'test_case',
                query: queryStr + groupId + '&status=OFFLINE&status=UNKNOWN&status=SKIP'
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            queryStr = 'test_group_id=';
            results.forEach(_createOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBatchCountFail)
                .done(function(resultz) {
                    getBatchCountDone(labTable, resultz);
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
            document.getElementById('lab-' + lab),
            html.errorDiv('Error loading data.'));
    }


    function getTestsDone(lab, labTable, response) {
        var columns,
            results;

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
                '/test/group/' + data, type);
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
                    title: 'Test group name',
                    type: 'string',
                    className: 'test-group-column'
                },
                {
                    data: '_id.$oid',
                    title: 'Test group ID',
                    type: 'string',
                    className: 'test-group-ID-column'
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
                .rowURL('/test/group/%(_id)s/')
                .rowURLElements(['_id'])
                .order([4, 'desc'])
                .draw();
        }
    }

    function updateDetails(response) {
        var aNode,
            createdOn,
            domNode,
            gitBranch,
            gitCommit,
            gitURL,
            gitURLs,
            results,
            tooltipNode;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('loading-content', '?');
        } else {
            results = results[0];

            gitBranch = results.git_branch;
            gitCommit = results.vcs_commit;
            gitURL = results.git_url;
            createdOn = new Date(results.created_on.$date);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // SoC.
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for SoC ' + gBoard);
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + gBoard + '/');
            aNode.appendChild(document.createTextNode(gBoard));
            tooltipNode.appendChild(aNode);

            html.replaceContent(document.getElementById('board'), tooltipNode);

            // Tree.
            domNode = document.createElement('div');
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Details for SoC &#171;' + gBoard + '&#187; with tree ' + gJob);
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + gBoard + '/job/' + gJob + '/');
            aNode.appendChild(document.createTextNode(gJob));
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for tree &#171;' + gJob + '&#187;');
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/boot/all/job/' + gJob + '/');
            aNode.appendChild(html.boot());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Details for tree &#171;' + gJob + '&#187;');
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/job/' + gJob + '/');
            aNode.appendChild(html.tree());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(document.getElementById('tree'), domNode);

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(gitBranch));

            // Git describe.
            domNode = document.createElement('div');
            domNode.appendChild(document.createTextNode(gKernel));
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for &#171;' + gJob + '&#187; - ' + gKernel);
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/boot/all/job/' + gJob + '/kernel/' + gKernel + '/');
            aNode.appendChild(html.boot());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Build reports for &#171;' + gJob + '&#187; - ' + gKernel);
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/build/' + gJob + '/kernel/' + gKernel);
            aNode.appendChild(html.build());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('git-describe'), domNode);

            // Git URL.
            if (gitURLs[0]) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
            } else {
                if (gitURL && gitURL !== undefined) {
                    aNode = document.createTextNode(gitURL);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-url'), aNode);

            // Git commit.
            if (gitURLs[1]) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
            } else {
                if (gitCommit && gitCommit !== null) {
                    aNode = document.createTextNode(gitCommit);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-commit'), aNode);

            // Date.
            domNode = document.createElement('time');
            domNode.setAttribute('datetime', createdOn.toISOString());
            domNode.appendChild(
                document.createTextNode(createdOn.toCustomISODate()));
            html.replaceContent(
                document.getElementById('job-date'), domNode);
        }
    }

    function getTests() {
        var data;
        var deferred;

        function getData(lab) {
            var labTable;
            data.lab_name = lab;

            gLabTable.push(table({
                tableId: 'lab-table-' + lab,
                tableLoadingDivId: 'lab-table-loading-' + lab,
                tableDivId: 'lab-table-div-' + lab
            }));
            labTable = gLabTable[gLabTable.length - 1];
            deferred = request.get('/_ajax/test/group', data);
            $.when(deferred)
                .done(function(response) {
                    getTestsDone(lab, labTable, response);
                    getBatchCount(lab, labTable, response);
                })
                .fail(error.error, function() {
                    getTestsFail(lab);
                });
        }

        data = {
            board: gBoard,
            job: gJob,
            kernel: gKernel,
            sort: 'created_on',
            sort_order: '-1',
        };
        // Update the general details
        deferred = request.get('/_ajax/test/group', data);
        $.when(deferred)
            .done(updateDetails);
        // Update each lab with the specific data
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

    function extendLabList(lab) {
        gLabList.push(lab.value);
    }

    Array.prototype.slice.call(document.querySelectorAll('input.lab-names'))
        .map(extendLabList);
    if (gLabList.length > 0) {
        getTests();
    }

    init.hotkeys();
    init.tooltip();

});
