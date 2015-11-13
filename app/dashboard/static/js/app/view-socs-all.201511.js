/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/soc'
], function($, init, error, request, table, html, appconst, tsoc) {
    'use strict';
    var gDateRange,
        gSocsTable,
        gPageLen,
        gSearchFilter;

    document.getElementById('li-soc').setAttribute('class', 'active');
    gDateRange = appconst.MAX_DATE_RANGE;

    function _isValidMach(data) {
        if (data.hasOwnProperty('mach')) {
            if (data.mach) {
                return true;
            }
        }
        return false;
    }

    function getSocsDone(response) {
        var columns,
            results,
            unfilteredResults;

        // Internal wrapper to provide the href.
        function _renderDetails(data, type) {
            return tsoc.renderDetails('/soc/' + data + '/', type);
        }

        unfilteredResults = response.result;
        if (unfilteredResults.length === 0) {
            html.replaceContent(
                document.getElementById('table-loading'),
                html.errorDiv('No data found.'));
        } else {
            results = unfilteredResults.filter(_isValidMach);

            columns = [
                {
                    data: 'mach',
                    title: 'SoC',
                    render: tsoc.renderSoc
                },
                {
                    data: 'mach',
                    title: 'Total Unique Boards',
                    className: 'pull-center',
                    render: ''
                },
                {
                    data: 'mach',
                    title: 'Total Boot Reports',
                    className: 'pull-center',
                    render: ''
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
                .data(results)
                .columns(columns)
                .order([0, 'asc'])
                .languageLengthMenu('SoCs per page')
                .noIdURL(true)
                .draw();

            gSocsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getSocs() {
        var deferred;

        deferred = request.get(
            '/_ajax/boot',
            {
                aggregate: 'mach',
                sort: 'created_on',
                sort_order: -1,
                date_range: gDateRange,
                field: [
                    'mach'
                ]
            }
        );
        $.when(deferred)
            .fail(error.error)
            .done(getSocsDone);
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

    gSocsTable = table({
        tableId: 'socs-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading',
        disableSearch: true
    });
    getSocs();
});
