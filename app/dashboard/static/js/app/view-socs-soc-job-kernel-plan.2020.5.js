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
    'utils/error',
    'utils/format',
    'utils/html',
    'utils/init',
    'utils/request',
    'components/test/view',
    'URI',
], function($, error, format, html, init, request, testView, URI) {
    'use strict';
    var gSoc;
    var gJob;
    var gKernel;
    var gPlan;
    var gFileServer;
    var gPanel;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateDetails(results) {
        var soc;
        var job;
        var branch;
        var kernel;
        var commit;
        var treeNode;
        var jobLink;
        var describeNode;
        var buildsLink;
        var gitNode;
        var createdOn;
        var dateNode;
        var branchNode;
        var branchLink;

        soc = results.mach;
        job = results.job;
        branch = results.git_branch;
        kernel = results.kernel;
        commit = results.git_commit;

        treeNode = html.tooltip();
        treeNode.title = "Details for tree &#171;" + job + "&#187;";
        jobLink = document.createElement('a');
        jobLink.href = "/job/" + job + "/";
        jobLink.appendChild(html.tree());
        treeNode.appendChild(document.createTextNode(job));
        treeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        treeNode.appendChild(jobLink);

        // Branch.
        branchNode = html.tooltip();
        branchNode.title =
            "Branch reports for &#171;" + job + "&#187; - " + branch;
        branchLink = document.createElement('a');
        branchLink.href = "/job/" + job + "/branch/" + branch;
        branchLink.appendChild(html.tree());
        branchNode.appendChild(document.createTextNode(branch));
        branchNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        branchNode.appendChild(branchLink);

        html.replaceContent(
            document.getElementById('git-branch'), branchNode);

        describeNode = html.tooltip();
        describeNode.title =
            "Build reports for &#171;" + job + "&#187; - " + kernel;
        buildsLink = document.createElement('a');
        buildsLink.href = "/build/" + job + "/kernel/" + kernel;
        buildsLink.appendChild(html.build());
        describeNode.appendChild(document.createTextNode(kernel));
        describeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        describeNode.appendChild(buildsLink);

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
            document.getElementById('soc'),
            document.createTextNode(soc));
        html.replaceContent(
            document.getElementById('tree'), treeNode);
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

    function runsFailed() {
        var container;
        var node;

        container = document.getElementById('accordion-container');
        node = document.createElement('div');
        node.className = 'pull-center';
        node.appendChild(document.createTextNode('No test data available'));
        html.replaceContent(container, node);
    }

    function updateRuns(results) {
        gPanel = testView(results, gFileServer);
        gPanel.draw();
    }

    function createLabResultsCount(total, pass, fail, unknown) {
        var docFrag;
        var smallNode;
        var spanNode;
        var tooltipNode;

        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        html.addClass(tooltipNode, 'default-cursor');
        tooltipNode.title =
            "Total, passed, regressions and unknown test results for this lab";

        smallNode = tooltipNode.appendChild(document.createElement('small'));
        smallNode.appendChild(document.createTextNode(
            '(' + format.number(total)));
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'green-font';
        spanNode.appendChild(document.createTextNode(format.number(pass)));

        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'red-font';
        spanNode.appendChild(document.createTextNode(format.number(fail)));

        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'yellow-font';
        spanNode.appendChild(
            document.createTextNode(format.number(unknown)));

        smallNode.appendChild(document.createTextNode(')'));

        return docFrag;
    }

    function updateLabs(results) {
        var labResults = {};

        Object.keys(gPanel.allLabs).forEach(function(lab) {
            labResults[lab] = {};
        });

        results.forEach(function(data) {
            var lab = data.operation_id[0];
            var result = data.operation_id[1];
            var count = data.result[0].count;
            labResults[lab][result] = count;
        });

        Object.keys(gPanel.allLabs).forEach(function(lab) {
            var res = labResults[lab];

            html.replaceContent(
                document.getElementById('test-count-' + lab),
                createLabResultsCount(res['total'], res['success'],
                                      res['regressions'], res['unknown'])
            );
        });
    }

    function updateRegressions(results) {
        function parseBatchData(data) {
            var panelId = data.operation_id + '-panel';
            var statusId = data.operation_id + '-status';
            var status;
            var panelNode;
            var statusNode;
            var statusParent;

            status = (data.result[0].count == 0 ? "PASS" : "FAIL");
            panelNode = document.getElementById(panelId);
            gPanel.addFilterClass(panelNode, status);
            statusNode = gPanel.createStatusNode(status);
            statusParent = document.getElementById(statusId);
            html.replaceContent(statusParent, statusNode);
        }

        results.forEach(parseBatchData);
    }

    function updateButtons(panel) {
        panel.enableButtons();

        if (panel.hasFail) {
            var failButton;

            Array.prototype.forEach.call(
                document.getElementsByClassName('df-failed'),
                function(element) {
                    element.style.setProperty('display', 'block');
                }
            );
            Array.prototype.forEach.call(
                document.getElementsByClassName('df-success'),
                function(element) {
                    element.style.setProperty('display', 'none');
                }
            );
            Array.prototype.forEach.call(
                document.getElementsByClassName('df-unknown'),
                function(element) {
                    element.style.setProperty('display', 'none');
                }
            );

            failButton = document.getElementById('fail-btn');
            Array.prototype.forEach.call(
                failButton.parentElement.children, function(element) {
                    if (element === failButton) {
                        html.addClass(element, 'active');
                    } else {
                        html.removeClass(element, 'active');
                    }
                }
            );
        } else {
            Array.prototype.forEach.call(
                document.getElementsByClassName('panel'),
                function(element) {
                    element.style.setProperty('display', 'block');
                }
            );
            html.addClass(document.getElementById('all-btn'), 'active');
        }
    }

    function getRegressionsFailed() {
        runsFailed();
    }

    function getRegressionsDone(response) {
        updateRegressions(response.result);
        updateButtons(gPanel);
    }

    function getRegressions(results) {
        var batchOps;
        var deferred;

        function createBatchOp(result) {
            var qStr;
            var idStr;

            qStr = URI.buildQuery({
                'job': result.job,
                'kernel': result.kernel,
                'git_branch': result.git_branch,
                'plan': result.name,
                'device_type': result.device_type,
                'lab_name': result.lab_name,
                'build_environment': result.build_environment,
                'defconfig_full': result.defconfig_full,
            });

            idStr = gPanel.createDataIndex(result);

            batchOps.push({
                method: 'GET',
                operation_id: idStr,
                resource: 'test_regression',
                query: qStr,
            });
        }

        batchOps = [];
        results.forEach(createBatchOp);
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getRegressionsFailed)
            .done(getRegressionsDone);
    }

    function getLabResultsFailed() {
        runsFailed();
    }

    function getLabResultsDone(response) {
        updateLabs(response.result);
    }

    function getLabResults() {
        var batchOps;
        var deferred;
        var params;

        params = {
            'mach': gSoc,
            'job': gJob,
            'kernel': gKernel,
            'plan': gPlan,
        };

        function createBatchOp(lab) {
            var qStr;

            params['lab_name'] = lab;
            qStr = URI.buildQuery(params);

            batchOps.push({
                method: 'GET',
                operation_id: [lab, 'total'],
                resource: 'count',
                document: 'test_case',
                query: qStr,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [lab, 'success'],
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=PASS',
            });

            batchOps.push({
                method: 'GET',
                operation_id: [lab, 'regressions'],
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [lab, 'unknown'],
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=FAIL&status=SKIP&regression_id=null',
            });
        }

        batchOps = [];
        Object.keys(gPanel.allLabs).forEach(createBatchOp);
        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error, getLabResultsFailed)
            .done(getLabResultsDone);
    }

    function getRunsFailed() {
        detailsFailed();
        runsFailed();
    }

    function getRunsDone(response) {
        updateDetails(response.result[0]);
        updateRuns(response.result);
        getRegressions(response.result);
        getLabResults();
    }

    function getRuns() {
        var data;
        var deferred;

        data = {
            job: gJob,
            mach: gSoc,
            kernel: gKernel,
            name: gPlan,
            parent_id: 'null',
            sort: 'device_type',
            sort_order: 1,
        };

        deferred = request.get('/_ajax/test/group', data);
        $.when(deferred)
            .fail(error.error, getRunsFailed)
            .done(getRunsDone);
    }

    if (document.getElementById('soc-name') !== null) {
        gSoc = document.getElementById('soc-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('plan-name') !== null) {
        gPlan = document.getElementById('plan-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    setTimeout(getRuns, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
