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
function($, init, router, format, error, request, table, html, appconst, trelease, ttest) {
    'use strict';
    var page = 'test-build';
    var mPage = 'release'; // for nav li class = active
    var [ gDateRange , gSearchFilter , gPageLen ] = init.init( mPage );
    setTimeout(getDataSuite, 10);

    // Parsing of parameters to url
    let params = ( new router( ) )
        .addRoute( page , page + '/$p' , { kernel : '[a-zA-Z0-9-_.]+' , board : '[a-zA-Z0-9-_.]+' , suite_name : '[a-zA-Z0-9-_.]+' } )
        .parse( )
        ;

    // --------------------------------------------------------------------------
    var gTable = table({
        tableId           : 'release-table',
        tableDivId        : 'table-div',
        tableLoadingDivId : 'table-loading'
    }).order              ([0, 'asc'])
        .languageLengthMenu ('Test set per page')
        .rowURL             ( '/'+ page + '/kernel/'+ params.kernel +'/board/'+ params.board+'/suite_name/'+params.suite_name+'/set_name/%(test_set_name)s/')
        .rowURLElements     (['test_set_name'])

    // --------------------------------------------------------------------------

    function enableSearch(){
        gTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }
    var warning = 40;
    var success = 85;

    //hash int format
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

    function updateOrStageCount(elementId, count) {
        var element;
        element = document.getElementById(elementId);
        // If we do not have the element in the DOM, it means dataTables has
        // yet to add it.
        if(element){
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
    function _renderCasesCount(name, type , data){
        return trelease.renderCasesCount(hash(data.test_set_name), type, ''/* , 'board/'+data.board+'/suite/name/'+name */);
    }
    function _renderRate(name, type , data){
        return trelease.renderRateSetName(hash(data.test_set_name), type, ''/* , 'board/'+data.board+'/suite/name/'+name */);
    }
    function _renderDetails(href, type, data) {
        return trelease.renderDetails('/test-build/kernel/'+params.kernel+'/board/'+params.board+'/suite_name/'+params.suite_name+'/set_name/'+data.test_set_name+'/', type, 'Details for '+data.test_set_name+' test set name');
    }

    function initColumns() {
        return [
            {
                data   : 'test_set_name',
                title  : 'Test Set Name',
                type   : 'string'
            },
            {
                data   : 'test_set_name',
                title  : 'Test Case Count',
                type   : 'string',
                searchable : false,
				orderable  : false,
                render: _renderCasesCount
            },
            {
                data: 'test_set_name',
                title: 'Pass Rate',
                type: 'string',
                className: 'date-column pull-center',
                searchable : false,
				orderable  : false,
                render: _renderRate
            },
            {
                data: 'test_set_name',
                title: 'Details',
                type: 'string',
                orderable: false,
                searchable: false,
                className: 'select-column pull-center',
                render: _renderDetails
            }
        ];
    }

    //updateDetails header
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
    //Get test_case list
    function getDataCase(data){
        //Set header
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
            resource: 'test_set',
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
                    query: 'field=status&field=test_set_id'
                });
                // *****************************************************
                var deferred = request.post( '/_backend/batch', JSON.stringify( { batch: batchOps } ) );
                $.when(deferred)
                    .fail(table.loadingError)
                    .done(function(allCases){
                        var store = [];
                        var UniqueSetName = [];
                        var caseCount = [];
                        data.result.forEach(function(element){
                            element.test_case.forEach(function(e){
                                allCases.result[0].result[0].result.forEach(function(caseID){
                                    if(caseID._id.$oid==e.$oid){
                                        //get set_name
                                        var passCount=0;
                                        var failCount=0;
                                        var skipCount=0;
                                        var totalCount=0;
                                        allSet.result[0].result[0].result.forEach(function(setID){
                                            setID.test_case.forEach(function(setcaseID){
                                                if(setcaseID.$oid == e.$oid){
                                                    if(!UniqueSetName.includes(setID.name)){
                                                        UniqueSetName.push(setID.name);
                                                        caseCount[setID.name+'-totalCount']=0;
                                                        caseCount[setID.name+'-passCount']=0;
                                                        caseCount[setID.name+'-failCount']=0;
                                                        caseCount[setID.name+'-skipCount']=0;
                                                        //store
                                                        store.push({
                                                            test_set_name: setID.name,
                                                            test_case_name: caseID.name
                                                        });
                                                    }
                                                    //gat status
                                                    caseCount[setID.name+'-totalCount']++;
                                                    if(caseID.status == 'FAIL'){
                                                        caseCount[setID.name+'-failCount']++;
                                                    }
                                                    if(caseID.status == 'PASS'){
                                                        caseCount[setID.name+'-passCount']++;
                                                    }
                                                    caseCount[setID.name+'-skipCount'] = caseCount[setID.name+'-totalCount']-caseCount[setID.name+'-passCount']-caseCount[setID.name+'-failCount'];
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        });
                        getDataDone(store);
                        UniqueSetName.forEach(function(setName){
                            var idCountCases = hash(setName);
                            var totalCount = caseCount[setName+'-totalCount'];
                            var passCount = caseCount[setName+'-passCount'];
                            var failCount = caseCount[setName+'-failCount'];
                            var skipCount = caseCount[setName+'-skipCount'];
                            //set rate
                            gTable.addDrawEvent(updateOrStageCount('total-count-'+idCountCases, totalCount));
                            gTable.addDrawEvent(updateOrStageCount('success-count-'+idCountCases, passCount));
                            gTable.addDrawEvent(updateOrStageCount('fail-count-'+idCountCases, failCount));
                            gTable.addDrawEvent(updateOrStageCount('unknown-count-'+idCountCases, skipCount));
                            var percentage = 100;
                            if(totalCount - skipCount > 0){
                                percentage = (( passCount / ( totalCount - skipCount ) * 100 )); 
                                gTable.addDrawEvent(updateOrStageRate('rate-'+idCountCases, percentage));
                                if(percentage>=success)
                                    gTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-success  count-badge extra-margin" ));
                                if(percentage<success && percentage>=warning)
                                    gTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-warning  count-badge extra-margin" ));
                                if(percentage<warning)
                                    gTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge alert-danger count-badge extra-margin" ));
                            }else{
                                gTable.addDrawEvent(updateOrStageRate('rate-'+idCountCases, null));
                                gTable.addDrawEvent($('#rate-'+idCountCases).addClass( "badge count-badge extra-margin" ));
                            }
                            // row color
                            if(percentage==0){
                                if(failCount==0)
                                    gTable.addDrawEvent($('#rate-'+idCountCases).parent().parent().addClass( " alert-warning" ));
                                else
                                    gTable.addDrawEvent($('#rate-'+idCountCases).parent().parent().addClass( " alert-danger" ));
                            }
                        });
                    });
            });
    }

    //Get test_suite list
    function getDataSuite(){
        var page_header =  '<div class="col-xs-12 col-sm-12 col-md-7 col-lg-7"><dl class="dl-horizontal"><dt>Kernel/Version</dt><dd>'+params.kernel+'</dd><dt>Board</dt><dd>'+params.board+'</dd><dt>Test suite name</dt><dd>'+params.suite_name+'</dd><dt>Tree/Job</dt><dd class="loading-content" id="tree"></dd><dt>Git branch</dt><dd class="loading-content" id="git-branch"></dd><dt>Git describe</dt><dd class="loading-content" id="git-describe"></dd><dt>Git URL</dt><dd class="loading-content" id="git-url"></dd><dt>Git commit</dt><dd class="loading-content" id="git-commit"></dd><dt>Date</dt><dd class="loading-content" id="job-date"></dd></dl></div>';
        $(".page-header").parent().html($(".page-header").parent().html() + '<br>' + page_header);
        let param  = {
            kernel: params.kernel,
            board: params.board,
            name: params.suite_name
        };
        request.api(
            'tests/suites/',
            param,
            getDataCase,
            table.loadingError
        );
    }
    /**
     * @param store
     */
    function getDataDone(store) {
        gTable
            .data(store)
            .columns(initColumns())
            .draw()
            ;
    }
});
