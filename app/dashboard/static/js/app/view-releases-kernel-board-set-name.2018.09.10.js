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
    setTimeout(getDataGroup, 10);

    // Parsing of parameters to url
    let params = ( new router( ) )
        .addRoute( page , page + '/$p' , { kernel : '[a-zA-Z0-9-_.]+' , board : '[a-zA-Z0-9-_.]+' , group_name : '[a-zA-Z0-9-_.]+' , set_name : '[a-zA-Z0-9-_.]+' } )
        .parse( )
        ;
    var logpath;
    var boot_log_html;
    var gTable = table({
        tableId           : 'release-table',
        tableDivId        : 'table-div',
        tableLoadingDivId : 'table-loading'
    })
    .order([0, 'asc'])
    .languageLengthMenu('Test case per page')

    function enableSearch(){
        gTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function initColumns(){
        return [
            {
                data   : 'test_case_name',
                title  : 'Test Case Name',
                type   : 'string'
            },
            {
                data   : 'test_case_id',
                title  : 'Test Case ID',
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
                data       : 'test_case_name',
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

    // updateDetails header
    function updateDetails(response) {
        var aNode,
            createdOn,
            job,
            domNode,
            gitBranch,
            gitCommit,
            gitDescribe,
            gitUrl,
            results,
            tooltipNode;
        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('loading-content', '?');
        } else {
            results = results[0];
            gitBranch = results.git_branch;
            gitCommit = results.git_commit;
            gitDescribe = results.git_describe;
            gitUrl = results.git_url;
            job=results.job;
            createdOn = new Date(results.created_on.$date);
            // SoC.
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for SoC ' + params.board);
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + params.board + '/');
            aNode.appendChild(document.createTextNode(params.board));
            tooltipNode.appendChild(aNode);
            html.replaceContent(document.getElementById('board'), tooltipNode);
            // Tree.
            html.replaceContent(
                document.getElementById('tree'),
                document.createTextNode(job)
            );
            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(gitBranch)
            );
            // Git describe.
            domNode = document.createElement('div');
            domNode.appendChild(document.createTextNode(params.kernel));
            html.replaceContent(
                document.getElementById('git-describe'),
                domNode
            );
            // Git URL.
            if (gitUrl) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitUrl);
                aNode.appendChild(document.createTextNode(gitUrl));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
            } else {
                if (gitUrl && gitUrl !== undefined) {
                    aNode = document.createTextNode(gitURL);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-url'), aNode);
            // Git commit.
            if (gitCommit) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitUrl);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
            } else {
                if (gitCommit && gitCommit !== null) {
                    aNode = document.createTextNode(gitCommit);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-commit'), aNode);
            // Date.
            domNode = document.createElement('time');
            domNode.setAttribute('datetime', createdOn.toISOString());
            domNode.appendChild(
                document.createTextNode(createdOn.toCustomISODate())
            );
            html.replaceContent(
                document.getElementById('job-date'),
                domNode
            );
        }
    }

    // Get test_case list
    function getDataCase(data){
        boot_log_html = data.result[0].boot_log_html;
        logpath = '/test/group/'+data.result[0]._id.$oid+'/'+data.result[0].job+'/'+data.result[0].git_branch+'/'+data.result[0].kernel+'/'+data.result[0].arch+'/'+data.result[0].defconfig_full+'/'+data.result[0].lab_name+'/'+data.result[0].boot_log_html;
        // Set header
        updateDetails(data);
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
            resource: 'test_case',
            query: 'field=_id&field=name&field=test_case'
        });
        var deferred = request.post( '/_backend/batch', JSON.stringify( { batch: batchOpsset } ) );
        $.when(deferred)
            .fail(table.loadingError)
            .done(function(allSet){
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
                    .done(function(allCases){
                        var store = [];
                        data.result.forEach(function(element){
                            element.test_case.forEach(function(e){
                                allCases.result[0].result[0].result.forEach(function(caseID){
                                    if(caseID._id.$oid==e.$oid){
                                        // Get status
                                        if(caseID.status == 'FAIL'){
                                            var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-danger label-status"><i class="fa fa-exclamation-triangle"></i></span></span>';
                                        }else {
                                            if(caseID.status == 'PASS')
                                                var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-success label-status"><i class="fa fa-check"></i></span></span>';
                                            else
                                                var sta='<span rel="tooltip" data-toggle="tooltip" title="'+caseID.status+'"><span class="label label-warning label-status"><i class="fa fa-exclamation-triangle"></i></span></span>';
                                        }
                                        // Get set_name
                                        allSet.result[0].result[0].result.forEach(function(setID){
                                            setID.test_case.forEach(function(setcaseID){
                                                if(setcaseID.$oid == e.$oid){
                                                    if(setID.name == params.set_name)
                                                        store.push({
                                                            test_case_name: caseID.name,
                                                            test_case_id: caseID._id.$oid,
                                                            status: sta,
                                                            measured: function() {
                                                                if(!caseID.measurements['value'])
                                                                    return '&empty;';
                                                                else
                                                                    return caseID.measurements['value']
                                                            },
                                                            units: function(){
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

    // Get test_group list
    function getDataGroup(){
        var page_header =  '<div class="col-xs-12 col-sm-12 col-md-7 col-lg-7"><dl class="dl-horizontal"><dt>Kernel/Version</dt><dd>'+params.kernel+'</dd><dt>Board</dt><dd>'+params.board+'</dd><dt>Test group name</dt><dd>'+params.group_name+'</dd><dt>Test set name</dt><dd>'+params.set_name+'</dd><dt>Tree/Job</dt><dd class="loading-content" id="tree"></dd><dt>Git branch</dt><dd class="loading-content" id="git-branch"></dd><dt>Git describe</dt><dd class="loading-content" id="git-describe"></dd><dt>Git URL</dt><dd class="loading-content" id="git-url"></dd><dt>Git commit</dt><dd class="loading-content" id="git-commit"></dd><dt>Date</dt><dd class="loading-content" id="job-date"></dd></dl></div>';
        $(".page-header").parent().html($(".page-header").parent().html() + '<br>' + page_header);
        let param  = {
            kernel: params.kernel,
            board: params.board,
            name: params.group_name
        };
        request.api(
            'tests/group/',
            param,
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
            .rowURL( logpath )
			.draw()
            ;
    }
});
