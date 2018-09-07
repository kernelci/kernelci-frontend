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
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/const',
    'utils/table',
    'utils/date',
    'tables/release'
],
function($, init, format, html, error, request, appconst, table, buildt, tableRelease) {
    'use strict';
    var page = 'test-build';
    var mPage = 'release'; // for nav li class = active
    var gDateRange;
    var gBoard;
    var gPageLen = 100;
    var gSearchFilter;
    var gTableCount;
    var gBatchCountMissing;


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
    gTableCount = {};
    gBatchCountMissing = {};
    // Rate config
    var warning = 40;
    var success = 85;
    // To save data from backend
    var global_allCases;
    var global_results;
    // hash int format
    var hash = function(s) {
        var a = 1, c = 0, h, o;
        if (s) {
            a = 0;
            for (h = s.length - 1; h >= 0; h--) {
                o = s.charCodeAt(h);
                a = (a<<6&268435455) + o + (o<<14);
                c = a & 266338304;
                a = c!==0?a^c>>21:a;
            }
        }
        return String(a);
	}
    function _createOp(store) {
        var batchOps = [];
        store.forEach(function(element) {
            batchOps.push({
                method: 'GET',
                operation_id: hash(element.git_branch + element.kernel),
                resource: 'test_suite',
                query: 'git_branch=' + element.git_branch + '&kernel=' + element.kernel
            });
        });
        return batchOps;
    }

    function updateOrStageCount(elementId, count) {
        var element;
        element = document.getElementById(elementId);
        // If we do not have the element in the DOM, it means dataTables has
        // yet to add it.
        if(element) {
            html.replaceContent(element, document.createTextNode(format.number(count)));
        }else {
            html.replaceContent(element, document.createTextNode('?'));
        }
    }

    function updateOrStageRate(elementId, rate) {
        var element;
        element = document.getElementById(elementId);
        if (element) {
            if(rate == null)
                html.replaceContent(element, document.createTextNode('no data'));
            else
                html.replaceContent(element, document.createTextNode(rate.toFixed(2)+'%'));
        } else {
            html.replaceContent(element, document.createTextNode(format.number('?')));
        }
    }
    function updateOrStageData(elementId, data) {
        var element;
        element = document.getElementById(elementId);
        if (element) {
            html.replaceContent(element, document.createTextNode(data));
        } else {
            html.replaceContent(element, document.createTextNode('?'));
        }
    }
    function updateOrStageClass(element) {
        if (element) {
            html.replaceContent(element, document.createTextNode(data));
        } else {
            html.replaceContent(element, document.createTextNode('?'));
        }
    }
    /**
     * Function to be bound to the draw event of the table.
     * This is done to update dynamic elements that are not yet available
     * in the DOM due to the derefer rendering of dataTables.
    **/
    function updateCasesCount() {
        Object.keys(gBatchCountMissing).forEach(function(key) {
            updateOrStageCount(key, gBatchCountMissing[key]);
        });
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results;
        var id       = response.result[1].operation_id.split('cases-total-count-')[1]
        var ctotal   = response.result[1].result[ 0 ].count
        var csuccess = response.result[2].result[ 0 ].count
        var percentage = (( csuccess / ctotal * 100 ));
        $( '#rate-' + id ).html(percentage.toFixed(2) + '%')
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
            gJobsTable.invalidateColumn(2);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);
            // Bind a new function to the draw event of the table.
            gJobsTable.addDrawEvent(updateCasesCount);
        }
    }

    function getJobsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('jobs-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getFilterCasesCount(tree) {
        var filter;

        filter = '';
        if (gTableCount.hasOwnProperty('cases-success-count-' + tree)) {
            if (gTableCount['cases-success-count-' + tree]) {
                filter += 'successfulpass';
            }
        }

        if (gTableCount.hasOwnProperty('cases-fail-count-' + tree)) {
            if (gTableCount['cases-fail-count-' + tree]) {
                filter += 'failed';
            }
        }

        return filter;
    }

    function setCasesCount(allCases, data) {
        var batchOps = _createOp(data);
        var deferred = request.post( '/_backend/batch', JSON.stringify( { batch: batchOps } ) );
        $.when(deferred)
            .fail(function(batch) {
                data.forEach(function(element) {// git_branch + kernel
                    var idCountCases = hash(element.git_branch + element.kernel);
                    gJobsTable.addDrawEvent(updateOrStageData('cases-total-count-'+idCountCases, null));
                    gJobsTable.addDrawEvent(updateOrStageData('cases-success-count-'+idCountCases, null));
                    gJobsTable.addDrawEvent(updateOrStageData('cases-fail-count-'+idCountCases, null));
                    gJobsTable.addDrawEvent(updateOrStageData('cases-unknown-count-'+idCountCases, null));
                });
            })
            .done(function(batch) {
                batch.result.forEach(function(element) {// git_branch + kernel
                    var passCount=0;
                    var failCount=0;
                    var skipCount=0;
                    var totalCount=0;
                    allCases.result[0].result[0].result.forEach(function(all) {
                        element.result[0].result.forEach(function(suite) {
                            suite.test_case.forEach(function(caseID) {
                                if(all._id.$oid==caseID.$oid) {
                                    totalCount++;
                                    if(all.status=='PASS')
                                        passCount++;
                                    if(all.status=='FAIL')
                                        failCount++;
                                    return true;
                                }
                            });
                        });
                    });
                    var idCountCases = element.operation_id;
                    skipCount = totalCount - passCount - failCount;
                    // Set rate
                    updateOrStageCount('cases-total-count-'+idCountCases, totalCount);
                    gJobsTable.addDrawEvent(updateOrStageCount('cases-success-count-'+idCountCases, passCount));
                    gJobsTable.addDrawEvent(updateOrStageCount('cases-fail-count-'+idCountCases, failCount));
                    gJobsTable.addDrawEvent(updateOrStageCount('cases-unknown-count-'+idCountCases, skipCount));
                    var percentage = 100;
                    if(totalCount - skipCount > 0) {
                        percentage = (( passCount / ( totalCount - skipCount ) * 100 ));
                        gJobsTable.addDrawEvent(updateOrStageRate('rate-'+idCountCases, percentage));
                        if(percentage>=success)
                            gJobsTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-success  count-badge extra-margin" ));
                        if(percentage<success && percentage>=warning)
                            gJobsTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-warning  count-badge extra-margin" ));
                        if(percentage<warning)
                            gJobsTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-danger count-badge extra-margin" ));
                    }else{
                        gJobsTable.addDrawEvent(updateOrStageRate('rate-'+idCountCases, null));
                        gJobsTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge count-badge extra-margin" ));
                    }
                    // Row color
                    if(percentage==0) {
                        if(failCount==0)
                            gJobsTable.addDrawEvent($('#rate-'+idCountCases).parent().parent().addClass( " alert-warning" ));
                        else
                            gJobsTable.addDrawEvent($('#rate-'+idCountCases).parent().parent().addClass( " alert-danger" ));
                    }
                });
            });
	}

    function buildTable ( results ) {
                // Render Details
        function _renderDetails(href, type, data) {
            return tableRelease.renderDetails('/test-build/kernel/'+data.kernel+'/', type, 'See the test group related to build '+data.build_type);
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
    function getJobs() {
        var deferred = request.get(
            '/_ajax/build',
            {
                date_range: gDateRange,
                sort: 'created_on',
                sort_order: -1
            }
        );
        $.when(deferred)
            .fail(error.error, getJobsFail)
            .done(getDataDone);
    }
    getJobs();

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
