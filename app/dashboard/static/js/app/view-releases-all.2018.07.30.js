/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 *
 * Copyright (c) 2017, 2018 BayLibre, SAS.
 * Author: Loys Ollivier <lollivier@baylibre.com>
 *
 * Copyright (c) 2018 BayLibre, SAS.
 * Author: Oussema Daoud <odaoud@baylibre.com>
 * 
 * Copyright (C) Collabora Limited 2019
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
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
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/const',
    'utils/table',
    'tables/release'
],
function($, init, html, error, request, appconst, table, tableRelease) {
    'use strict';
    var mPage = 'release'; // for nav li class = active
    var gPageLen = 100;
    var gSearchFilter;

    var [ gDateRange , gSearchFilter , gPageLen ] = init.init( mPage );

    if (document.getElementById('board') !== null) {
        gBoard = document.getElementById('board').value;
    }

    var gJobsTable = table({
        tableId: 'releases-table',
        tableDivId: 'releases-table-div',
        tableLoadingDivId: 'table-loading'
    });

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = 100;
    gSearchFilter = null;
    
    // To save data from backend
    var global_allCases;
    var global_results;

    function getBuildFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('jobs-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function buildTable ( results ) {
                // Render Details
        function _renderDetails(href, type, data) {
            return tableRelease.renderDetails('/test-build/testgroup/'+data.build_id.$oid+'/', type, 'See the test group related to build '+data.build_type);
        }
        var columns = [
            {
                data: 'build_type',
                title: 'Build Type',
                type: 'string',
                searchable: true,
                orderable: true,
                className: 'tree-column'
            },
            {
                data: 'arch',
                title: 'Arch',
                type: 'string',
                searchable: true,
                orderable: true,
                className: 'tree-column'
            },
            {
                data: 'git_branch',
                title: 'Branch',
                type: 'string',
                searchable: true,
                orderable: true,
                className: 'branch-column'
            },
            {
                data: 'kernel',
                title: 'Version',
                type: 'string',
                searchable: true,
                orderable: true,
                className: 'branch-column'
            },
            {
                data: 'status',
                title: 'Status',
                type: 'string',
                className: 'pull-center',
            },
            {
                data: 'created_on',
                title: 'Date',
                type: 'date',
                className: ' date-column pull-center',
                render: tableRelease.renderDate
            },
            {
                data: 'kernel',
                type: 'string',
                orderable: false,
                searchable: false,
                className: 'select-column pull-center',
                render: _renderDetails
            }
        ];
        gJobsTable
            .data(results)
            .columns(columns)
			.order([4, 'desc'])
            .rowURLElements(['kernel'])
            .languageLengthMenu('test by build per page')
            .draw()

        gJobsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getDataDone( response ) {
        var store = [];
        response.result.forEach(function(buildItem) {           
            store.push({
                build_id: buildItem._id,
                job: buildItem.job,
                arch: buildItem.arch,
                git_branch: buildItem.git_branch,
                build_type: buildItem.build_type,
                kernel: buildItem.kernel,
                created_on: buildItem.created_on,
                status: buildItem.status
            });
        });
        html.removeElement(document.getElementById('table-loading'));
        buildTable(store);
    }
    function getBuilds() {
        var deferred = request.get(
            '/_ajax/build',
            {
                date_range: gDateRange,
                sort: 'created_on',
                sort_order: -1
            }
        );
        $.when(deferred)
            .fail(error.error, getBuildFail)
            .done(getDataDone);
    }
    console.log('hereeee');
    getBuilds();

    /**
     *  Relode again Tests Results and Rate columns
    **/

    // Paginate button - on click
    $(document).on('click','.paginate_button ', function() {
        setCasesCount(global_allCases, global_results);
    });
    // Number row select/option - on change
    $(document).on('change','.form-control', function() {
        setCasesCount(global_allCases, global_results);
    });
    // Sort event - on click
    $(document).on('click','th', function() {
        setCasesCount(global_allCases, global_results);
    });
    // Filter input - on keyup
    $(document).on('keyup','.form-control', function() {
        setCasesCount(global_allCases, global_results);
    });
});
