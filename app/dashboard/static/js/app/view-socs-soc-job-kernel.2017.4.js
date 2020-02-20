/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2020 Collabora Limited
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
define([
    'jquery',
    'utils/init',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/urls',
    'charts/passpie',
    'utils/table',
    'tables/test',
    'URI'
], function(
        $,
        init,
        html,
        error,
        request,
        urls, 
        chart, 
        table, 
        ttest,
        URI) {
    'use strict';
    var gFileServer,
        gJob,
        gKernel,
        gResultFilter,
        gSearchFilter,
        gSoc,
        gPlansTable;

    document.getElementById('li-soc').setAttribute('class', 'active');

    function updateDetails(results) {
        var aNode,
            createdOn,
            domNode,
            gitBranch,
            gitCommit,
            gitURL,
            gitURLs,
            tooltipNode;

        gitBranch = results.git_branch;
        gitCommit = results.git_commit;
        gitURL = results.git_url;
        createdOn = new Date(results.created_on.$date);

        gitURLs = urls.translateCommit(gitURL, gitCommit);

        // SoC.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Details for SoC ' + gSoc);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/soc/' + gSoc + '/');
        aNode.appendChild(document.createTextNode(gSoc));
        tooltipNode.appendChild(aNode);

        html.replaceContent(document.getElementById('soc'), tooltipNode);

        // Tree.
        domNode = document.createElement('div');
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Details for SoC &#171;' + gSoc + '&#187; with tree ' + gJob);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/soc/' + gSoc + '/job/' + gJob + '/');
        aNode.appendChild(document.createTextNode(gJob));
        tooltipNode.appendChild(aNode);

        domNode.appendChild(tooltipNode);
        domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Details for tree &#171;' + gJob + '&#187;');
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + gJob + '/');
        aNode.appendChild(html.tree());
        tooltipNode.appendChild(aNode);

        domNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('tree'), domNode);

        // Git branch.
        html.replaceContent(
            document.getElementById('git-branch'),
            document.createTextNode(gitBranch));

        // Git describe.
        domNode = document.createElement('div');
        domNode.appendChild(document.createTextNode(gKernel));
        domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Build reports for &#171;' + gJob + '&#187; - ' + gKernel);
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/build/' + gJob + '/kernel/' + gKernel);
        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);

        domNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('git-describe'), domNode);

        // Git URL.
        aNode = document.createElement('a');
        aNode.setAttribute('href', gitURL);
        aNode.appendChild(document.createTextNode(gitURL));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.external());
        
        html.replaceContent(document.getElementById('git-url'), aNode);

        // Git commit.
        if (gitURLs[1]) {
            aNode = document.createElement('a');
            aNode.setAttribute('href', gitURLs[1]);
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
            document.createTextNode(createdOn.toCustomISODate()));
        html.replaceContent(
            document.getElementById('job-date'), domNode);
    }

    function updateChart(response) {
        function countTests(response) {
            var results = response.result;
            var total = results[0].result[0].count;
            var pass = results[1].result[0].count;
            var regressions = results[2].result[0].count;
            var unknown = results[3].result[0].count;

            return [total, [pass, regressions, unknown]];
        }

        chart.testpie({
            element: 'test-chart',
            countFunc: countTests,
            response: response,
            size: {
                height: 140,
                width: 140
            },
            radius: {inner: -12.5, outer: 0},
        });
    }

    function plansFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('No test data available.')
        );
    }

    function updatePlansTable(results) {

        var columns;

        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regressions/Other test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        function _renderTestCount(data, type) {
            return ttest.renderTestCount({data: data, type: type})
        }

        function _renderPlanStatus(data, type) {
            if (type == "display") {
                var node = document.createElement('div');
                node.id = "status-" + data;
                return node.outerHTML;
            }
        }

        columns = [
            {
                data: 'name',
                title: 'Test Plan',
                type: 'string',
                className: 'test-group-column',
            },
            {
                data: 'name',
                title: _testColumnTitle(),
                type: 'string',
                searchable: false,
                orderable: false,
                className: 'test-count pull-center',
                render: _renderTestCount,
            },
            {
                data: 'name',
                title: 'Status',
                type: 'string',
                searchable: false,
                orderable: false,
                className: 'pull-center',
                render: _renderPlanStatus,
            },
        ]
        gPlansTable
            .data(results)
            .columns(columns)
            .order([0, 'asc'])
            .rowURL('/soc/%(soc)s/job/%(job)s/kernel/%(kernel)s/plan/%(name)s/')
            .rowURLElements(['job', 'git_branch', 'kernel', 'name'])
            .paging(false)
            .info(false)
            .draw();
    }

    function chartCountFailed() {
        /* The chart will not be shown */
    }

    function getBatchStatusDone(response) {
        function parseBatchData(data) {
            var node = document.getElementById(data.operation_id);
            var status = (data.result[0].count == 0 ? "PASS" : "FAIL");
            node.appendChild(ttest.statusNode(status));
        }

        response.result.forEach(parseBatchData)
    }

    function getBatchStatusFailed() {
        console.log("getBatchStatusFailed()");
    }

    function getBatchCountDone(response) {
        function parseBatchData(data) {
            html.replaceContent(
                document.getElementById(data.operation_id),
                document.createTextNode(data.result[0].count));
        }

        response.result.forEach(parseBatchData)
    }

    function getBatchStatus(results) {
        var batchOps;
        var deferred;

        function createBatchOp(result) { 
            var qStr;
            var plan = result.name;

            qStr = URI.buildQuery({
                'job': result.job,
                'kernel': result.kernel,
                'git_branch': result.git_branch,
                'plan': plan,
                'mach': gSoc,
            });

            /* Number of test case regressions */
            batchOps.push({
                method: 'GET',
                operation_id: 'status-' + plan,
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });
        }

        batchOps = [];
        results.forEach(createBatchOp)
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getBatchStatusFailed)
            .done(getBatchStatusDone)
    }

    function getBatchCountFailed() {
        plansFailed();
    }

    function getBatchCount(results) {
        var batchOps;
        var deferred;

        function createBatchOp(result) {
            
            var qStr;
            var plan = result.name;

            qStr = URI.buildQuery({
                'job': result.job,
                'kernel': result.kernel,
                'git_branch': result.git_branch,
                'plan': plan,
                'mach': gSoc,
            });

            /* Total number of test cases */
            batchOps.push({
                method: 'GET',
                operation_id: 'test-total-count-' + plan,
                resource: 'count',
                document: 'test_case',
                query: qStr,
            });

            /* Number of passing test cases */
            batchOps.push({
                method: 'GET',
                operation_id: 'test-success-count-' + plan,
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=PASS',
            });

            /* Number of test case regressions */
            batchOps.push({
                method: 'GET',
                operation_id: 'test-fail-count-' + plan,
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });

            /* Number of unknown test results */
            batchOps.push({
                method: 'GET',
                operation_id: 'test-unknown-count-' + plan,
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=FAIL&status=SKIP&regression_id=null',
            });
        }

        batchOps = [];
        results.forEach(createBatchOp)
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getBatchCountFailed)
            .done(getBatchCountDone)
    }

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', 'Not available');
    }

    function getPlansFailed() {
        detailsFailed();
        plansFailed();
    }

    function getPlansDone(response) {
        if (response.result.length === 0) {
            getPlansFailed();
            return
        }
    
        updateDetails(response.result[0]);
        updatePlansTable(response.result);
        getBatchCount(response.result);
        getBatchStatus(response.result);

    }

    function getPlans() {
        var data;
        var deferred;

        data = {
            aggregate: 'name',
            job: gJob,
            kernel: gKernel,
            mach: gSoc,
            parent_id: 'null',
            sort: 'name',
            field: [
                'name',
                'created_on',
                'job',
                'git_branch',
                'git_commit',
                'git_url',
                'kernel',
            ],
        };

        deferred = request.get('/_ajax/test/group', data)
        $.when(deferred)
            .fail(error.error, getPlansFailed)
            .done(getPlansDone);
    }

    function getTestCount() {
        var qStr;
        var batchOps;
        var deferred;

        qStr = URI.buildQuery({
            'job': gJob,
            'kernel': gKernel,
            'mach': gSoc
        });

        batchOps = []

        /* Total number of test cases */
        batchOps.push({
            method: 'GET',
            operation_id: 'test-total-count',
            resource: 'count',
            document: 'test_case',
            query: qStr,
        });

        /* Number of passing test cases */
        batchOps.push({
            method: 'GET',
            operation_id: 'test-success-count',
            resource: 'count',
            document: 'test_case',
            query: qStr + '&status=PASS',
        });

        /* Number of test case regressions */
        batchOps.push({
            method: 'GET',
            operation_id: 'test-fail-count',
            resource: 'count',
            document: 'test_regression',
            query: qStr,
        });

        /* Number of unknown test results */
        batchOps.push({
            method: 'GET',
            operation_id: 'test-unknown-count',
            resource: 'count',
            document: 'test_case',
            query: qStr + '&status=FAIL&status=SKIP&regression_id=null',
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, chartCountFailed)
            .done(updateChart)
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('soc-name') !== null) {
        gSoc = document.getElementById('soc-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    Array.prototype.forEach.call(
        document.querySelectorAll('.btn-group > .btn'),
        function(btn) {
            btn.addEventListener('click', function() {
                Array.prototype.forEach.call(
                    btn.parentElement.children, function(element) {
                    if (element === btn) {
                        html.addClass(element, 'active');
                    } else {
                        html.removeClass(element, 'active');
                    }
                });
            });
    });


    gPlansTable = table({
        tableId: 'planstable',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getPlans, 10);
    setTimeout(getTestCount, 10);

    init.hotkeys();
    init.tooltip();
});
