/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error',
    'utils/table',
    'utils/urls',
    'charts/passrate',
    'utils/html',
    'utils/date'
], function($, init, b, r, e, table, u, chart, html) {
    'use strict';
    var gBranchRegEx,
        gBuildsTable,
        gJobName,
        gNumberRange,
        gPageLen,
        gSearchFilter,
        gTableDom;

    document.getElementById('li-job').setAttribute('class', 'active');

    gJobName = null;
    gPageLen = null;
    gSearchFilter = null;

    gNumberRange = 20;
    // Needed to translate git branch refnames from x/y into x:y or the
    // forward slash will not work with URLs.
    gBranchRegEx = new RegExp('/+', 'g');

    gTableDom = '<"row"' +
            '<"col-xs-6 col-sm-6 col-md-12 col-lg-12"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>';

    function getBootStatsFail() {
        html.replaceContent(
            document.getElementById('boot-pass-rate'),
            html.errorDiv('Error loading boot data.'));
    }

    function getBootStatsDone(response) {
        chart.bootpassrate('boot-pass-rate', response);
    }

    function getBootStats(startDate, dateRange) {
        var deferred,
            data;

        data = {
            job: gJobName,
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
        var deferred,
            data;

        data = {
            job: gJobName,
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
        var firstDate,
            lDateRange,
            lastDate,
            resLen,
            results;

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
        var batchCount,
            batchData;

        batchData = response.result;

        if (batchData.length > 0) {
            batchData.forEach(function(batchRes) {
                batchCount = batchRes.result[0].count;
                html.replaceContent(
                    document.getElementById(batchRes.operation_id),
                    document.createTextNode(batchCount));
            });
        }
        // Perform the table search now, after completing all operations.
        gBuildsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBuildBootCount(response) {
        var batchElements,
            batchQueries,
            data,
            deferred,
            jdx,
            kdx,
            kernel,
            resLen,
            results,
            queriesLen,
            zdx;

        results = response.result;
        resLen = results.length;
        batchElements = 4;

        if (resLen > 0) {
            queriesLen = resLen * 4;
            batchQueries = new Array(queriesLen);
            zdx = 0;
            jdx = 0;
            kdx = 0;

            for (zdx; zdx < queriesLen; zdx = zdx + batchElements) {
                jdx = zdx;
                kdx = zdx / batchElements;
                kernel = results[kdx].kernel;

                // Get successful build count.
                batchQueries[zdx] = {
                    method: 'GET',
                    operation_id: 'build-success-count-' + kdx,
                    resource: 'count',
                    document: 'build',
                    query: 'status=PASS&job=' + gJobName + '&kernel=' + kernel
                };

                // Get failed build count.
                batchQueries[jdx + 1] = {
                    method: 'GET',
                    operation_id: 'build-fail-count-' + kdx,
                    resource: 'count',
                    document: 'build',
                    query: 'status=FAIL&job=' + gJobName + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchQueries[jdx + 2] = {
                    method: 'GET',
                    operation_id: 'boot-success-count-' + kdx,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + gJobName + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchQueries[jdx + 3] = {
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + kdx,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + gJobName + '&kernel=' + kernel
                };
            }

            data = JSON.stringify({
                batch: batchQueries
            });

            deferred = r.post('/_ajax/batch', data);

            $.when(deferred)
                .fail(e.error, getBuildBootCountFail)
                .done(getBuildBootCountDone);
        } else {
            html.replaceByClass('count-badge', '?');
        }
    }

    function getBuildsDone(response) {
        var columns,
            results;

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No builds data available.'));
        } else {
            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: function(data, type) {
                        var aNode,
                            rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', data);

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/build/' + gJobName + '/kernel/' + data);

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column',
                    render: function(data, type) {
                        var aNode,
                            branch,
                            rendered,
                            tooltipNode;

                        branch = data.replace(gBranchRegEx, ':', 'g');
                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', data);

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/job/' + gJobName + '/branch/' + branch);

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'git_commit',
                    title: 'Commit',
                    type: 'string',
                    className: 'commit-column',
                    render: function(data, type, object) {
                        var aNode,
                            gitURLs,
                            rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', data);

                            gitURLs = u.translateCommit(object.git_url, data);

                            if (gitURLs[1] !== null) {
                                aNode = document.createElement('a');
                                aNode.className = 'table-link';
                                aNode.setAttribute(
                                    'href', gitURLs[1]);

                                aNode.appendChild(
                                    document.createTextNode(data));
                            } else {
                                aNode = document.createTextNode(data);
                            }

                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'kernel',
                    title: '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="Successful/Failed defconfigs built">' +
                        'Build Status</span>',
                    type: 'string',
                    className: 'build-count pull-center',
                    render: function(data, type, object, meta) {
                        var badgeNode,
                            divNode,
                            iNode,
                            idx,
                            rendered;

                        rendered = null;
                        if (type === 'display') {
                            idx = meta.row;
                            divNode = document.createElement('div');

                            badgeNode = document.createElement('span');
                            badgeNode.className =
                                'badge alert-success extra-margin count-badge';
                            badgeNode.id = 'build-success-count-' + idx;

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);

                            divNode.appendChild(badgeNode);

                            badgeNode = document.createElement('span');
                            badgeNode.className =
                                'badge alert-danger extra-margin count-badge';
                            badgeNode.id = 'build-fail-count-' + idx;

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);
                            divNode.appendChild(badgeNode);

                            rendered = divNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'kernel',
                    title: '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="Successful/Failed boot reports">' +
                        'Boot Status</span>',
                    type: 'string',
                    className: 'boot-count pull-center',
                    render: function(data, type, object, meta) {
                        var aNode,
                            badgeNode,
                            divNode,
                            iNode,
                            idx,
                            rendered;

                        rendered = null;
                        if (type === 'display') {
                            idx = meta.row;
                            divNode = document.createElement('div');
                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/boot/all/job/' + object.job +
                                '/kernel/' + data
                            );

                            badgeNode = document.createElement('span');
                            badgeNode.className =
                                'badge alert-success extra-margin count-badge';
                            badgeNode.id = 'boot-success-count-' + idx;

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);

                            aNode.appendChild(badgeNode);

                            badgeNode = document.createElement('span');
                            badgeNode.className =
                                'badge alert-danger extra-margin count-badge';
                            badgeNode.id = 'boot-fail-count-' + idx;

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);
                            aNode.appendChild(badgeNode);
                            divNode.appendChild(aNode);

                            rendered = divNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: function(data, type) {
                        var created;

                        created = new Date(data.$date);
                        if (type === 'display' || type === 'filter') {
                            created = created.toCustomISODate();
                        }

                        return created;
                    }
                },
                {
                    data: 'kernel',
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            job,
                            rendered,
                            tooltipNode;

                        rendered = null;
                        if (type === 'display') {
                            job = object.job;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Details for build&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + data
                            );

                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/build/' + job + '/kernel/' + data + '/');

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-search';

                            aNode.appendChild(iNode);
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                }
            ];

            gBuildsTable
                .dom(gTableDom)
                .noIdURL(true)
                .data(results)
                .columns(columns)
                .order([6, 'desc'])
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
        var data,
            deferred;

        data = {
            aggregate: 'kernel',
            job: gJobName,
            sort: 'created_on',
            sort_order: -1,
            limit: gNumberRange,
            field: [
                'job',
                'kernel', 'created_on', 'git_branch', 'git_commit', 'git_url'
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
        var firstCount,
            firstResult,
            resLen,
            results,
            secondCount,
            secondResult,
            thirdCount,
            thirdResult;

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
                document.createTextNode(b.formatNumber(firstCount)));

            html.replaceContent(
                document.getElementById(secondResult.operation_id),
                document.createTextNode(b.formatNumber(secondCount)));

            html.replaceContent(
                document.getElementById(thirdResult.operation_id),
                document.createTextNode(b.formatNumber(thirdCount)));
        } else {
            html.replaceByClass('count-list-badge', '?');
        }
    }

    function getDetailsFailed() {
        html.replaceByClass('count-list-badge', '&infin;');
    }

    function getDetails() {
        var batchQueries,
            deferred,
            queryString;

        queryString = 'job=' + gJobName;
        batchQueries = new Array(3);

        batchQueries[0] = {
            operation_id: 'builds-count',
            method: 'GET',
            resource: 'count',
            document: 'job',
            query: queryString
        };

        batchQueries[1] = {
            operation_id: 'defconfs-count',
            method: 'GET',
            resource: 'count',
            document: 'build',
            query: queryString
        };

        batchQueries[2] = {
            operation_id: 'boot-reports-count',
            method: 'GET',
            resource: 'count',
            document: 'boot',
            query: queryString
        };

        deferred = r.post(
            '/_ajax/batch', JSON.stringify({batch: batchQueries}));

        $.when(deferred)
            .fail(e.error, getDetailsFailed)
            .done(getDetailsDone);
    }

    init.hotkeys();
    init.tooltip();

    if (document.getElementById('number-name') !== null) {
        gNumberRange = document.getElementById('number-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
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
        tableDivId: 'table-div',
        disableSearch: true
    });
    getDetails();
    getBuilds();
});
