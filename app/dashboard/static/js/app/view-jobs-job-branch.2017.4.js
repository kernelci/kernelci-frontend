/*!
 * kernelci dashboard.
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
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/request',
    'utils/error',
    'utils/table',
    'utils/urls',
    'charts/passrate',
    'utils/html',
    'tables/job',
    'utils/date'
], function($, init, format, r, e, table, u, chart, html, jobt) {
    'use strict';
    var gBranchName;
    var gBuildsTable;
    var gJobName;
    var gNumberRange;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
    }, 15);

    gNumberRange = 20;

    function getTestStatsFail() {
        html.replaceContent(
            document.getElementById('test-pass-rate'),
            html.errorDiv('Error loading test data.'));
    }

    function getTestStatsDone(response) {
        chart.testpassrate('test-pass-rate', response);
    }

    function getTestStats(startDate, dateRange) {
        var data;
        var deferred;

        data = {
            job: gJobName,
            git_branch: gBranchName,
            sort: 'created_on',
            sort_order: 1,
            created_on: startDate,
            date_range: dateRange,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/test/case', data);
        $.when(deferred)
            .fail(e.error, getTestStatsFail)
            .done(getTestStatsDone);
    }

    function getBuildsStatsFail() {
        html.replaceContent(
            document.getElementById('build-pass-rate'),
            html.errorDiv('Error loading build data.'));
    }

    function getBuildsStatsDone(response) {
        chart.buildpassrate('build-pass-rate', response);
    }

    function getBuildsStats(startDate, dateRange) {
        var data;
        var deferred;

        data = {
            job: gJobName,
            git_branch: gBranchName,
            sort: 'created_on',
            sort_order: 1,
            created_on: startDate,
            date_range: dateRange,
            field: ['status', 'kernel', 'created_on', 'job']
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsStatsFail)
            .done(getBuildsStatsDone);
    }

    function getTrendsData(response) {
        var firstDate;
        var lDateRange;
        var lastDate;
        var resLen;
        var results;

        results = response.result;
        resLen = results.length;
        lDateRange = 0;

        if (resLen > 0) {
            firstDate = new Date(results[0].created_on.$date);
            if (resLen > 1) {
                lastDate = new Date(results[resLen - 1].created_on.$date);
                lDateRange = Math.round((firstDate - lastDate) / 86400000);
            }

            setTimeout(function() {
                getBuildsStats(firstDate.toCustomISODate(), lDateRange);
            }, 25);
            setTimeout(function() {
                getTestStats(firstDate.toCustomISODate(), lDateRange);
            }, 25);
        } else {
            html.replaceContent(
                document.getElementById('build-pass-rate'),
                html.errorDiv('No build data available.'));

            html.replaceContent(
                document.getElementById('test-pass-rate'),
                html.errorDiv('No test data available.'));
        }
    }

    function getBuildTestsCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBuildTestsCountDone(response) {
        var batchData;

        function parseBatchData(data) {
            html.replaceContent(
                document.getElementById(data.operation_id),
                document.createTextNode(data.result[0].count));
        }

        batchData = response.result;

        if (batchData.length > 0) {
            batchData.forEach(parseBatchData);
        }
        // Perform the table search now, after completing all operations.
        gBuildsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBuildTestsCount(response) {
        var batchOps;
        var deferred;
        var kernel;
        var opId;
        var qHead;
        var queryStr;
        var results;

        function createBatchOp(result) {
            kernel = result.kernel;
            queryStr = 'job=';
            queryStr += gJobName;
            queryStr += '&kernel=';
            queryStr += kernel;
            queryStr += '&git_branch=';
            queryStr += gBranchName;

            // Get total build count.
            opId = 'build-total-count-';
            opId += kernel;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: queryStr
            });

            // Get the successful build count.
            opId = 'build-success-count-';
            opId += kernel;
            qHead = 'status=PASS&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get failed build count.
            opId = 'build-fail-count-';
            opId += kernel;
            qHead = 'status=FAIL&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get unknown build count.
            opId = 'build-unknown-count-';
            opId += kernel;
            qHead = 'status=UNKNOWN&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'build',
                query: qHead
            });

            // Get total tests count.
            opId = 'test-total-count-';
            opId += kernel;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: queryStr
            });

            // Get successful tests count.
            opId = 'test-success-count-';
            opId += kernel;
            qHead = 'status=PASS&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_case',
                query: qHead
            });

            // Get regressions count.
            opId = 'test-fail-count-';
            opId += kernel;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'test_regression',
                query: queryStr
            });

            // Get unknown test reports count.
            opId = 'test-unknown-count-';
            opId += kernel;
            qHead = 'status=FAIL&status=SKIP&regression_id=null&';
            qHead += queryStr;
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

            $.when(deferred)
                .fail(e.error, getBuildTestsCountFail)
                .done(getBuildTestsCountDone);
        } else {
            html.replaceByClass('count-badge', '?');
        }
    }

    function getBuildsDone(response) {
        var columns;
        var results;

        /**
         * Create the table column title for the builds count.
        **/
        function _buildColumTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Failed/Unknown build reports');
            tooltipNode.appendChild(
                document.createTextNode('Build Status'));

            return tooltipNode.outerHTML;
        }

        /**
         * Create the table column title for the tests count.
        **/
        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regressions/Other test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderKernel(data, type) {
            var href = '/build/';
            href += gJobName;
            href += '/branch/';
            href += gBranchName;
            href += '/kernel/';
            href += data;
            href += '/';
            return jobt.renderKernel(data, type, href);
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderCommit(data, type, object) {
            var gitURLs;

            gitURLs = u.translateCommit(object.git_url, data);
            return jobt.renderCommit(data, type, gitURLs[1]);
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderTestCount(data, type) {
            var href = '/test/job/';
            href += gJobName;
            href += '/branch/';
            href += gBranchName;
            href += '/kernel/';
            href += data;
            href += '/';
            return jobt.renderTestCount({data: data, type: type, href: href});
        }

        function _renderBuildCount(data, type) {
            return jobt.renderBuildCount({data: data, type: type});
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type) {
            var href = '/build/';
            href += gJobName;
            href += '/branch/';
            href += gBranchName;
            href += '/kernel/';
            href += data;
            href += '/';
            return jobt.renderDetails(href, type);
        }

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No builds data available.'));
        } else {
            columns = [
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: _renderKernel
                },
                {
                    data: 'git_commit',
                    title: 'Commit',
                    type: 'string',
                    className: 'commit-column',
                    render: _renderCommit
                },
                {
                    data: 'kernel',
                    title: _buildColumTitle(),
                    type: 'string',
                    className: 'build-count pull-center',
                    render: _renderBuildCount
                },
                {
                    data: 'kernel',
                    title: _testColumnTitle(),
                    type: 'string',
                    className: 'test-count pull-center',
                    render: _renderTestCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: jobt.renderDate
                },
                {
                    data: 'kernel',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gBuildsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .languageLengthMenu('builds per page')
                .rowURL('/build/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/')
                .rowURLElements(['job', 'git_branch', 'kernel'])
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBuildsFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading build data.'));
    }

    function getBuilds() {
        var data;
        var deferred;

        data = {
            aggregate: 'kernel',
            job: gJobName,
            git_branch: gBranchName,
            sort: 'created_on',
            sort_order: -1,
            limit: gNumberRange,
            field: [
                'created_on',
                'git_branch',
                'git_commit',
                'git_url',
                'job',
                'kernel'
            ]
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(
                e.error,
                getBuildsFailed, getBuildsStatsFail, getTestStatsFail)
            .done(getTrendsData, getBuildsDone, getBuildTestsCount);
    }

    function getDetailsDone(response) {
        var firstCount;
        var firstResult;
        var resLen;
        var results;
        var secondCount;
        var secondResult;
        var thirdCount;
        var thirdResult;

        results = response.result;
        resLen = results.length;

        if (resLen === 3) {
            firstResult = results[0];
            secondResult = results[1];
            thirdResult = results[2];

            firstCount = firstResult.result[0].count;
            secondCount = secondResult.result[0].count;
            thirdCount = thirdResult.result[0].count;

            html.replaceContent(
                document.getElementById(firstResult.operation_id),
                document.createTextNode(format.number(firstCount)));

            html.replaceContent(
                document.getElementById(secondResult.operation_id),
                document.createTextNode(format.number(secondCount)));

            html.replaceContent(
                document.getElementById(thirdResult.operation_id),
                document.createTextNode(format.number(thirdCount)));
        } else {
            html.replaceByClass('count-list-badge', '?');
        }
    }

    function getDetailsFailed() {
        html.replaceByClass('count-list-badge', '&infin;');
    }

    function getDetails() {
        var batchOps;
        var deferred;
        var queryStr;

        queryStr = 'job=';
        queryStr += gJobName;
        queryStr += '&git_branch=';
        queryStr += gBranchName;
        queryStr += '&limit=';
        queryStr += gNumberRange;
        batchOps = [];

        batchOps.push({
            operation_id: 'builds-count',
            method: 'GET',
            resource: 'count',
            document: 'job',
            query: queryStr
        });

        batchOps.push({
            operation_id: 'defconfs-count',
            method: 'GET',
            resource: 'count',
            document: 'build',
            query: queryStr
        });

        batchOps.push({
            operation_id: 'test-results-count',
            method: 'GET',
            resource: 'count',
            document: 'test_case',
            query: queryStr
        });

        deferred = r.post('/_ajax/batch', JSON.stringify({batch: batchOps}));
        $.when(deferred)
            .fail(e.error, getDetailsFailed)
            .done(getDetailsDone);
    }

    if (document.getElementById('number-name') !== null) {
        gNumberRange = document.getElementById('number-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranchName = document.getElementById('branch-name').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gBuildsTable = table({
        tableId: 'jobstable',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(getBuilds, 10);
    setTimeout(getDetails, 50);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
