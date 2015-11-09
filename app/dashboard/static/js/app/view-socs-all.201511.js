/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/const',
    'tables/common'
], function($, init, error, request, tables, html, appconst, tcommon) {
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
                    title: 'SoC'
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    className: 'arch-column'
                },
                {
                    data: 'board',
                    title: 'Latest Board'
                },
                {
                    data: 'lab_name',
                    title: 'Lab',
                    className: 'lab-column'
                },
                {
                    data: 'job',
                    title: 'Latest Tree',
                    className: 'tree-column'
                },
                {
                    data: 'kernel',
                    title: 'Latest Kernel',
                    className: 'kernel-column'
                },
                {
                    data: 'defconfig_full',
                    title: 'Latest Defconfig',
                    className: 'defconfig-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    className: 'date-column pull-center',
                    render: tcommon.renderTableDate
                }
            ];

            gSocsTable
                .tableData(results)
                .columns(columns)
                .order([7, 'desc'])
                .menu('SoCs per page')
                .noIDUrl(true)
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
                    'arch',
                    'board',
                    'created_on',
                    'defconfig_full',
                    'job',
                    'kernel',
                    'lab_name',
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

    gSocsTable = tables(['socs-table', 'table-loading', 'table-div'], true);
    getSocs();
});
