/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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

    function getBootStatsFail() {
        html.replaceContent(
            document.getElementById('boot-pass-rate'),
            html.errorDiv('Error loading boot data.'));
    }

    function getBootStatsDone(response) {
        chart.bootpassrate('boot-pass-rate', response);
    }

    function getBootStats(startDate, dateRange) {
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

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootStatsFail)
            .done(getBootStatsDone);
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

            getBuildsStats(firstDate.toCustomISODate(), lDateRange);
            getBootStats(firstDate.toCustomISODate(), lDateRange);
        } else {
            html.replaceContent(
                document.getElementById('build-pass-rate'),
                html.errorDiv('No build data available.'));

            html.replaceContent(
                document.getElementById('boot-pass-rate'),
                html.errorDiv('No boot data available.'));
        }
    }

    function getBuildBootCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBuildBootCountDone(response) {
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

    function getBuildBootCount(response) {
        var batchOps;
        var deferred;
        var kernel;
        var results;
        var queryStr;

        function createBatchOp(result) {
            kernel = result.kernel;
            queryStr = 'job=';
            queryStr += gJobName;
            queryStr += '&kernel=';
            queryStr += kernel;
            queryStr += '&git_branch=';
            queryStr += gBranchName;

            // Get total build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-total-count-' + kernel,
                resource: 'count',
                document: 'build',
                query: queryStr
            });

            // Get the successful build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-success-count-' + kernel,
                resource: 'count',
                document: 'build',
                query: 'status=PASS&' + queryStr
            });

            // Get failed build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-fail-count-' + kernel,
                resource: 'count',
                document: 'build',
                query: 'status=FAIL&' + queryStr
            });

            // Get unknown build count.
            batchOps.push({
                method: 'GET',
                operation_id: 'build-unknown-count-' + kernel,
                resource: 'count',
                document: 'build',
                query: 'status=UNKNOWN&' + queryStr
            });

            // Get total boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-total-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: queryStr
            });

            // Get successful boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-success-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=PASS&' + queryStr
            });

            // Get failed boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-fail-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=FAIL&' + queryStr
            });

            // Get unknown boot reports count.
            batchOps.push({
                method: 'GET',
                operation_id: 'boot-unknown-count-' + kernel,
                resource: 'count',
                document: 'boot',
                query: 'status=OFFLINE&status=UNTRIED&' + queryStr
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(createBatchOp);

            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(e.error, getBuildBootCountFail)
                .done(getBuildBootCountDone);
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
         * Create the table column title for the boots count.
        **/
        function _bootColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Failed/Other boot reports');
            tooltipNode.appendChild(
                document.createTextNode('Boot Status'));

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
        function _renderBootCount(data, type) {
            var href = '/boot/all/job/';
            href += gJobName;
            href += '/branch/';
            href += gBranchName;
            href += '/kernel/';
            href += data;
            return jobt.renderTableBootCount(data, type, href);
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
                    render: jobt.renderTableBuildCount
                },
                {
                    data: 'kernel',
                    title: _bootColumnTitle(),
                    type: 'string',
                    className: 'boot-count pull-center',
                    render: _renderBootCount
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
                .rowURLElements(['job', 'kernel'])
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
                'job', 'kernel', 'created_on', 'git_commit', 'git_url'
            ]
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(
                e.error,
                getBuildsFailed, getBuildsStatsFail, getBootStatsFail)
            .done(getTrendsData, getBuildsDone, getBuildBootCount);
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
            operation_id: 'boot-reports-count',
            method: 'GET',
            resource: 'count',
            document: 'boot',
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

    setTimeout(getDetails, 10);
    setTimeout(getBuilds, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
