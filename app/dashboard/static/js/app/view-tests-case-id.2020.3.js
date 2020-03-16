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
    'utils/urls',
], function($, tcommon, ttable, error, html, init, request, urls) {
    'use strict';

    var gCaseId;
    var gFileServer;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateCaseDetails(results) {
        var job;
        var kernel;
        var treeNode;
        var jobLink;
        var describeNode;
        var buildsLink;
        var createdOn;
        var dateNode;
        var status;

        job = results.job;
        kernel = results.kernel;

        treeNode = html.tooltip();
        treeNode.title = "Details for tree &#171;" + job + "&#187;"
        jobLink = document.createElement('a');
        jobLink.href = "/job/" + job + "/";
        jobLink.appendChild(html.tree());
        treeNode.appendChild(document.createTextNode(job));
        treeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        treeNode.appendChild(jobLink);

        describeNode = html.tooltip();
        describeNode.title =
            "Build reports for &#171;" + job + "&#187; - " + kernel;
        buildsLink = document.createElement('a');
        buildsLink.href = "/build/" + job + "/kernel/" + kernel;
        buildsLink.appendChild(html.build());
        describeNode.appendChild(document.createTextNode(kernel));
        describeNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        describeNode.appendChild(buildsLink);

        createdOn = new Date(results.created_on.$date);
        dateNode = document.createElement('time');
        dateNode.setAttribute('datetime', createdOn.toISOString());
        dateNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));

        if (results.status == 'PASS')
            status = 'PASS';
        else if (results.regression_id)
            status = 'FAIL';
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
            document.getElementById('git-branch'),
            document.createTextNode(results.git_branch));
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(  /* ToDo: link to commit when possible */
            document.getElementById('git-commit'),
            document.createTextNode(results.git_commit));
        html.replaceContent(
            document.getElementById('arch'),
            document.createTextNode(results.arch));
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
        html.replaceContent(
            document.getElementById('status'), ttable.statusNode(status));
    }

    function updateGroupDetails(results) {
        var translatedURI;
        var gitNode;
        var logNode;
        var defconfigNode;
        var defconfigPath;
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

        defconfigNode = document.createElement('a');
        defconfigNode.appendChild(
            document.createTextNode(results.defconfig_full));
        defconfigPath = translatedURI[1] + "/kernel.config";
        defconfigNode.href =
            translatedURI[0].path(defconfigPath).normalizePath().href()
        defconfigNode.title = "Defconfig URL";
        defconfigNode.insertAdjacentHTML('beforeend', '&nbsp;');
        defconfigNode.appendChild(html.external());

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

    function getCaseFailed() {
        detailsFailed();
    }

    function getCaseDone(response) {
        var testCase = response.result[0]

        getGroup(testCase);
        updateCaseDetails(testCase);
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

    setTimeout(getCase, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
