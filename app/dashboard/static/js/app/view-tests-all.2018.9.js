/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * Copyright (c) 2017 BayLibre, SAS.
 * Author: Loys Ollivier <lollivier@baylibre.com>
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
    var gGroupsCount;
    var gLabsCount;
    var gBatchOpBase;
    var gBatchCountMissing;
    var gDrawEventBound;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gGroupsCount = {};
    gLabsCount = {};
    gBatchOpBase = 'board=';
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

    function getLabsCountFail() {
        html.replaceByClassHTML('labs-count-badge', '&infin;');
    }

    function getLabsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateLabsCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gLabsCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateLabsCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestsTable.addDrawEvent(updateTestsTable);
            }
        } else {
            html.replaceByClassTxt('labs-count-badge', '?');
        }
    }

    function getLabsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var group = value.board;
            var query = gBatchOpBase;

            query += group;
            batchOps.push({
                method: 'GET',
                operation_id: 'labs-count-' + group,
                resource: 'test_group',
                distinct: 'lab_name',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getLabsCountFail)
                .done(getLabsCountDone);
        }
    }

    function getGroupsCountFail() {
        html.replaceByClassHTML('groups-count-badge', '&infin;');
    }

    function getGroupsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateGroupsCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gGroupsCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateGroupsCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestsTable.addDrawEvent(updateTestsTable);
            }
        } else {
            html.replaceByClassTxt('groups-count-badge', '?');
        }
    }

    function getGroupsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var group = value.board;
            var query = gBatchOpBase;

            query += group;
            batchOps.push({
                method: 'GET',
                operation_id: 'groups-count-' + group,
                resource: 'count',
                document: 'test_group',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getGroupsCountFail)
                .done(getGroupsCountDone);
        }
    }

    function getTestsDone(response) {
        var columns;

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return ttest.renderDetails('/test/board/' + data + '/', type);
        }

        // Internal wrapper to provide the oreder count.
        function _renderGroupsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'groups-',
                    extraClasses: ['groups-count-badge']
                });
            } else if (type === 'sort') {
                if (gGroupsCount.hasOwnProperty('groups-count-' + data)) {
                    rendered = gGroupsCount['groups-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        // Internal wrapper to provide the oreder count.
        function _renderLabsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = ttest.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'labs-',
                    extraClasses: ['labs-count-badge']
                });
            } else if (type === 'sort') {
                if (gLabsCount.hasOwnProperty('labs-count-' + data)) {
                    rendered = gLabsCount['labs-count-' + data];
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
                    data: 'board',
                    title: 'Board',
                    type: 'string',
                    render: ttest.renderBoard
                },
                {
                    data: 'board',
                    title: 'Total Test Groups',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderGroupsCount
                },
                {
                    data: 'board',
                    title: 'Total Unique Labs',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderLabsCount
                },
                {
                    data: 'board',
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
                .rowURL('/test/board/%(board)s/')
                .rowURLElements(['board'])
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
        function _isValidBoard(data) {
            if (data && data !== null && data !== undefined) {
                return true;
            }
            return false;
        }

        // Convert a value into an object.
        function _toObject(data) {
            return {board: data};
        }

        results = response.result;
        if (results) {
            results = results.filter(_isValidBoard);
            results = results.map(_toObject);
        }
        setTimeout(getTestsDone.bind(null, results), 25);
        setTimeout(getGroupsCount.bind(null, results), 25);
        setTimeout(getLabsCount.bind(null, results), 25);
        setTimeout(enableSearch, 25);
    }

    function getTestsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getTests() {
        var deferred;
        var reqData;

        reqData = {
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            limit: appconst.MAX_QUERY_LIMIT,
        }

        deferred = request.get('/_ajax/group/distinct/board/', reqData);
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
