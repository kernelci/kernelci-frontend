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
    'components/test/common',
    'tables/test',
    'utils/error',
    'utils/html',
    'utils/init',
    'utils/request',
    'utils/table',
    'utils/urls',
    'URI',
], function($, tcommon, ttable, error, html, init, request, table, urls, URI) {
    'use strict';

    var gCaseId;
    var gFileServer;
    var gRegressionTable;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateCaseDetails(results) {
        var job;
        var kernel;
        var branch;
        var branchURI;
        var plan;
        var treeNode;
        var jobLink;
        var describeNode;
        var buildsNode;
        var buildsLink;
        var testsNode;
        var testsLink;
        var createdOn;
        var dateNode;
        var status;
        var branchNode;
        var branchLink;
        var planNode;
        var planLink;

        job = results.job;
        kernel = results.kernel;
        branch = results.git_branch;
        branchURI = URI.encode(branch);
        plan = results.plan;

        treeNode = html.tooltip();
        treeNode.title = "All results for tree &#171;" + job + "&#187;";
        jobLink = document.createElement('a');
        jobLink.href = "/job/" + job + "/";
        jobLink.appendChild(html.tree());
        treeNode.appendChild(document.createTextNode(job));
        treeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        treeNode.appendChild(jobLink);

        describeNode = document.createElement('span');
        buildsNode = html.tooltip();
        buildsNode.title = "Build reports for &#171;" + kernel + "&#187;";
        buildsLink = buildsNode.appendChild(document.createElement('a'));
        buildsLink.href =
            "/build/" + job + "/branch/" + branchURI +
            "/kernel/" + kernel + '/';
        buildsLink.appendChild(html.build());
        testsNode = html.tooltip();
        testsNode.title = "Test results for &#171;" + kernel + "&#187;";
        testsLink = document.createElement('a');
        testsLink.href =
            "/test/job/" + job + "/branch/" + branchURI +
            "/kernel/" + kernel + '/';
        testsLink.appendChild(html.test());
        testsNode.appendChild(testsLink);
        describeNode.appendChild(document.createTextNode(kernel));
        describeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        describeNode.appendChild(buildsNode);
        describeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        describeNode.appendChild(testsNode);

        planNode = html.tooltip();
        planNode.title = "All results for plan &#171;" + plan + "&#187;";
        planLink = document.createElement('a');
        planLink.href =
            "/test/job/" + job + "/branch/" + branchURI +
            "/kernel/" + kernel + "/plan/" + plan + "/";
        planLink.appendChild(html.test());
        planNode.appendChild(document.createTextNode(plan));
        planNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        planNode.appendChild(planLink);

        // Branch.
        branchNode = html.tooltip();
        branchNode.title = "All results for branch &#171;" + branch + "&#187;";
        branchLink = document.createElement('a');
        branchLink.href = "/job/" + job + "/branch/" + branchURI + '/';
        branchLink.appendChild(html.tree());
        branchNode.appendChild(document.createTextNode(branch));
        branchNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        branchNode.appendChild(branchLink);

        createdOn = new Date(results.created_on.$date);
        dateNode = document.createElement('time');
        dateNode.setAttribute('datetime', createdOn.toISOString());
        dateNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));

        if (results.status == 'PASS')
            status = 'PASS';
        else if (results.regression_id)
            status = 'FAIL';
        else if (results.status == 'FAIL')
            status = 'WARNING';
        else
            status = 'UNKNOWN';

        html.replaceContent(
            document.getElementById('test-case-path-title'),
            document.createTextNode(results.test_case_path));
        html.replaceContent(
            document.getElementById('device-type-title'),
            document.createTextNode(results.device_type));
        html.replaceContent(
            document.getElementById('lab-name-title'),
            document.createTextNode(results.lab_name));

        html.replaceContent(
            document.getElementById('device-type'),
            document.createTextNode(results.device_type));
        html.replaceContent(
            document.getElementById('mach'),
            document.createTextNode(results.mach));
        html.replaceContent(
            document.getElementById('tree'), treeNode);
        html.replaceContent(
            document.getElementById('git-branch'), branchNode);
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(  /* ToDo: link to commit when possible */
            document.getElementById('git-commit'),
            document.createTextNode(results.git_commit));
        html.replaceContent(
            document.getElementById('plan'), planNode);
        html.replaceContent(
            document.getElementById('arch'),
            document.createTextNode(results.arch));
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
        html.replaceContent(
            document.getElementById('status'), ttable.statusNode(status));
    }

    function updateMeasurements(testCase) {
        var mesDiv;
        var mesList;

        mesDiv = document.getElementById("measurements");
        mesList = document.createElement('dl');
        mesList.className = 'dl-horizontal';
        mesDiv.appendChild(mesList);

        testCase.measurements.forEach(function(data) {
            var unit = document.createElement('dt');
            var value = document.createElement('dd');

            unit.appendChild(document.createTextNode(data['unit']));
            mesList.appendChild(unit);
            value.appendChild(document.createTextNode(data['value']));
            mesList.appendChild(value);
        });

        html.removeClass(mesDiv, 'hidden');
    }

    function updateLogLines(testCase) {
        var logLines;
        var logBlock;
        var logText;

        logLines = document.getElementById('log-lines-content');
        logBlock = document.createElement('pre');
        logText = document.createTextNode('');
        logBlock.appendChild(logText);
        logLines.appendChild(logBlock);

        testCase.log_lines.forEach(function(line) {
            logText.data += line.msg + '\n';
        });

        html.removeClass(document.getElementById('log-lines'), 'hidden');
    }

    function updateGroupDetails(results) {
        var translatedURI;
        var gitNode;
        var logNode;
        var defconfigNode;
        var defconfigPath;
        var defconfigLink;
        var buildLink;
        var kernelNode;
        var kernelPath;
        var modulesNode;
        var dtbNode;

        translatedURI = urls.createFileServerURL(gFileServer, results);

        gitNode = document.createElement('a');
        gitNode.appendChild(document.createTextNode(results.git_url));
        gitNode.href = results.git_url;
        gitNode.title = "Git URL";

        logNode = tcommon.logsNode(
            results.boot_log, results.boot_log_html, results.lab_name,
            translatedURI[0], translatedURI[1]);

        defconfigNode = html.tooltip();
        defconfigLink = document.createElement('a');
        defconfigLink.appendChild(
            document.createTextNode(results.defconfig_full));
        defconfigPath = translatedURI[1] + "/config/kernel.config";
        defconfigLink.href =
            translatedURI[0].path(defconfigPath).normalizePath().href();
        defconfigLink.title = "Defconfig URL";
        defconfigLink.insertAdjacentHTML('beforeend', '&nbsp;');
        defconfigLink.appendChild(html.external());
        defconfigNode.appendChild(defconfigLink);
        buildLink = document.createElement('a');
        buildLink.href = "/build/id/" + results.build_id.$oid;
        buildLink.appendChild(html.build());
        buildLink.title = "Build details";
        defconfigNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        defconfigNode.appendChild(buildLink);

        if (!results.dtb || results.dtb == 'None') {
            dtbNode = html.nonavail();
        } else {
            var dtbPath;

            dtbPath = translatedURI[1] + "/" + results.dtb;
            dtbNode = document.createElement('a');
            dtbNode.appendChild(document.createTextNode(results.dtb));
            dtbNode.href =
                translatedURI[0].path(dtbPath).normalizePath().href();
            dtbNode.insertAdjacentHTML('beforeend', '&nbsp;');
            dtbNode.appendChild(html.external());
        }

        kernelPath = translatedURI[1] + "/" + results.kernel_image;
        kernelNode = document.createElement('a');
        kernelNode.appendChild(document.createTextNode(results.kernel_image));
        kernelNode.href =
            translatedURI[0].path(kernelPath).normalizePath().href();
        kernelNode.insertAdjacentHTML('beforeend', '&nbsp;');
        kernelNode.appendChild(html.external());

        if (!results.modules) {
            modulesNode = html.nonavail();
        } else {
            var modulesPath;

            modulesPath = translatedURI[1] + "/" + results.modules;
            modulesNode = document.createElement('a');
            modulesNode.appendChild(document.createTextNode(results.modules));
            modulesNode.href =
                translatedURI[0].path(modulesPath).normalizePath().href();
            modulesNode.insertAdjacentHTML('beforeend', '&nbsp;');
            modulesNode.appendChild(html.external());
        }

        html.replaceContent(
            document.getElementById('defconfig'), defconfigNode);
        html.replaceContent(
            document.getElementById('endian'),
            document.createTextNode(results.endian));
        html.replaceContent(
            document.getElementById('git-url'), gitNode);
        html.replaceContent(
            document.getElementById('compiler'),
            document.createTextNode(results.compiler_version_full));
        html.replaceContent(
            document.getElementById('job-log'), logNode);
        html.replaceContent(
            document.getElementById('kernel-image'), kernelNode);
        html.replaceContent(
            document.getElementById('modules'), modulesNode);
        html.replaceContent(
            document.getElementById('dtb'), dtbNode);
    }

    function addRegressionHistory(results) {
        var data;
        var columns;

        data = [];
        results.regressions.reverse().forEach(function(item) {
            data.push({
                'kernel': item.kernel,
                'created_on': item.created_on,
                'status': item.status,
                'test_case_id': item.test_case_id.$oid,
            });
        });

        function _renderStatus(data, type) {
            if (type == "display") {
                return ttable.statusNode(data).outerHTML;
            } else {
                return data;
            }
        }

        /* ToDo: highlight current revision row, and show "future" regressions
         * when looking at other revisions (needs database schema changes).
         */
        columns = [
            {
                data: 'kernel',
                title: 'Kernel',
                type: 'string',
                className: 'kernel-column',
            },
            {
                data: 'created_on',
                title: 'Date',
                type: 'date',
                orderable: false,
                className: 'date-column-count pull-center',
                render: ttable.renderDate,
            },
            {
                data: 'status',
                title: 'Status',
                type: 'string',
                searchable: false,
                orderable: false,
                className: 'pull-center',
                render: _renderStatus,
            },
        ];

        gRegressionTable
            .data(data)
            .columns(columns)
            .languageLengthMenu('Revisions per page')
            .lengthMenu([10, 25, 50, 75, 100])
            .rowURL('/test/case/id/%(test_case_id)s')
            .rowURLElements(['test_case_id'])
            .draw();

        html.removeClass(document.getElementById('regr-title'), 'hidden');
    }

    function getGroupFailed() {
        detailsFailed();
    }

    function getGroupDone(response) {
        updateGroupDetails(response.result[0]);
    }

    function getGroup(results) {
        $.when(request.get('/_ajax/test/group',
                           {id: results.test_group_id.$oid}))
            .fail(error.error, getGroupFailed)
            .done(getGroupDone);
    }

    function getRegressionFailed() {
        /* The regression row will not be shown */
    }

    function getRegressionDone(response) {
        addRegressionHistory(response.result[0]);
    }

    function getRegression(results) {
        if (results.regression_id) {
            $.when(request.get('/_ajax/test/regression',
                               {id: results.regression_id.$oid}))
                .fail(error.error, getRegressionFailed)
                .done(getRegressionDone);
        }
    }

    function getCaseFailed() {
        detailsFailed();
    }

    function getCaseDone(response) {
        var testCase = response.result[0];

        getGroup(testCase);
        getRegression(testCase);
        updateCaseDetails(testCase);

        if (testCase.measurements.length)
            updateMeasurements(testCase);

        if (testCase.log_lines.length)
            updateLogLines(testCase);
    }

    function getCase() {
        if (!gCaseId) {
            getCaseFailed();
            return;
        }

        $.when(request.get('/_ajax/test/case', {id: gCaseId}))
            .fail(error.error, getCaseFailed)
            .done(getCaseDone);
    }

    if (document.getElementById('case-id') !== null) {
        gCaseId = document.getElementById('case-id').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gRegressionTable = table({
        tableId: 'new-regression-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getCase, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
