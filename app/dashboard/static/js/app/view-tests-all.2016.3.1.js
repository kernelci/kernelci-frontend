/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/request',
    'utils/error',
    'utils/html',
    'utils/date'
], function($, init, request, err, html) {
    'use strict';
    var gSuitePrefix;
    var gTestsList;

    document.getElementById('li-test').setAttribute('class', 'active');
    // Prefix used to access the DOM elements.
    gSuitePrefix = 'suite-';

    function getTestCasesFail(suite) {
        Array.prototype.forEach.call(
            suite.querySelectorAll('span.test-cases'),
            function(element) {
                element.innerHTML = '&infin;';
            }
        );
    }

    function getTestCasesDone(suite, response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            results.forEach(function(result) {
                html.replaceContent(
                    suite.querySelector('#' + result.operation_id),
                    document.createTextNode(result.result[0].count));
            });
        } else {
            Array.prototype.forEach.call(
                suite.querySelectorAll('span.test-cases'),
                function(element) {
                    html.replaceContent(element, document.createTextNode('?'));
                }
            );
        }
    }

    function getTestsFail(suite) {
        html.replaceContent(
            document.getElementById(gSuitePrefix + suite),
            html.errorDiv('Error loading data.'));
    }

    function getTestsDone(suite, response) {
        var batchOps;
        var deferred;
        var domElement;
        var iNode;
        var results;
        var spanNode;
        var tableBody;
        var tableCell;
        var tableHead;
        var tableNode;
        var tableRow;

        domElement = document.getElementById(gSuitePrefix + suite);
        if (!domElement) {
            throw 'Element not found: ' + gSuitePrefix + suite;
        }

        results = response.result;

        function _createTableRows(result, idx) {
            tableRow = tableBody.insertRow(-1);

            // Tree.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode(result.job));
            tableCell.className = 'tree-colum';

            // Kernel.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode(result.kernel));
            tableCell.className = 'kernel-colum';

            // Defconfig.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(
                document.createTextNode(result.defconfig_full));
            tableCell.className = 'defconfig-colum';

            // Arch.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode(result.arch));
            tableCell.className = 'arch-colum';

            // Board.
            tableCell = tableRow.insertCell();
            if (result.board) {
                tableCell.appendChild(document.createTextNode(result.board));
            } else {
                tableCell.appendChild(html.nonavail());
            }
            tableCell.className = 'board-colum';

            // Test sets.
            tableCell = tableRow.insertCell();
            tableCell.className = 'pull-center';

            spanNode = document.createElement('span');
            spanNode.id = 'test-sets-' + suite + idx;
            spanNode.className = 'badge count-badge test-sets';

            if (result.test_set) {
                spanNode.appendChild(
                    document.createTextNode(result.test_set.length));
            } else {
                spanNode.appendChild(document.createTextNode('0'));
            }

            tableCell.appendChild(spanNode);

            // Test cases.
            tableCell = tableRow.insertCell();
            tableCell.className = 'pull-center';

            spanNode = document.createElement('span');
            spanNode.id = 'test-cases-' + suite + idx;
            spanNode.className = 'badge count-badge test-cases';

            iNode = document.createElement('i');
            iNode.className = 'fa fa-cog fa-spin';

            spanNode.appendChild(iNode);
            tableCell.appendChild(spanNode);

            // Complete the batch operation for each test suite id found to
            // calculate its test cases.
            batchOps.push({
                method: 'GET',
                resource: 'count',
                document: 'test_case',
                operation_id: 'test-cases-' + suite + idx,
                query: 'test_suite_id=' + result._id.$oid
            });

            // Date.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode(
                (new Date(result.created_on.$date).toCustomISODate()))
            );
            tableCell.className = 'pull-center';

            // TODO
            // Details link.
            tableCell = tableRow.insertCell();
            tableCell.innerHTML = '&nbsp;';
            tableCell.className = 'select-column pull-center';
        }

        if (results.length > 0) {
            // Initialize the batch operations.
            batchOps = [];
            tableNode = document.createElement('table');

            tableNode = document.createElement('table');
            tableNode.className =
                'table table-condensed table-striped tests-table';

            tableHead = tableNode.createTHead();
            tableRow = tableHead.insertRow();

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Tree'));

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Kernel'));

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Defconfig'));

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Arch.'));

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Board'));

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Total Test Sets'));
            tableCell.className = 'pull-center';

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Total Test Cases'));
            tableCell.className = 'pull-center';

            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode('Date'));
            tableCell.className = 'pull-center';

            // The "select" cell, nothing to write as title.
            tableRow.insertCell();

            tableBody = document.createElement('tbody');

            // Loop through the data to create the rows.
            results.forEach(_createTableRows);

            tableNode.appendChild(tableBody);
            html.replaceContent(domElement, tableNode);

            // If we have some batch operations, perform them now.
            if (batchOps.length > 0) {
                deferred = request.post(
                    '/_ajax/batch', JSON.stringify({batch: batchOps}));

                $.when(deferred)
                    .fail(err.error, function() {
                        getTestCasesFail(domElement);
                    })
                    .done(function(data) {
                        getTestCasesDone(domElement, data);
                    });
            }
        } else {
            html.replaceContent(domElement, html.errorDiv('No data found.'));
        }
    }

    function getTests() {
        var data;
        var deferred;

        data = {
            sort: 'created_on',
            sort_order: '-1',
            limit: '5'
        };

        function getData(suite) {
            data.name = suite;

            deferred = request.get('/_ajax/test/suite', data);
            $.when(deferred)
                .done(function(response) {
                    getTestsDone(suite, response);
                })
                .fail(err.error, function() {
                    getTestsFail(suite);
                });
        }

        gTestsList.forEach(getData);
    }

    gTestsList = document.getElementById('test-suite-names');
    if (gTestsList !== null) {
        gTestsList = String(gTestsList.value).split(',');

        if (gTestsList.length > 0) {
            getTests();
        }
    }

    init.hotkeys();
    init.tooltip();
});
