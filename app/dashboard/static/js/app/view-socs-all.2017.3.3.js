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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/soc',
    'utils/storage'
], function(
        $,
        init, format, error, request, table, html, appconst, tsoc, storage) {
    'use strict';
    var gBatchCountMissing;
    var gBatchOpBase;
    var gBoardsCount;
    var gBootsCount;
    var gDateRange;
    var gDrawEventBound;
    var gLabsCount;
    var gPageLen;
    var gSearchFilter;
    var gSessionStorage;
    var gSocsTable;

    setTimeout(function() {
        document.getElementById('li-soc').setAttribute('class', 'active');
    }, 15);

    gBatchOpBase = 'mach=';
    gDateRange = appconst.MAX_DATE_RANGE;
    gBootsCount = {};
    gBoardsCount = {};
    gLabsCount = {};
    gBatchCountMissing = {};
    // Used to check if the table draw event function has already been bound.
    // In order not to bind it multiple times.
    gDrawEventBound = false;
    gSessionStorage = storage('views-socs-all');

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
    function updateSocsTable() {
        var key;

        if (Object.keys(gBatchCountMissing).length > 0) {
            for (key in gBatchCountMissing) {
                if (gBatchCountMissing.hasOwnProperty(key)) {
                    updateOrStageCount(key, gBatchCountMissing[key]);
                }
            }
        }
    }

    function getBootsCountFail() {
        html.replaceByClassHTML('boots-count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateBootsCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gBootsCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateBootsCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gSocsTable.addDrawEvent(updateSocsTable);
            }
        } else {
            html.replaceByClassTxt('boots-count-badge', '?');
        }
    }

    function getBootsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var soc = value.mach;
            var query = gBatchOpBase;
            query += soc;
            batchOps.push({
                method: 'GET',
                operation_id: 'boots-count-' + soc,
                resource: 'count',
                document: 'boot',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBootsCountFail)
                .done(getBootsCountDone);
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
                gSocsTable.addDrawEvent(updateSocsTable);
            }
        } else {
            html.replaceByClassTxt('boards-count-badge', '?');
        }
    }

    function getLabsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var soc = value.mach;
            var query = gBatchOpBase;
            query += soc;
            batchOps.push({
                method: 'GET',
                operation_id: 'labs-count-' + soc,
                resource: 'boot',
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

    function getBoardsCountFail() {
        html.replaceByClassHTML('boards-count-badge', '&infin;');
    }

    function getBoardsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateBoardsCount(result) {
            var count;
            var opId;

            count = parseInt(result.result[0].count, 10);
            opId = result.operation_id;
            gBoardsCount[opId] = count;

            updateOrStageCount(opId, count);
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_updateBoardsCount);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gSocsTable.addDrawEvent(updateSocsTable);
            }
        } else {
            html.replaceByClassTxt('boards-count-badge', '?');
        }
    }

    function getBoardsCount(response) {
        var batchOps;
        var deferred;

        function createBatchOp(value) {
            var soc = value.mach;
            var query = gBatchOpBase;

            query += soc;
            batchOps.push({
                method: 'GET',
                operation_id: 'boards-count-' + soc,
                resource: 'boot',
                distinct: 'board',
                query: query
            });
        }

        if (response.length > 0) {
            batchOps = [];
            response.forEach(createBatchOp);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBoardsCountFail)
                .done(getBoardsCountDone);
        }
    }

    function getSocsDone(response) {
        var columns;

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return tsoc.renderDetails('/soc/' + data + '/', type);
        }

        // Internal wrapper to provide the oreder count.
        function _renderBoardsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = tsoc.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'boards-',
                    extraClasses: ['boards-count-badge']
                });
            } else if (type === 'sort') {
                if (gBoardsCount.hasOwnProperty('boards-count-' + data)) {
                    rendered = gBoardsCount['boards-count-' + data];
                } else {
                    rendered = NaN;
                }
            }

            return rendered;
        }

        // Internal wrapper to provide the oreder count.
        function _renderBootsCount(data, type) {
            var rendered;

            rendered = null;
            if (type === 'display') {
                rendered = tsoc.countBadge({
                    data: data,
                    type: 'default',
                    idStart: 'boots-',
                    extraClasses: ['boots-count-badge']
                });
            } else if (type === 'sort') {
                if (gBootsCount.hasOwnProperty('boots-count-' + data)) {
                    rendered = gBootsCount['boots-count-' + data];
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
                rendered = tsoc.countBadge({
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
                    data: 'mach',
                    title: 'SoC',
                    type: 'string',
                    render: tsoc.renderSoc
                },
                {
                    data: 'mach',
                    title: 'Total Unique Labs',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderLabsCount
                },
                {
                    data: 'mach',
                    title: 'Total Unique Boards',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderBoardsCount
                },
                {
                    data: 'mach',
                    title: 'Total Boot Reports',
                    type: 'num',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderBootsCount
                },
                {
                    data: 'mach',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gSocsTable
                .data(response)
                .columns(columns)
                .order([0, 'asc'])
                .languageLengthMenu('SoCs per page')
                .rowURL('/soc/%(mach)s/')
                .rowURLElements(['mach'])
                .draw();
        }
    }

    function enableSearch() {
        gSocsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getSocsParse(response) {
        var results;

        // Internal filter function to check valid SoC values.
        function _isValidMach(data) {
            if (data && data !== null && data !== undefined) {
                return true;
            }
            return false;
        }

        // Convert a value into an object.
        function _toObject(data) {
            return {mach: data};
        }

        results = response.result;
        if (results) {
            results = results.filter(_isValidMach);
            results = results.map(_toObject);
        }

        setTimeout(getSocsDone.bind(null, results), 25);
        setTimeout(getBoardsCount.bind(null, results), 75);
        setTimeout(getBootsCount.bind(null, results), 100);
        setTimeout(getLabsCount.bind(null, results), 125);
        setTimeout(enableSearch, 175);
    }

    function getSocsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getSocs() {
        var deferred;

        deferred = request.get('/_ajax/boot/distinct/mach/', {});
        $.when(deferred)
            .fail(error.error, getSocsFail)
            .done(getSocsParse);
    }

    function loadAndSave() {
        window.addEventListener('beforeunload', function() {
            gSessionStorage
                .addObjects({
                    'boots_count': gBootsCount,
                    'boards_count': gBoardsCount,
                    'labs_count': gLabsCount
                })
                .save();
        });

        gSessionStorage.load();
        if (gSessionStorage.objects) {
            if (gSessionStorage.objects.hasOwnProperty('boots_count')) {
                gBootsCount = gSessionStorage.objects.boots_count;
            }
            if (gSessionStorage.objects.hasOwnProperty('boards_count')) {
                gBoardsCount = gSessionStorage.objects.boards_count;
            }
            if (gSessionStorage.objects.hasOwnProperty('labs_count')) {
                gLabsCount = gSessionStorage.objects.labs_count;
            }
        }
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

    loadAndSave();
    gSocsTable = table({
        tableId: 'socs-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getSocs, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
