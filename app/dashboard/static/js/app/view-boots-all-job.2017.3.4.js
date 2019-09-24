/*!
 * Copyright (C) Linaro Limited 2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'tables/boot',
    'utils/const'
], function($, init, format, e, r, table, html, tboot, appconst) {
    'use strict';
    var gBootsTable;
    var gJobName;
    var gNumberRange;
    var gPageLen;
    var gSearchFilter;
    var gTableCount;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    gNumberRange = appconst.MAX_NUMBER_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gTableCount = {};

    function getDetailsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boot-reports-count'), '&infin;');
        html.replaceContentHTML(
            document.getElementById('boot-boards-count'), '&infin;');
    }

    function getDetailsCountDone(response) {
        var boardsCount;
        var reportsCount;
        var results;

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
            document.createTextNode(format.number(reportsCount)));
        html.replaceContent(
            document.getElementById('boot-boards-count'),
            document.createTextNode(format.number(boardsCount)));
    }

    function getDetailsCount() {
        var batchQueries;
        var deferred;
        var qStr;

        batchQueries = [];

        qStr = 'job=';
        qStr += gJobName;
        batchQueries.push({
            method: 'GET',
            operation_id: 'boot-reports-count',
            resource: 'count',
            document: 'boot',
            query: qStr
        });

        qStr = 'job=';
        qStr += gJobName;
        qStr += '&aggregate=board&field=board';
        batchQueries.push({
            method: 'GET',
            operation_id: 'boot-boards-count',
            resource: 'boot',
            query: qStr
        });

        setTimeout(function() {
            deferred = r.post(
                '/_ajax/batch', JSON.stringify({batch: batchQueries}));
            $.when(deferred)
                .fail(e.error, getDetailsCountFail)
                .done(getDetailsCountDone);
        }, 50);
    }

    function getBootsCountFail() {
        html.replaceByClass('count-badge', '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        function _parseOperationResult(result) {
            gTableCount[result.operation_id] =
                parseInt(result.result[0].count, 10);
        }

        function _updateTable(opId) {
            html.replaceContent(
                document.getElementById(opId),
                document.createTextNode(format.number(gTableCount[opId])));
        }

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('count-badge', '&#63;');
        } else {
            // Parse all the results and update a global object with
            // the operation IDs and the count found.
            results.forEach(_parseOperationResult);
            // Invalidate the cells in column #1 before updating the DOM
            // elements. In this way we have the correct 'sort' values in the
            // global object that we can use to provide the sort parameters.
            gBootsTable.invalidateColumn(1);
            // Now update the DOM with the results.
            Object.keys(gTableCount).forEach(_updateTable);
        }
        // Re-enable the search here.
        gBootsTable
            .pageLen(gPageLen)
            .search(gSearchFilter);
    }

    function getBootsCount(response) {
        var batchOps;
        var deferred;
        var opId;
        var opIdTail;
        var qHead;
        var queryStr;
        var results;

        function _createOp(result) {
            queryStr = 'job=';
            queryStr += gJobName;
            queryStr += '&kernel=';
            queryStr += result.kernel;
            queryStr += '&git_branch=';
            queryStr += result.git_branch;

            opIdTail = result.kernel;
            opIdTail += '-';
            opIdTail += result.git_branch;

            // Get the total count.
            opId = 'total-count-';
            opId += opIdTail;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: queryStr
            });

            // Get the success count.
            opId = 'success-count-';
            opId += opIdTail;
            qHead = 'status=PASS&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
            });

            // Get the fail count.
            opId = 'fail-count-';
            opId += opIdTail;
            qHead = 'status=FAIL&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
            });

            // Get the other count.
            opId = 'unknown-count-';
            opId += opIdTail;
            qHead = 'status=OFFLINE&status=UNTRIED&status=UNKNOWN&';
            qHead += queryStr;
            batchOps.push({
                method: 'GET',
                operation_id: opId,
                resource: 'count',
                document: 'boot',
                query: qHead
            });
        }

        results = response.result;
        if (results.length > 0) {
            batchOps = [];
            results.forEach(_createOp);

            setTimeout(function() {
                deferred = r.post(
                    '/_ajax/batch', JSON.stringify({batch: batchOps}));
                $.when(deferred)
                    .fail(e.error, getBootsCountFail)
                    .done(getBootsCountDone);
            }, 25);
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading board data.'));
    }

    function getSortCount(key) {
        var sortValue;

        sortValue = null;
        if (gTableCount.hasOwnProperty(key)) {
            sortValue = gTableCount[key];
        }

        return sortValue;
    }

    function getBootsDone(response) {
        var columns;
        var results;
        var rowURLFmt;

        /**
         * Wrapper to provide the sort value.
        **/
        function _countTotal(data, type, object) {
            var key;
            if (type === 'sort') {
                key = 'total-count-';
                key += data;
                return getSortCount(key);
            } else {
                key = data;
                key += '-';
                key += object.git_branch;
                return tboot.countTotal(key, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countSuccessful(data, type, object) {
            var key;
            if (type === 'sort') {
                key = 'success-count-';
                key += data;
                return getSortCount(key);
            } else {
                key = data;
                key += '-';
                key += object.git_branch;
                return tboot.countSuccess(key, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countFailed(data, type, object) {
            var key;
            if (type === 'sort') {
                key = 'fail-count-';
                key += data;
                return getSortCount(key);
            } else {
                key = data;
                key += '-';
                key += object.git_branch;
                return tboot.countFail(key, type);
            }
        }

        /**
         * Wrapper to provide the sort value.
        **/
        function _countUnknown(data, type, object) {
            var key;
            if (type === 'sort') {
                key = 'unknown-count-';
                key += data;
                return getSortCount(key);
            } else {
                key = data;
                key += '-';
                key += object.git_branch;
                return tboot.countUnknown(key, type);
            }
        }

        function _renderBranch(data, type, object) {
            var rendered;
            var aNode;
            var str;

            rendered = data;
            if (type === 'display') {
                aNode = document.createElement('a');
                aNode.className = 'table-link';
                str = '/boot/all/job/';
                str += object.job;
                str += '/branch/';
                str += data;
                str += '/';
                aNode.setAttribute('href', str);

                aNode.appendChild(document.createTextNode(data));
                rendered = aNode.outerHTML;

                aNode.remove();
            }
            return rendered;
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No board data found'));
        } else {
            rowURLFmt = '/boot/all/job/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/';
            columns = [
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column',
                    render: _renderBranch
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string'
                },
                {
                    data: 'kernel',
                    title: 'Total',
                    type: 'number',
                    className: 'pull-center',
                    render: _countTotal
                },
                {
                    data: 'kernel',
                    title: 'Successful',
                    type: 'number',
                    className: 'pull-center',
                    render: _countSuccessful
                },
                {
                    data: 'kernel',
                    title: 'Failed',
                    type: 'number',
                    className: 'pull-center',
                    render: _countFailed
                },
                {
                    data: 'kernel',
                    title: 'Other',
                    type: 'number',
                    className: 'pull-center',
                    render: _countUnknown
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: tboot.renderDate
                },
                {
                    data: 'job',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                    render: tboot.renderTableDetailJob
                }
            ];

            gBootsTable
                .data(results)
                .columns(columns)
                .order([6, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['job', 'git_branch', 'kernel'])
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                aggregate: ['kernel', 'git_branch'],
                job: gJobName,
                sort: 'created_on',
                sort_order: -1,
                limit: gNumberRange,
                field: ['job', 'git_branch', 'kernel', 'created_on']
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getBootsCount);
    }

    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gBootsTable = table({
        tableDivId: 'table-div',
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getBoots, 10);
    setTimeout(getDetailsCount, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
