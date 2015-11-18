/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/html',
    'utils/table',
    'utils/request',
    'utils/error',
    'tables/soc'
], function($, init, base, html, table, request, error, tsoc) {
    'use strict';
    var gBootsTable,
        gJob,
        gSoc,
        gNumberRange,
        gQueryStr,
        gSearchFilter;

    function updateCountDetail(result) {
        html.replaceContent(
            document.getElementById(result.operation_id),
            document.createTextNode(
                base.formatNumber(parseInt(result.result[0].count, 10)))
        );
    }

    function getDetailsDone(response) {
        var results;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('count-list-badge', '?');
        } else {
            results.forEach(updateCountDetail);
        }
    }

    function getDetails() {
        var batchOps,
            deferred;

        batchOps = [];
        batchOps.push({
            method: 'GET',
            operation_id: 'boots-count',
            resource: 'count',
            document: 'boot',
            query: gQueryStr
        });

        batchOps.push({
            method: 'GET',
            operation_id: 'boards-count',
            distinct: 'board',
            resource: 'boot',
            query: gQueryStr
        });

        deferred = request.post(
            '/_ajax/batch', JSON.stringify({batch: batchOps}));

        $.when(deferred)
            .fail(error.error)
            .done(getDetailsDone);
    }

    function getBootsCountFail() {
        html.replaceByClassHTML('count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        results = response.result;

        if (results.length === 0) {
            html.replaceByClassTxt('count-badge', '?');
        } else {
            results.forEach(updateCountDetail);
        }
    }

    function getBootsCount(response) {
        var batchOps,
            deferred,
            failStr,
            kernel,
            results,
            successStr;

        batchOps = [];
        successStr = gQueryStr + '&status=PASS';
        failStr = gQueryStr + '&status=FAIL';

        function _prepareBatchOps(result) {
            kernel = result.kernel;
            batchOps.push({
                operation_id: 'success-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: successStr + '&kernel=' + kernel
            });

            batchOps.push({
                operation_id: 'fail-count-' + kernel,
                method: 'GET',
                resource: 'count',
                document: 'boot',
                query: failStr + '&kernel=' + kernel
            });
        }

        results = response.result;
        if (results.length > 0) {
            results.forEach(_prepareBatchOps);

            deferred = request.post(
                '/_ajax/batch', JSON.stringify({batch: batchOps}));

            $.when(deferred)
                .fail(error.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns,
            results;

        // Internal wrapper.
        function _renderBootCount(data, type) {
            return tsoc.countSuccessFail({
                data: data,
                type: type,
                extraClasses: ['extra-margin']
            });
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'kernel',
                    title: 'Kernel',
                    className: 'kernel-column'
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    className: 'branch-column'
                },
                {
                    data: 'git_commit',
                    title: 'Commit',
                    className: 'commit-column'
                },
                {
                    data: 'kernel',
                    title: 'Boot Status',
                    className: 'boot-count pull-center',
                    render: _renderBootCount
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    className: 'date-column pull-center',
                    render: tsoc.renderDate
                }
            ];

            gBootsTable
                .columns(columns)
                .data(results)
                .noIdURL(true)
                .paging(false)
                .info(false)
                .order([4, 'desc'])
                .draw();

            gBootsTable
                .search(gSearchFilter);
        }
    }

    function getBoots() {
        var deferred;

        deferred = request.get(
            '/_ajax/boot',
            {
                aggregate: 'kernel',
                limit: gNumberRange,
                field: [
                    'build_id',
                    'created_on',
                    'git_branch',
                    'git_commit',
                    'job',
                    'job_id',
                    'kernel'
                ],
                job: gJob,
                mach: gSoc,
                sort: 'created_on',
                sort_order: -1
            }
        );

        $.when(deferred)
            .fail(error.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
    }

    document.getElementById('li-soc').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('soc-name') !== null) {
        gSoc = document.getElementById('soc-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gQueryStr = 'mach=' + gSoc + '&job=' + gJob;
    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    getDetails();
    getBoots();
});
