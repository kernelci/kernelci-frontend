/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/soc',
    'utils/storage'
], function($, b, init, error, request, table, html, appconst, tsoc, storage) {
    'use strict';
    var gBatchCountMissing,
        gBoardsCount,
        gBootsCount,
        gDateRange,
        gDrawEventBound,
        gPageLen,
        gSearchFilter,
        gSessionStorage,
        gSocsTable;

    document.getElementById('li-soc').setAttribute('class', 'active');
    gDateRange = appconst.MAX_DATE_RANGE;
    gBootsCount = {};
    gBoardsCount = {};
    gBatchCountMissing = {};
    // Used to check if the table draw event function has already been boud.
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
                element, document.createTextNode(b.formatNumber(count)));

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
        html.replaceByClassTxt('boots-count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateBootsCount(result) {
            var count,
                opId;

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
        var batchOps,
            deferred,
            soc,
            queryStr;

        if (response.length > 0) {
            batchOps = [];
            queryStr = 'mach=';

            response.forEach(function(value) {
                soc = value.mach;
                batchOps.push({
                    method: 'GET',
                    operation_id: 'boots-count-' + soc,
                    resource: 'count',
                    document: 'boot',
                    query: queryStr + soc
                });
            });

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBoardsCountFail() {
        html.replaceByClassHTML('boards-count-badge', '&infin;');
    }

    function getBoardsCountDone(response) {
        var results;

        // Internally used to parse the results.
        function _updateBoardsCount(result) {
            var count,
                opId;

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
        var batchOps,
            deferred,
            soc,
            queryStr;

        if (response.length > 0) {
            batchOps = [];
            queryStr = 'mach=';

            response.forEach(function(value) {
                soc = value.mach;
                batchOps.push({
                    method: 'GET',
                    operation_id: 'boards-count-' + soc,
                    resource: 'boot',
                    distinct: 'board',
                    query: queryStr + soc
                });
            });

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

        if (response.length === 0) {
            html.replaceContent(
                document.getElementById('table-loading'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'mach',
                    title: 'SoC',
                    render: tsoc.renderSoc
                },
                {
                    data: 'mach',
                    title: 'Total Unique Boards',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderBoardsCount
                },
                {
                    data: 'mach',
                    title: 'Total Boot Reports',
                    searchable: false,
                    className: 'pull-center',
                    render: _renderBootsCount
                },
                {
                    data: 'mach',
                    title: '',
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
                .noIdURL(true)
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
            if (data.hasOwnProperty('mach') && data.mach) {
                return true;
            }
            return false;
        }

        results = response.result;
        if (results) {
            results = results.filter(_isValidMach);
        }

        getSocsDone(results);
        getBoardsCount(results);
        getBootsCount(results);

        enableSearch();
    }

    function getSocs() {
        var deferred;

        deferred = request.get(
            '/_ajax/boot',
            {
                aggregate: 'mach',
                date_range: gDateRange,
                field: [
                    'mach'
                ],
                sort: 'mach',
                sort_order: 1
            }
        );

        $.when(deferred)
            .fail(error.error)
            .done(getSocsParse);
    }

    function loadAndSave() {
        window.addEventListener('beforeunload', function() {
            gSessionStorage
                .addObjects({
                    'boots_count': gBootsCount,
                    'boards_count': gBoardsCount
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
        }
    }

    init.hotkeys();
    init.tooltip();

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
        tableLoadingDivId: 'table-loading',
        disableSearch: true
    });
    getSocs();
});
