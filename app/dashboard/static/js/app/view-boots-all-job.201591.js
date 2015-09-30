/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/date'
], function($, b, e, i, r, t) {
    'use strict';
    var bootsTable,
        jobName = null,
        pageLen = null,
        searchFilter = null,
        numberRange = 20;

    function getDetailsCountFail() {
        b.replaceById('boot-reports-count', '&infin;');
        b.replaceById('boot-boards-count', '&infin;');
    }

    function getDetailsCountDone(response) {
        var results = response.result,
            resLen = results.length,
            reportsCount = '0',
            boardsCount = '0';
        if (resLen > 0) {
            if (results[0].operation_id === 'boot-reports-count') {
                reportsCount = results[0].result[0].count;
                boardsCount = results[1].result.length;
            } else {
                reportsCount = results[1].result[0].count;
                boardsCount = results[0].result.length;
            }
        }
        b.replaceById('boot-reports-count', reportsCount);
        b.replaceById('boot-boards-count', boardsCount);
    }

    function getDetailsCount() {
        var deferred,
            batchQueries,
            data;

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
        b.replaceByClass('fail-badge', '&infin;');
        b.replaceByClass('success-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results = response.result,
            resLen = results.length,
            idx = 0,
            opId,
            count;

        if (resLen === 0) {
            b.replaceByClass('fail-badge', '?');
            b.replaceByClass('success-badge', '?');
        } else {
            for (idx; idx < resLen; idx = idx + 1) {
                opId = results[idx].operation_id;
                count = results[idx].result[0].count;
                b.replaceById(opId, count);
            }
        }
        // Re-enable the search here.
        bootsTable
            .pageLen(pageLen)
            .search(searchFilter);
    }

    function getBootsCount(response) {
        var results = response.result,
            resLen = results.length,
            batchElements = 2,
            queriesLen = resLen * batchElements,
            idx = 0,
            jdx,
            kernel,
            batchQueries,
            deferred,
            data;

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
        b.removeElement('table-loading');
        b.replaceById(
            'table-div',
            '<div class="pull-center"><strong>' +
            'Error loading board data.</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            columns,
            rowURLFmt = '/boot/all/job/%(job)s/kernel/%(kernel)s/';

        if (resLen === 0) {
            b.removeElement('table-loading');
            b.replaceById(
                'table-div',
                '<div class="pull-center"><strong>' +
                'No board data found.</strong></div>'
            );
        } else {
            columns = [
                {
                    'data': '_id',
                    'visible': false,
                    'searchable': false,
                    'orderable': false
                },
                {
                    'data': 'kernel',
                    'title': 'Kernel'
                },
                {
                    'data': 'kernel',
                    'title': 'Successful',
                    'className': 'pull-center',
                    'render': function(data) {
                        return '<span id="success-count-' + data + '" ' +
                            'class="badge badge-count alert-success ' +
                            'success-badge"><i class="fa fa-cog fa-spin">' +
                            '</i></span>';
                    }
                },
                {
                    'data': 'kernel',
                    'title': 'Failed',
                    'className': 'pull-center',
                    'render': function(data) {
                        return '<span id="fail-count-' + data + '" ' +
                        'class="badge badge-count alert-danger fail-badge">' +
                        '<i class="fa fa-cog fa-spin"></i></span>';
                    }
                },
                {
                    'data': 'created_on',
                    'title': 'Date',
                    'className': 'date-column pull-center',
                    'render': function(data) {
                        var created = new Date(data.$date);
                        return created.toCustomISODate();
                    }
                },
                {
                    'data': 'job',
                    'title': '',
                    'width': '30px',
                    'searchable': false,
                    'orderable': false,
                    'className': 'pull-center',
                    'render': function(data, type, object) {
                        var display,
                            href,
                            kernel = object.kernel;

                        href = '/boot/all/job/' + data +
                            '/kernel/' + kernel + '/';
                        display = '<span rel="tooltip" ' +
                            'data-toggle="tooltip" ' +
                            'title="Details for boot reports&nbsp;' + data +
                            '&nbsp;&dash;&nbsp;' + kernel + '">' +
                            '<a href="' + href + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                        return display;
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
        var deferred,
            data;
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

    $(document).ready(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

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
});
