/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/test'
], function(
        $,
        init, format, error, request, table, html, appconst, ttest) {
    'use strict';

    var gDateRange;
    var gSearchFilter;
    var gPageLen;
    var gTestsTable;
    var gSetsCount;
    var gCasesCount;
    var gBatchOpBase;
    var gBatchCountMissing;
    var gDrawEventBound;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gSetsCount = {};
    gCasesCount = {};
    gBatchOpBase = 'test_suite_name=';
    gBatchCountMissing = {};
    // Used to check if the table draw event function has already been bound.
    // In order not to bind it multiple times.
    gDrawEventBound = false;

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
    function updateTestsTable() {
        var key;

        if (Object.keys(gBatchCountMissing).length > 0) {
            for (key in gBatchCountMissing) {
                if (gBatchCountMissing.hasOwnProperty(key)) {
                    updateOrStageCount(key, gBatchCountMissing[key]);
                }
            }
        }
    }

    function getCasesCountFail() {
        html.replaceByClassHTML('cases-count-badge', '&infin;');
    }

    function getCasesCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateCasesCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gCasesCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateCasesCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestsTable.addDrawEvent(updateTestsTable);
            }
        } else {
            html.replaceByClassTxt('cases-count-badge', '?');
        }
    }

    function getCasesCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var suite = value.name;
            var query = gBatchOpBase;

            query += suite;
            batchOps.push({
                method: 'GET',
                operation_id: 'cases-count-' + suite,
                resource: 'count',
                document: 'test_case',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getCasesCountFail)
                .done(getCasesCountDone);
        }
    }

    function getSetsCountFail() {
        html.replaceByClassHTML('sets-count-badge', '&infin;');
    }

    function getSetsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateSetsCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gSetsCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateSetsCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestsTable.addDrawEvent(updateTestsTable);
            }
        } else {
            html.replaceByClassTxt('sets-count-badge', '?');
        }
    }

    function getSetsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var suite = value.name;
            var query = gBatchOpBase;

            query += suite;
            batchOps.push({
                method: 'GET',
                operation_id: 'sets-count-' + suite,
                resource: 'count',
                document: 'test_set',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getSetsCountFail)
                .done(getSetsCountDone);
        }
    }

    function getTestsDone(response) {
        var columns;

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails('/test/' + data + '/', type);
        }

        // Internal wrapper to provide the oreder count.
        function _renderSetsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'sets-',
                    extraClasses: ['sets-count-badge']
                });
            } else if (type === 'sort') {
                if (gSetsCount.hasOwnProperty('sets-count-' + data)) {
                    rendered = gSetsCount['sets-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        // Internal wrapper to provide the oreder count.
        function _renderCasesCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'cases-',
                    extraClasses: ['cases-count-badge']
                });
            } else if (type === 'sort') {
                if (gCasesCount.hasOwnProperty('cases-count-' + data)) {
                    rendered = gCasesCount['cases-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        if (response.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'name',
                    title: 'Test suite names',
                    type: 'string',
                    render: ttest.renderTestSuite
                },
                {
                    data: 'name',
                    title: 'Total test sets',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderSetsCount
                },
                {
                    data: 'name',
                    title: 'Total test cases',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderCasesCount
                },
                {
                    data: 'name',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gTestsTable
                .data(response)
                .columns(columns)
                .order([0, 'asc'])
                .languageLengthMenu('Tests per page')
                .rowURL('/test/%(name)s/')
                .rowURLElements(['name'])
                .draw();
        }
    }

    function enableSearch() {
        gTestsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getTestsParse(response) {
        var results;

        // Internal filter function to check valid test values.
        function _isValidMach(data) {
            if (data && data !== null && data !== undefined) {
                return true;
            }
            return false;
        }

        // Convert a value into an object.
        function _toObject(data) {
            return {name: data};
        }

        results = response.result;
        if (results) {
            results = results.filter(_isValidMach);
            results = results.map(_toObject);
        }
        setTimeout(getTestsDone.bind(null, results), 25);
        setTimeout(getSetsCount.bind(null, results), 75);
        setTimeout(getCasesCount.bind(null, results), 100);
        setTimeout(enableSearch, 175);
    }

    function getTestsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getTests() {
        var deferred;

        deferred = request.get('/_ajax/suite/distinct/name/', {});
        $.when(deferred)
            .fail(error.error, getTestsFail)
            .done(getTestsParse);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gTestsTable = table({
        tableId: 'tests-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getTests, 10);

    init.hotkeys();
    init.tooltip();
});
