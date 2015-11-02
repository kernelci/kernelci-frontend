/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/const',
    'utils/date'
], function($, init, e, r, t, html, appconst) {
    'use strict';
    var dateRange,
        jobsTable,
        pageLen,
        searchFilter;

    document.getElementById('li-job').setAttribute('class', 'active');
    dateRange = appconst.MAX_DATE_RANGE;
    searchFilter = null;
    pageLen = null;

    function bootColumnTitle() {
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Successful/Failed boot reports for latest job');
        tooltipNode.appendChild(
            document.createTextNode('Latest Boot Status'));

        return tooltipNode.outerHTML;
    }

    function buildColumTitle() {
        var tooltipNode;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Successful/Failed build reports for latest job');
        tooltipNode.appendChild(
            document.createTextNode('Latest Build Status'));

        return tooltipNode.outerHTML;
    }

    function getBatchCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBatchCountDone(response) {
        var bResult,
            resLen,
            results;

        results = response[0].result;
        resLen = results.length;

        if (resLen > 0) {
            results.forEach(function(result) {
                bResult = result.result[0];
                html.replaceContent(
                    document.getElementById(result.operation_id),
                    document.createTextNode(bResult.count));
            });
        }

        // Perform the table search now, after completing all operations.
        jobsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBatchCount(response) {
        var batchElements,
            batchOps,
            data,
            deferred,
            idx,
            jdx,
            job,
            kernel,
            queriesLen,
            resLen,
            results;

        results = response.result;
        resLen = results.length;
        deferred = null;

        if (resLen > 0) {
            idx = 0;
            jdx = 0;
            batchElements = 4;
            queriesLen = resLen * 4;
            batchOps = new Array(queriesLen);
            job = '';
            kernel = '';

            for (idx; idx < queriesLen; idx += batchElements) {
                jdx = idx;
                job = results[idx / batchElements].job;
                kernel = results[idx / batchElements].kernel;

                // Get successful build count.
                batchOps[idx] = {
                    method: 'GET',
                    operation_id: 'defconf-success-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed build count.
                batchOps[jdx + 1] = {
                    method: 'GET',
                    operation_id: 'defconf-fail-count-' + job,
                    resource: 'count',
                    document: 'build',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };

                // Get successful boot reports count.
                batchOps[jdx + 2] = {
                    method: 'GET',
                    operation_id: 'boot-success-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + job + '&kernel=' + kernel
                };

                // Get failed boot reports count.
                batchOps[jdx + 3] = {
                    method: 'GET',
                    operation_id: 'boot-fail-count-' + job,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + job + '&kernel=' + kernel
                };
            }

            data = JSON.stringify({batch: batchOps});
            deferred = r.post('/_ajax/batch', data);
        }

        return deferred;
    }

    function getJobsFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getJobsDone(response) {
        var columns,
            len,
            results;

        results = response.result;
        len = response.count;

        if (len === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No jobs data available.'));
        } else {
            columns = [
                {
                    data: 'job',
                    title: 'Tree &dash; Branch',
                    type: 'string',
                    render: function(data, type, object) {
                        var aNode,
                            branch,
                            branchNode,
                            rendered;

                        branch = object.git_branch;
                        rendered = data;

                        if (branch !== null && branch !== undefined) {
                            rendered = rendered + ' ' + branch;
                        }

                        if (type === 'display') {
                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute('href', '/job/' + data + '/');

                            aNode.appendChild(document.createTextNode(data));

                            if (branch !== null && branch !== undefined) {
                                branchNode = document.createElement('small');
                                branchNode.appendChild(
                                    document.createTextNode(branch));

                                aNode.insertAdjacentHTML(
                                    'beforeend', '&nbsp;&dash;&nbsp;');
                                aNode.appendChild(branchNode);
                            }

                            rendered = aNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'job',
                    title: buildColumTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: function(data, type) {
                        var aNode,
                            badgeNode,
                            divNode,
                            iNode,
                            rendered;

                        rendered = null;
                        if (type === 'display') {
                            divNode = document.createElement('div');
                            aNode = document.createElement('a');
                            aNode.className = 'clean-link';
                            aNode.setAttribute('href', '/job/' + data + '/');

                            badgeNode = document.createElement('span');
                            badgeNode.id = 'defconf-success-count-' + data;
                            badgeNode.className =
                                'badge alert-success extra-margin count-badge';

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);
                            aNode.appendChild(badgeNode);

                            badgeNode = document.createElement('span');
                            badgeNode.id = 'defconf-fail-count-' + data;
                            badgeNode.className =
                                'badge alert-danger extra-margin count-badge';

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
                    data: 'job',
                    title: bootColumnTitle(),
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: function(data, type) {
                        var aNode,
                            badgeNode,
                            divNode,
                            iNode,
                            rendered;

                        rendered = null;
                        if (type === 'display') {
                            divNode = document.createElement('div');
                            aNode = document.createElement('a');
                            aNode.className = 'clean-link';
                            aNode.setAttribute(
                                'href', '/boot/all/job/' + data + '/');

                            badgeNode = document.createElement('span');
                            badgeNode.id = 'boot-success-count-' + data;
                            badgeNode.className =
                                'badge alert-success extra-margin count-badge';

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            badgeNode.appendChild(iNode);
                            aNode.appendChild(badgeNode);

                            badgeNode = document.createElement('span');
                            badgeNode.id = 'boot-fail-count-' + data;
                            badgeNode.className =
                                'badge alert-danger extra-margin count-badge';

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
                    className: 'pull-center',
                    render: function(data, type) {
                        var created,
                            iNode,
                            rendered,
                            timeNode,
                            tooltipNode;

                        if (data === null) {
                            rendered = data;
                            if (type === 'display') {
                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('Not available');

                                iNode = document.createElement('i');
                                iNode.className = 'fa fa-ban';

                                tooltipNode.appendChild(iNode);
                                rendered = tooltipNode.outerHTML;
                            }
                        } else {
                            created = new Date(data.$date);
                            rendered = created.toCustomISODate();

                            if (type === 'display') {
                                timeNode = document.createElement('time');
                                timeNode.setAttribute(
                                    'datetime', created.toISOString());
                                timeNode.appendChild(
                                    document.createTextNode(
                                        created.toCustomISODate())
                                );
                                rendered = timeNode.outerHTML;
                            }
                        }

                        return rendered;
                    }
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: function(data, type) {
                        var tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();

                            switch (data) {
                                case 'BUILD':
                                    tooltipNode.setAttribute(
                                        'title', 'Building');
                                    tooltipNode.appendChild(html.building());
                                    break;
                                case 'PASS':
                                    tooltipNode.setAttribute(
                                        'title', 'Build completed');
                                    tooltipNode.appendChild(html.success());
                                    break;
                                case 'FAIL':
                                    tooltipNode.setAttribute(
                                        'title', 'Build failed');
                                    tooltipNode.appendChild(html.fail());
                                    break;
                                default:
                                    tooltipNode.setAttribute(
                                        'title', 'Unknown status');
                                    tooltipNode.appendChild(html.unknown());
                                    break;
                            }

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'job',
                    title: '',
                    searchable: false,
                    orderable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: function(data, type) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode;

                        rendered = null;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Details for&nbsp;' + data);

                            aNode = document.createElement('a');
                            aNode.setAttribute('href', '/job/' + data + '/');

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

            jobsTable
                .tableData(results)
                .columns(columns)
                .order([3, 'desc'])
                .menu('jobs per page')
                .rowURL('/job/%(job)s/')
                .rowURLElements(['job'])
                .noIDUrl(true)
                .draw();
        }
    }

    // A deferred version of getJobsDone.
    function getJobsDoneD(response) {
        var deferred;

        deferred = $.Deferred();
        deferred.resolve(getJobsDone(response));

        return deferred.promise();
    }

    function getJobsDoneMulti(response) {
        $.when(getBatchCount(response), getJobsDoneD(response))
            .fail(e.error, getBatchCountFail)
            .done(getBatchCountDone);
    }

    function getJobs() {
        var data,
            deferred;

        data = {
            aggregate: 'job',
            sort: 'created_on',
            sort_order: -1,
            date_range: dateRange,
            field: [
                'job', 'kernel', 'status', 'created_on', 'git_branch'
            ]
        };

        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDoneMulti);
    }

    init.hotkeys();
    init.tooltip();

    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }

    jobsTable = t(['jobstable', 'table-loading', 'table-div'], true);
    getJobs();
});
