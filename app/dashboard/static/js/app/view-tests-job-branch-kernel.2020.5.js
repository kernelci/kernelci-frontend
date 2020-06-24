/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2020 Collabora Limited
 * Author: Guillaume Tucker <guillaume.tucker@collabora.com>
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

require([
    'jquery',
    'utils/init',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test',
    'charts/passpie',
    'URI',
    'utils/urls',
], function($, init, html, error, request, table, ttest, chart, URI, urls) {
    'use strict';
    var gJob;
    var gBranch;
    var gKernel;
    var gPlansTable;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateDetails(results) {
        var job;
        var branch;
        var kernel;
        var commit;
        var treeNode;
        var jobLink;
        var describeNode;
        var branchNode;
        var branchLink;
        var gitNode;
        var createdOn;
        var dateNode;
        var aNode;
        var spanNode;
        var tooltipNode;

        job = results.job;
        branch = results.git_branch;
        kernel = results.kernel;
        commit = results.git_commit;

        treeNode = html.tooltip();
        treeNode.title = "All results for tree &#171;" + job + "&#187;"
        jobLink = document.createElement('a');
        jobLink.href = "/job/" + job + "/";
        jobLink.appendChild(html.tree());
        treeNode.appendChild(document.createTextNode(job));
        treeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        treeNode.appendChild(jobLink);

        branchNode = html.tooltip();
        branchNode.title = "All results for branch &#171;" + branch + "&#187;";
        branchLink = document.createElement('a');
        branchLink.href = "/job/" + job + "/branch/" + branch;
        branchLink.appendChild(html.tree());
        branchNode.appendChild(document.createTextNode(branch));
        branchNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        branchNode.appendChild(branchLink);

                // Git describe.
        describeNode = document.createDocumentFragment();
        spanNode = describeNode.appendChild(document.createElement('span'));

        spanNode.appendChild(document.createTextNode(kernel));

        spanNode.insertAdjacentHTML(
            'beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title',
            'Build reports for ' + job + '&nbsp;&ndash;&nbsp;' + kernel
        );
        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href',
            urls.createPathHref([
                '/build/',
                job,
                'branch',
                branch,
                'kernel',
                kernel,
                '/'
            ]));
        aNode.appendChild(html.build());

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.title =
            "Test reports for &#171;" + job + "&#187; - " + kernel;

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href',
            urls.createPathHref([
                '/test/job/',
                job,
                '/branch/',
                branch,
                '/kernel/',
                kernel,
                '/'
            ]));
        aNode.appendChild(html.stethoscope());

        gitNode = document.createElement('a');
        gitNode.appendChild(document.createTextNode(results.git_url));
        gitNode.href = results.git_url;
        gitNode.title = "Git URL"; /* ToDo: link to commit when possible */

        createdOn = new Date(results.created_on.$date);
        dateNode = document.createElement('time');
        dateNode.setAttribute('datetime', createdOn.toISOString());
        dateNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));

        html.replaceContent(
            document.getElementById('tree'), treeNode);
        html.replaceContent(
            document.getElementById('git-branch'), branchNode);
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(
            document.getElementById('git-url'), gitNode);
        html.replaceContent(
            document.getElementById('git-commit'),
            document.createTextNode(commit));
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
    }

    function chartCountFailed() {
        /* The chart will not be shown */
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
            return ttest.renderTestCount({data: data, type: type});
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
        ];

        gPlansTable
            .data(results)
            .columns(columns)
            .order([0, 'asc'])
            .rowURL('/test/job/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/plan/%(name)s/')
            .rowURLElements(['job', 'git_branch', 'kernel', 'name'])
            .paging(false)
            .info(false)
            .draw();
    }

    function getBatchCountFailed() {
        plansFailed();
    }

    function getBatchCountDone(response) {
        response.result.forEach(function(data) {
            html.replaceContent(
                document.getElementById(data.operation_id),
                document.createTextNode(data.result[0].count));
        });
    }

    function getBatchCount(results) {
        var batchOps;
        var deferred;

        function createBatchOp(result) {
            var job = result.job;
            var kernel = result.kernel;
            var branch = result.git_branch;
            var plan = result.name;
            var qStr;

            qStr = URI.buildQuery({
                'job': job,
                'kernel': kernel,
                'git_branch': branch,
                'plan': plan,
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
        results.forEach(createBatchOp);
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getBatchCountFailed)
            .done(getBatchCountDone);
    }

    function getBatchStatusDone(response) {
        response.result.forEach(function(data) {
            var node = document.getElementById(data.operation_id);
            var status = (data.result[0].count == 0 ? "PASS" : "FAIL");
            node.appendChild(ttest.statusNode(status));
        });
    }

    function getBatchStatusFailed() {
        console.log("getBatchStatusFailed()");
    }

    function getBatchStatus(results) {
        var batchOps;
        var deferred;

        function createBatchOp(result) {
            var job = result.job;
            var kernel = result.kernel;
            var branch = result.git_branch;
            var plan = result.name;
            var qStr;

            qStr = URI.buildQuery({
                'job': job,
                'kernel': kernel,
                'git_branch': branch,
                'plan': plan,
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
        results.forEach(createBatchOp);
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getBatchStatusFailed)
            .done(getBatchStatusDone);
    }

    function getPlansFailed() {
        detailsFailed();
        plansFailed();
    }

    function getPlansDone(response) {
        if (response.result.length === 0) {
            getPlansFailed();
            return;
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
            git_branch: gBranch,
            kernel: gKernel,
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

        deferred = request.get('/_ajax/test/group', data);
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
            'git_branch': gBranch,
        });

        batchOps = [];

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
            .done(updateChart);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }

    gPlansTable = table({
        tableId: 'plans-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getPlans, 10);
    setTimeout(getTestCount, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
