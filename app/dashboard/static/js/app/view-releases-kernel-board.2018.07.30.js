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
    'utils/router',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/release'
],
function($, init, router, format, error, request, table, html, appconst, trelease) {
    'use strict';
    var page = 'test-build';
    var mPage = 'release'; // for nav li class = active
    var [ gDateRange , gSearchFilter , gPageLen ] = init.init( mPage );
    setTimeout(getDataSuite, 10);

    // Parsing of parameters to url
    let params = ( new router( ) )
        .addRoute( page , page + '/$p' , { kernel : '[a-zA-Z0-9-_.]+' , board : '[a-zA-Z0-9-_.]+' } )
        .parse( )
    ;
    // --------------------------------------------------------------------------
    var gTable = table({
        tableId           : 'release-table',
        tableDivId        : 'table-div',
        tableLoadingDivId : 'table-loading'
    }).order              ([0, 'asc'])
        .languageLengthMenu ('Cases per page')
        .rowURL             ( '/test/suite/%(test_suite_id)s/%(job)s/%(git_branch)s/'+params.kernel+'/%(arch)s/%(defconfig_full)s/%(lab_name)s/%(boot_log_html)s' )
        .rowURLElements     (['test_suite_id' , 'job' , 'git_branch' , 'arch' , 'defconfig_full' , 'lab_name' , 'boot_log_html'])

    // --------------------------------------------------------------------------

    function enableSearch() {
        gTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function initColumns() {
        return [
            {
                data   : 'test_suite_name',
                title  : 'Test Suite',
                type   : 'string'
            },
            {
                data   : 'test_set_name',
                title  : 'Test Set',
                type   : 'string'
            },
            {
                data   : 'test_case_name',
                title  : 'Test Case',
                type   : 'string'
            },
            {
                data   : 'status',
                title  : 'Status',
                className: 'pull-center',
                type   : 'string'
            },
            {
                data   : 'measured',
                title  : 'Measured',
                className: 'pull-center',
                type   : 'string'
            },
            {
                data   : 'units',
                title  : 'Units',
                className: 'pull-center',
                type   : 'string'
            },
            {
                data       : 'test_suite_id',
                title      : 'Log',
                type       : 'string',
                searchable : false,
                orderable  : false,
                className  : 'select-column pull-center',
                render     : ( data, type ) => {
                    return trelease.renderDetails('', type, '- Log file -');
                }
            }
        ];
    }

    // Get test_case list
    function getDataCase(data) {
        let param  = {
            kernel: params.kernel,
            board: params.board,
            field: 'kernel',
            field: 'board'
        };
        var batchOpsset = [];
        batchOpsset.push({
            method: 'GET',
            operation_id: 'getallSet',
            resource: 'test_set',
            query: 'field=_id&field=name&field=test_case'
        });
        var deferred = request.post( '/_backend/batch', JSON.stringify( { batch: batchOpsset } ) );
        $.when(deferred)
            .fail(table.loadingError)
            .done(function(allSet) {
                // *****************************************************
                // create batchOps *************************************
                // to optimize *****************************************
                // add more filter (too much data for this batch)*******
                var batchOps = [];
                batchOps.push({
                    method: 'GET',
                    operation_id: 'getallCases',
                    resource: 'test_case',
                    query: 'field=status&field=name&field=measurements'
                });
                // *****************************************************
                var deferred = request.post( '/_backend/batch', JSON.stringify( { batch: batchOps } ) );
                $.when(deferred)
                    .fail(table.loadingError)
                    .done(function(allCases) {
                        var store = [];
                        data.result.forEach(function(element) {
                            element.test_case.forEach(function(e) {
                                allCases.result[0].result[0].result.forEach(function(caseID) {
                                    if(caseID._id.$oid==e.$oid) {
                                        // Get status
                                        if(caseID.status == 'FAIL') {
                                            var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-danger label-status"><i class="fa fa-exclamation-triangle"></i></span></span>';
                                        }else {
                                            if(caseID.status == 'PASS')
                                                var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-success label-status"><i class="fa fa-check"></i></span></span>';
                                            else
                                                var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-warning label-status"><i class="fa fa-exclamation-triangle"></i></span></span>';
                                        }
                                        // Get set_name
                                        allSet.result[0].result[0].result.forEach(function(setID) {
                                            setID.test_case.forEach(function(setcaseID) {
                                                if(setcaseID.$oid == e.$oid) {
                                                    store.push({
                                                        test_suite_name: element.name,
                                                        test_set_name: setID.name,
                                                        test_case_name: caseID.name,
                                                        test_suite_id: element._id.$oid,
                                                        job: element.job,
                                                        git_branch: element.git_branch,
                                                        arch: element.arch,
                                                        defconfig_full: element.defconfig_full,
                                                        lab_name: element.lab_name,
                                                        boot_log_html: element.boot_log_html,
                                                        status: sta,
                                                        measured: function() {
                                                            if(!caseID.measurements['value'])
                                                                return '&empty;';
                                                            else
                                                                return caseID.measurements['value']
                                                        },
                                                        units: function() {
                                                            if(!caseID.measurements['value'])
                                                                return ' ';
                                                            else
                                                                return caseID.measurements['unit']
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                        getDataDone(store);
                    });
            });
    }

    // Get test_suite list
    function getDataSuite() {
        let param  = {
            kernel: params.kernel,
            board: params.board
        };
        request.api(
            'tests/suites/',
            params,
            getDataCase,
            table.loadingError
        );
    }
    /**
     * @param store
    **/
    function getDataDone(store) {
        gTable
            .data(store)
            .columns(initColumns())
            .draw()
            ;
    }
});
