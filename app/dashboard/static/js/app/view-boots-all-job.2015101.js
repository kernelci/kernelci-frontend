/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/date'
], function($, b, e, init, r, t, html) {
    'use strict';
    var bootsTable,
        jobName,
        numberRange,
        pageLen,
        searchFilter;

    numberRange = 20;

    function getDetailsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boot-reports-count'), '&infin;');
        html.replaceContentHTML(
            document.getElementById('boot-boards-count'), '&infin;');
    }

    function getDetailsCountDone(response) {
        var boardsCount,
            reportsCount,
            results;

        results = response.result;
        reportsCount = 0;
        boardsCount = 0;

        if (results.length) {
            if (results[0].operation_id === 'boot-reports-count') {
                reportsCount = parseInt(results[0].result[0].count, 10);
                boardsCount = parseInt(results[1].result.length, 10);
            } else {
                reportsCount = parseInt(results[1].result[0].count, 10);
                boardsCount = parseInt(results[0].result.length, 10);
            }
        }

        html.replaceContent(
            document.getElementById('boot-reports-count'),
            document.createTextNode(b.formatNumber(reportsCount)));
        html.replaceContent(
            document.getElementById('boot-boards-count'),
            document.createTextNode(b.formatNumber(boardsCount)));
    }

    function getDetailsCount() {
        var batchQueries,
            data,
            deferred;

        batchQueries = new Array(2);
        batchQueries[0] = {
            method: 'GET',
            operation_id: 'boot-reports-count',
            resource: 'count',
            document: 'boot',
            query: 'job=' + jobName + '&limit=' + numberRange
        };

        batchQueries[1] = {
            method: 'GET',
            operation_id: 'boot-boards-count',
            resource: 'boot',
            query: 'job=' + jobName + '&limit=' + numberRange +
                '&aggregate=board&field=board'
        };

        data = JSON.stringify({
            batch: batchQueries
        });
        deferred = r.post('/_ajax/batch', data);
        $.when(deferred)
            .fail(e.error, getDetailsCountFail)
            .done(getDetailsCountDone);
    }

    function getBootsCountFail() {
        html.replaceByClass('fail-badge', '&infin;');
        html.replaceByClass('success-badge', '&infin;');
    }

    function _parseBootsCount(result) {
        var count;

        count = parseInt(result.result[0].count, 10);
        html.replaceContent(
            document.getElementById(result.operation_id),
            document.createTextNode(b.formatNumber(count)));
    }

    function getBootsCountDone(response) {
        var results;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('fail-badge', '&#63;');
            html.replaceByClass('success-badge', '&#63;');
        } else {
            results.forEach(_parseBootsCount);
        }
        // Re-enable the search here.
        bootsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBootsCount(response) {
        var batchElements,
            batchQueries,
            data,
            deferred,
            idx,
            jdx,
            kernel,
            queriesLen,
            resLen,
            results;

        batchElements = 2;
        results = response.result;
        resLen = results.length;
        queriesLen = resLen * batchElements;
        idx = 0;

        if (resLen > 0) {
            batchQueries = new Array(queriesLen);
            for (idx; idx < queriesLen; idx = idx + batchElements) {
                jdx = idx;
                kernel = results[idx / batchElements].kernel;
                batchQueries[idx] = {
                    method: 'GET',
                    operation_id: 'success-count-' + kernel,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=PASS&job=' + jobName + '&kernel=' +
                        kernel
                };
                batchQueries[jdx + 1] = {
                    method: 'GET',
                    operation_id: 'fail-count-' + kernel,
                    resource: 'count',
                    document: 'boot',
                    query: 'status=FAIL&job=' + jobName + '&kernel=' +
                        kernel
                };
            }

            data = JSON.stringify({
                batch: batchQueries
            });
            deferred = r.post('/_ajax/batch', data);
            $.when(deferred)
                .fail(e.error, getBootsCountFail)
                .done(getBootsCountDone);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading board data.'));
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns,
            rowURLFmt = '/boot/all/job/%(job)s/kernel/%(kernel)s/';

        if (resLen === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No board data found'));
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
                    title: 'Kernel'
                },
                {
                    data: 'kernel',
                    title: 'Successful',
                    className: 'pull-center',
                    render: function(data, type) {
                        var iNode,
                            rendered,
                            spanNode;

                        rendered = null;
                        if (type === 'display') {
                            spanNode = document.createElement('span');
                            spanNode.id = 'success-count-' + data;
                            spanNode.className = 'badge badge-count ' +
                                'alert-success success-badge';

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            spanNode.appendChild(iNode);
                            rendered = spanNode.outerHTML;
                        }
                        return rendered;
                    }
                },
                {
                    data: 'kernel',
                    title: 'Failed',
                    className: 'pull-center',
                    render: function(data, type) {
                        var iNode,
                            rendered,
                            spanNode;

                        rendered = null;
                        if (type === 'display') {
                            spanNode = document.createElement('span');
                            spanNode.id = 'fail-count-' + data;
                            spanNode.className = 'badge badge-count ' +
                                'alert-danger fail-badge';

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-cog fa-spin';

                            spanNode.appendChild(iNode);
                            rendered = spanNode.outerHTML;
                        }
                        return rendered;
                    }
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    className: 'date-column pull-center',
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
                            if (type === 'display') {
                                timeNode = document.createElement('time');
                                timeNode.setAttribute(
                                    'datetime', created.toISOString());
                                timeNode.appendChild(
                                    document.createTextNode(
                                        created.toCustomISODate())
                                );
                                rendered = timeNode.outerHTML;
                            } else {
                                rendered = created;
                            }
                        }

                        return rendered;
                    }
                },
                {
                    data: 'job',
                    title: '',
                    width: '30px',
                    searchable: false,
                    orderable: false,
                    className: 'pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode,
                            kernel;

                        rendered = null;
                        if (type === 'display') {
                            kernel = object.kernel;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for&nbsp;' + data +
                                '&nbsp;&dash;&nbsp;' + kernel
                            );
                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/boot/all/job/' + data +
                                '/kernel/' + kernel + '/'
                            );
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

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([4, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['job', 'kernel'])
                .noIDUrl(true)
                .lengthChange(false)
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBoots() {
        var data,
            deferred;

        data = {
            aggregate: 'kernel',
            job: jobName,
            sort: 'created_on',
            sort_order: -1,
            limit: numberRange,
            field: ['job', 'kernel', 'created_on']
        };

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
    }

    document.getElementById('li-boot').setAttribute('class', 'active');
    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        numberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }

    bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
    getDetailsCount();
    getBoots();
});
