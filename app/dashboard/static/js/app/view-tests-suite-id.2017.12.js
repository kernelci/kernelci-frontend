/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * Copyright (c) 2017 BayLibre, SAS.
 * Author: Loys Ollivier <lollivier@baylibre.com>
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
    'utils/urls',
    'utils/bisect',
    'tables/test',
    'tables/boot',
    'utils/html',
    'utils/const'
], function($, init, error, request, u, bisect, ttest, tboot, html, appconst) {
    'use strict';
    var gSuiteId;
    var gDateRange;
    var gFileServer;
    var gLogHref;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gFileServer = null;
    gLogHref = null;

    // TODO Add a row from /jobs to tests ?

    function _tableMessage(tableId, text) {
        var cellNode;
        var frag;
        var rowNode;
        var strongNode;

        frag = document.createDocumentFragment();
        rowNode = frag.appendChild(document.createElement('tr'));

        cellNode = rowNode.insertCell(-1);
        cellNode.colSpan = 6;
        cellNode.className = 'pull-center';

        strongNode = cellNode.appendChild(document.createElement('strong'));
        strongNode.appendChild(document.createTextNode(text));

        document.getElementById(tableId)
            .tBodies[0].appendChild(frag);
    }

    function addCaseTableRow(data, docFrag) {
        var cellNode;
        var rowNode;
        var caseName;
        var measurements;
        var measureNode;
        var measureStr;

        caseName = data.name;
        measurements = data.measurements;

        rowNode = docFrag.appendChild(document.createElement('tr'));

        // Name.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'name-column';
        cellNode.appendChild(document.createTextNode(caseName));

        // Measurements
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'name-column';
        if (measurements.length !== 0) {
            measureStr = measurements[0].value + ' ' + measurements[0].unit;
            measureNode = document.createTextNode(measureStr);
            cellNode.appendChild(measureNode);
        } else {
            cellNode.insertAdjacentHTML('beforeend', '&empty;');
        }

        // Date.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'date-column pull-center';
        cellNode.appendChild(ttest.dateNode(data.created_on));

        // Status.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(ttest.statusNode(data.status));

        // Detail.
        // Test Case log.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        if (gLogHref) {
            cellNode.appendChild(ttest.detailsNode(gLogHref));
        } else {
            cellNode.insertAdjacentHTML('beforeend', '&nbsp;');
        }
    }

    function getMultiCasesDataFail() {
        // TODO
    }

    function getMultiCasesDataDone(response) {
        var docFrag;
        var results;
        var table;
        var tableId;

        docFrag = document.createDocumentFragment();
        // Because we have an aggregate of deferred
        results = response[0].result;

        // For each test case create a table row
        // And update the matching set table
        results.forEach(function(result) {
            addCaseTableRow(result, docFrag);

            if(result.test_set_id) {
                tableId = 'table-set-' + result.test_set_id.$oid;
                table = document.getElementById(tableId);
            } else {
                // Cases that doesn't belong to a test set
                tableId = 'multiple-cases-table';
            }

            table = document.getElementById(tableId);
            html.removeClass(table, 'hidden');
            table.tBodies[0].appendChild(docFrag);
        });

        if (results.length === 0) {
            tableId = 'multiple-cases-table';
            table = document.getElementById(tableId);
            setTimeout(
                _tableMessage.bind(
                    null, tableId, 'No test case reports found.'), 0);
            html.removeClass(table, 'hidden');
        }
    }

    function createSetTable(data, docFrag) {
        var setId;
        var setName;
        var tableNode;
        var tableHead;
        var tableBody;
        var tableRow;
        var tableCaption;

        setId = data._id.$oid;
        setName = data.name;

        tableNode = document.createElement('table');
        tableNode.className = 'table table-striped table-condensed';
        tableNode.className += 'table-hover clickable-table hidden';
        tableNode.id = 'table-set-' + setId;
        tableCaption = tableNode.createCaption();
        tableCaption.innerHTML = 'Test set:&nbsp;' + setName;

        tableBody = document.createElement('tbody');
        tableNode.appendChild(tableBody);

        docFrag.appendChild(tableNode);

        tableHead = tableNode.createTHead();
        tableRow = tableHead.insertRow();

        // Name.
        var nameHead = document.createElement('th');
        nameHead.innerHTML = 'Test Case Name';
        nameHead.className = 'name-column';
        tableRow.appendChild(nameHead);

        // Measurements
        var measurementHead = document.createElement('th');
        measurementHead.innerHTML = 'Measurements';
        measurementHead.className = 'measurement-column';
        tableRow.appendChild(measurementHead);

        // Date.
        var dateHead = document.createElement('th');
        dateHead.innerHTML = 'Date';
        dateHead.className = 'date-column pull-center';
        tableRow.appendChild(dateHead);

        // Status.
        var statusHead = document.createElement('th');
        statusHead.innerHTML = 'Status';
        statusHead.className = 'pull-center';
        tableRow.appendChild(statusHead);

        // The "select" cell, nothing to write as title.
        var logHead = document.createElement('th');
        logHead.innerHTML = 'Log';
        logHead.className = 'pull-center';
        tableRow.appendChild(logHead);

        tableRow.insertCell();

    }

    function getMultiSetsDataDone(response) {
        var docFrag;
        var results;
        var table;
        var tableId;

        tableId = 'sets-reports-div';
        // Because we have an aggregate of deferred
        results = response[0].result;
        table = document.getElementById(tableId);

        docFrag = document.createDocumentFragment();

        // For each test set create a table
        results.forEach(function(result) {
            createSetTable(result, docFrag);
        });

        table.appendChild(docFrag);
    }

    function getTestSetAndCaseDataFail() {
        html.removeChildren(
            document.getElementById('sets-reports-loading-div'));
        html.replaceContent(
            document.getElementById('cases-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getTestSetAndCaseData() {
        var deferredSet;
        var resultSetLength;
        var deferredCase;
        var resultCaseLength;

        deferredSet =
            request.get('/_ajax/test/set',{test_suite_id: gSuiteId});

        deferredCase =
            request.get('/_ajax/test/case',{test_suite_id: gSuiteId});

        // Get all the data first and then update it sequentially
        // To avoid having the case results before the sets table creation
        $.when(deferredSet, deferredCase)
            .fail(error.error, getTestSetAndCaseDataFail)
            .done(function(responseSet, responseCase) {

                getMultiSetsDataDone(responseSet);
                resultSetLength = responseSet[0].result.length;

                getMultiCasesDataDone(responseCase);
                resultCaseLength = responseCase[0].result.length;
            });

        //If there's no test set and case for this test suite update content
        if ((resultSetLength === 0) && (resultCaseLength === 0)) {
            html.removeChildren(
                document.getElementById('sets-reports-loading-div'));
            html.replaceContent(
                document.getElementById('cases-reports-table-div'),
                html.errorDiv('No data available for this test suite.'));
        }
        else {
            html.removeElement(
                document.getElementById('sets-reports-loading-div'));
        }

    }

    function getSuiteDataFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
        document.getElementById('body-title')
            .insertAdjacentHTML('beforeend', '&hellip;');
    }

    function getSuiteDataDone(response) {
        var aNode;
        var arch;
        var board;
        var branch;
        var createdOn;
        var defconfigFull;
        var docFrag;
        var job;
        var kernel;
        var lab;
        var result;
        var smallNode;
        var spanNode;
        var str;
        var suiteName;
        var testTime;
        var tooltipNode;

        // We only have one result.
        result = response.result[0];
        testTime = new Date(result.time.$date);
        createdOn = new Date(result.created_on.$date);
        board = result.board;
        job = result.job;
        branch = result.git_branch;
        kernel = result.kernel;
        defconfigFull = result.defconfig_full;
        arch = result.arch;
        lab = result.lab_name;
        suiteName = result.name;

        // Body title.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        spanNode.insertAdjacentHTML('beforeend', '&#171;');
        spanNode.appendChild(document.createTextNode(suiteName));
        spanNode.insertAdjacentHTML('beforeend', '&#187;');
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

        smallNode = spanNode.appendChild(document.createElement('small'));
        str = '(';
        str += lab;
        str += ')';
        smallNode.appendChild(document.createTextNode(str));

        document.getElementById('body-title').appendChild(docFrag);

        // Lab.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        str = 'Test reports for lab&nbsp';
        str += lab;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/test/all/lab/';
        str += lab;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(lab));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(document.getElementById('dd-lab-name'), docFrag);

        // Board.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        str = 'Test reports for board&nbsp;';
        str += board;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/test/';
        str += board;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(board));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(
            document.getElementById('dd-suite-board'), docFrag);

        // Tree.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Test reports for&nbsp;';
        str += job;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/test/all/job/';
        str += job;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(job));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Details for tree&nbsp;';
        str += job;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/job/';
        str += job;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.tree());

        html.replaceContent(document.getElementById('dd-suite-tree'), docFrag);

        // Branch.
        html.replaceContent(
            document.getElementById('dd-suite-branch'),
            document.createTextNode(branch));

        // Kernel.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Test reports for&nbsp;';
        str += job;
        str += '&nbsp;&dash;&nbsp;';
        str += kernel;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/test/all/job/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(kernel));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Build reports for&nbsp;';
        str += job;
        str += '&nbsp;&dash;&nbsp;';
        str += kernel;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/build/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.build());

        html.replaceContent(
            document.getElementById('dd-suite-kernel'), docFrag);

        // Defconfig
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));
        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Test reports');

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/test/';
        str += board;
        str += '/job/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/defconfig/';
        str += defconfigFull;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(defconfigFull));

        if (result.build_id) {
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Build details');
            aNode = tooltipNode.appendChild(document.createElement('a'));
            str ='/build/id/';
            str += result.build_id.$oid;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.build());
        }

        html.replaceContent(
            document.getElementById('dd-suite-defconfig'), docFrag);

        // Date.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('time'));
        spanNode.setAttribute('datetime', createdOn.toISOString());
        spanNode.appendChild(
            document.createTextNode(createdOn.toCustomISODateTime()));
        html.replaceContent(document.getElementById('dd-date'), docFrag);

        // Status.
        // TODO Fix when defined
        html.replaceContent(
            document.getElementById('dd-suite-status'), html.nonavail());

        // Errors
        // TODO Fix when defined
        html.replaceContent(
            document.getElementById('dd-suite-errors'), html.nonavail());

        // Warnings
        // TODO Fix when defined
        html.replaceContent(
            document.getElementById('dd-suite-warnings'), html.nonavail());

        // Arch.
        html.replaceContent(
            document.getElementById('dd-suite-arch'),
            document.createTextNode(arch));

        // Time.
        html.replaceContent(
            document.getElementById('dd-suite-test-time'),
            document.createTextNode(testTime.toCustomTime()));
    }

    function getBootLog(response) {
        var bootLog;
        var pathURI;
        var result;
        var serverURI;
        var serverURL;
        var translatedURI;
        var lab;

        result = response.result[0]; // We only have one result.
        serverURL = result.file_server_url;
        lab = result.lab_name;

        if (!serverURL) {
            serverURL = gFileServer;
        }

        translatedURI = u.createFileServerURL(serverURL, result);
        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        bootLog = tboot.createBootLog(
            result.boot_log,
            result.boot_log_html,
            lab,
            serverURI,
            pathURI
        );
        gLogHref = u.getHref(serverURI, [
            pathURI,
            lab,
            result.boot_log_html
        ]);

        if (bootLog) {
            html.replaceContent(
                document.getElementById('dd-suite-test-log'), bootLog);
        } else {
            html.replaceContent(
                document.getElementById('dd-suite-test-log'), html.nonavail());
        }

        setTimeout(getTestSetAndCaseData, 25);
    }

    function getSuiteData() {
        $.when(request.get('/_ajax/test/suite', {id: gSuiteId}))
            .fail(
                error.error,
                getSuiteDataFail
                )
            .done(
                getSuiteDataDone,
                getBootLog
                );
    }

    if (document.getElementById('suite-id') !== null) {
        gSuiteId = document.getElementById('suite-id').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    setTimeout(getSuiteData, 10);

});
