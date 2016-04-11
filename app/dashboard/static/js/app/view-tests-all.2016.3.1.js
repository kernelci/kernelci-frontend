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
    var gTestList;

    document.getElementById('li-test').setAttribute('class', 'active');
    // Prefix used to access the DOM elements.
    gSuitePrefix = 'suite-';

    function getTestsFail(suite, response) {
        // TODO
    }

    function getTestsDone(suite, response) {
        var domElement;
        var results;
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

        function _createTableRows(result) {
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
            if (result.test_set) {
                tableCell.appendChild(
                    document.createTextNode(result.test_set.length));
            } else {
                tableCell.appendChild(document.createTextNode('0'));
            }
            tableCell.className = 'pull-center';

            // Test cases.
            tableCell = tableRow.insertCell();
            if (result.test_case) {
                tableCell.appendChild(
                    document.createTextNode(result.test_case.length));
            } else {
                tableCell.appendChild(document.createTextNode('0'));
            }
            tableCell.className = 'pull-center';

            // Date.
            tableCell = tableRow.insertCell();
            tableCell.appendChild(document.createTextNode(
                (new Date(result.created_on.$date).toCustomISODate()))
            );
            tableCell.className = 'pull-center';

            // TODO
            // Details link.
            tableCell = tableRow.insertCell();
            var tooltipNode = html.tooltip();
            tooltipNode.setAttribute('data-title', 'More info');
            var aNode = document.createElement('a');
            aNode.setAttribute('href', '/test/' + suite + '/');
            tooltipNode.appendChild()
            tableCell.innerHTML = '&nbsp;';
            tableCell.className = 'select-column pull-center';
        }

        if (results.length > 0) {
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
        } else {
            html.replaceContent(domElement, html.errorDiv('No data found.'));
        }
    }

    function getTests() {
        var deferred;
        var data;

        data = {
            sort: 'created_on',
            sort_order: '-1',
            limit: '5'
        };

        function _createRequest(suite) {
            data.name = suite;

            deferred = request.get('/_ajax/test/suite', data);
            $.when(deferred)
                .done(function(response) {
                    getTestsDone(suite, response);
                })
                .fail(err.error, function(response) {
                    getTestsFail(suite, response);
                });
        }

        gTestList.forEach(_createRequest);
    }

    document.getElementById('li-test').setAttribute('class', 'active');
    gTestList = document.getElementById('test-suite-names');
    if (gTestList !== null) {
        gTestList = String(gTestList.value).split(',');

        if (gTestList.length > 0) {
            getTests();
        }
    }

    init.hotkeys();
    init.tooltip();
});
