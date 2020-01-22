/*! 
 * Copyright (C) Collabora Limited 2020
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
 *
 * kernelci dashboard.
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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/job',
    'utils/format'
], function($, init, e, r, table, html, appconst, resultt, format) {
    'use strict';
    var gBatchCountMissing;
    var gTree;
    var gBranch;
    var gKernel;
    var gDateRange;
    var gDrawEventBound;
    var gTestPlansTable;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
    }, 15);

    // Used to check if the table draw event function has already been bound.
    // In order not to bind it multiple times.
    gDrawEventBound = false;
    gBatchCountMissing = {};

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

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
    function updateTestPlansTable() {
        var key;
        
        if (Object.keys(gBatchCountMissing).length > 0) {
            for (key in gBatchCountMissing) {

                if (gBatchCountMissing.hasOwnProperty(key)) {
                    updateOrStageCount(key, gBatchCountMissing[key]);
                }
            }
        }
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var results;
        function parseBatchData(data) {
            updateOrStageCount(
                data.operation_id, parseInt(data.result[0].count, 10));
        }

        results = response[0].result;
        if (results.length > 0) {
            results.forEach(parseBatchData);
            if (!gDrawEventBound) {
                gDrawEventBound = true;
                gTestPlansTable.addDrawEvent(updateTestPlansTable);
            }
        }

        // Perform the table search now, after completing all operations.
        gTestPlansTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBatchCount(response) {
        var batchOps;
        var plan;
        var deferred;
        var job;
        var kernel;
        var opId;
        var opIdTail;
        var qHead;
        var qStr;
        var results;

        function createBatchOp(result) {
            job = result.job;
            kernel = result.kernel;
            plan = result.name;

            qStr = 'job=';
            qStr += job;
            qStr += '&kernel=';
            qStr += kernel;
            qStr += '&name=';
            qStr += plan;

            opIdTail = job;
            opIdTail += '-';
            opIdTail += plan;

            // Get total tests count.
            opId = 'test-total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qStr
            });

            // Get successful tests count.
            opId = 'test-success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead
            });

            // Get regressions count.
            opId = 'test-fail-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_regression',
                query: qStr
            });

            // Get unknown test reports count.
            opId = 'test-unknown-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&status=SKIP&regression_id=null&';
            qHead += qStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(createBatchOp);

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));
        }

        return deferred;
    }

    function getTestPlansFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getTestPlansDone(response) {
        var columns;
        var results;

        /**
         * Create the table column title for the builds count.
        **/
        function _testPlanColumTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Total/Successful/Failed/Unknown build reports for latest test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type, object) {
            var href = '/testcases/';
            href += data;
            href += '/plan/';
            href += object.name;
            href += '/';
            return resultt.renderDetails(href, type);
        }

        function _renderTestCount(data, type, object) {
            var href;
            var nodeId;

            href = '/build/';
            href += data;
            href += '/plan/';
            href += object.name;
            href += '/kernel/';
            href += object.kernel;
            href += '/';

            nodeId = data;
            nodeId += '-';
            nodeId += object.name;
            return resultt.renderTestCount({
                data: nodeId,
                type: type,
                href: href
            });
        }

        function _renderTree(data, type) {
            var href = '/testcases/';
            href += data;
            href += '/';
            return resultt.renderTree(data, type, href);
        }

        results = response.result;
        getBuildDetails(results);

        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No test plan data available.'));
        } else {
            columns = [
                {
                    data: 'name',
                    title: 'Test Plan',
                    type: 'string',
                    className: 'tree-column',
                    render: _renderTree
                },
                {
                    data: '_id.$oid',
                    title: 'Test Plan ID',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderTree
                },
                {
                    data: 'test_cases.length',
                    title: 'Total Test Cases',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderTree
                },
                {
                    data: 'job',
                    title: _testPlanColumTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: _renderTestCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: resultt.renderDate
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];
            gTestPlansTable
                .data(results)
                .columns(columns)
                .order([2, 'desc'])
                .languageLengthMenu('test plan per page')
                .rowURL('/testcases/%(job)s/plan/%(name)s/')
                .rowURLElements(['job', 'name'])
                .draw();
        }
    }

    // A deferred version getTestPlansDone(of getTestPlansDone.
    function getTestPlansDoneD(response) {
        var deferred;
        deferred = $.Deferred();
        deferred.resolve(getTestPlansDone(response));

        return deferred.promise();
    }

    function getTestPlansDoneMulti(response) {
        $.when(getBatchCount(response), getTestPlansDoneD(response))
            .fail(e.error, getBatchCountFail)
            .done(getBatchCountDone);
    }

    function getBuildDetails(results) {

        if (results[0].compiler) {
            html.replaceContent(
                document.getElementById('compiler'),
                document.createTextNode(results[0].compiler));
        } else {
            html.replaceContent(
                document.getElementById('compiler'), html.nonavail());
        }

        if (results[0].job) {
            html.replaceContent(
                document.getElementById('tree'),
                document.createTextNode(results[0].job));
        } else {
            html.replaceContent(
                document.getElementById('tree'), html.nonavail());
        }

        if (results[0].git_branch) {
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(results[0].git_branch));
        } else {
            html.replaceContent(
                document.getElementById('git-branch'), html.nonavail());
        }

        if (results[0].git_describe) {
            html.replaceContent(
                document.getElementById('git-describe'),
                document.createTextNode(results[0].git_describe));
        } else {
            html.replaceContent(
                document.getElementById('git-describe'), html.nonavail());
        }

        if (results[0].git_url) {
            html.replaceContent(
                document.getElementById('git-url'),
                document.createTextNode(results[0].git_url));
        } else {
            html.replaceContent(
                document.getElementById('git-url'), html.nonavail());
        }

        if (results[0].git_commit) {
            html.replaceContent(
                document.getElementById('git-commit'),
                document.createTextNode(results[0].git_commit));
        } else {
            html.replaceContent(
                document.getElementById('git-commit'), html.nonavail());
        }

        if (results[0].status) {
            html.replaceContent(
                document.getElementById('git-status'),
                document.createTextNode(results[0].git_status));
        } else {
            html.replaceContent(
                document.getElementById('git-status'), html.nonavail());
        }

        if (results[0].cross_compile) {
            html.replaceContent(
                document.getElementById('cross-compile'),
                document.createTextNode(results[0].cross_compile));
        } else {
            html.replaceContent(
                document.getElementById('cross-compile'), html.nonavail());
        }

        if (results[0].defconfig) {
            html.replaceContent(
                document.getElementById('build-defconfig'),
                document.createTextNode(results[0].defconfig));
        } else {
            html.replaceContent(
                document.getElementById('build-defconfig'), html.nonavail());
        }

        if (results[0].compiler_version) {
            html.replaceContent(
                document.getElementById('compiler-version'),
                document.createTextNode(results[0].compiler_version));
        } else {
            html.replaceContent(
                document.getElementById('compiler-version'),
                html.nonavail());
        }

        if (results[0].compiler_version_full) {
            html.replaceContent(
                document.getElementById('compiler-version-full'),
                document.createTextNode(results[0].compiler_version_full));
        } else {
            html.replaceContent(
                document.getElementById('compiler-version-full'),
                html.nonavail());
        }

        if (results[0].arch) {
            html.replaceContent(
                document.getElementById('build-arch'),
                document.createTextNode(results[0].arch));
        } else {
            html.replaceContent(
                document.getElementById('build-arch'), html.nonavail());
        }

        html.replaceContent(
            document.getElementById('build-errors'),
            document.createTextNode(results[0].errors));

        html.replaceContent(
            document.getElementById('build-warnings'),
            document.createTextNode(results[0].warnings));
    }

    function getTestPlans() {
        var data;
        var deferred;
        data = {
            tree: gTree,
            git_branch: gBranch,
            //distinct: 'name',
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
        };
        deferred = r.get('/_ajax/test/group', data);
        $.when(deferred)
            .fail(e.error, getTestPlansFail)
            .done(getTestPlansDoneMulti);
    }

    if (document.getElementById('tree-name') !== null) {
        gTree = document.getElementById('tree-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gTestPlansTable = table({
        tableId: 'testplantable',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getTestPlans, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
