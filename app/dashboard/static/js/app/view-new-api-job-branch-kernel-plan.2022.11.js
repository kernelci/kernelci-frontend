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
    'charts/passpie',
    'tables/test',
    'utils/error',
    'utils/init',
    'utils/html',
    'utils/request',
    'utils/table',
    'utils/urls',
    'URI',
], function($, pieChart, ttable, error, init, html, request, table,
            urls, URI) {
    'use strict';

    var gPlan;
    var gKernel;
    var gBranch;
    var gJob;
    var gFileServer;
    var gTestsTable;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateDetails(results) {
        var job;
        var branch;
        var kernel;
        var commit;
        var treeNode;
        var describeNode;
        var branchNode;
        var planNode;
        var gitNode;
        var createdOn;
        var dateNode;
        var url;
        var plan;

        job = results.revision.tree;
        branch = results.revision.branch;
        kernel = results.revision.describe;
        commit = results.revision.commit;
        url = results.revision.url.replace('.git', '/commit/'+commit);
        plan = results.group;

        treeNode = html.tooltip();
        treeNode.title = "All results for tree &#171;" + job + "&#187;";
        treeNode.appendChild(document.createTextNode(job));

        planNode = html.tooltip();
        planNode.title = "All results for test plan &#171;" + plan + "&#187;";
        planNode.appendChild(document.createTextNode(plan));

        branchNode = html.tooltip();
        branchNode.title = "All results for branch &#171;" + branch + "&#187;";
        branchNode.appendChild(document.createTextNode(branch));

        describeNode = html.tooltip();
        describeNode.title = "Build results for &#171;" + kernel + "&#187; - ";
        describeNode.appendChild(document.createTextNode(kernel));

        gitNode = document.createElement('a');
        gitNode.appendChild(document.createTextNode(url));
        gitNode.href = url;
        gitNode.title = "Git URL";

        createdOn = new Date(results.created);
        dateNode = document.createElement('time');
        dateNode.setAttribute('datetime', createdOn.toISOString());
        dateNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));

        html.replaceContent(
            document.getElementById('tree'), treeNode);
        html.replaceContent(
            document.getElementById('plan'), planNode);
        html.replaceContent(
            document.getElementById('git-branch'), branchNode);
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(
            document.getElementById('git-url'), gitNode);
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
        html.replaceContent(
            document.getElementById('plan-title'),
            document.createTextNode(results.group));
        html.replaceContent(
            document.getElementById('kernel-title'),
            document.createTextNode(results.revision.describe));
        html.replaceContent(
            document.getElementById('tree-title'),
            document.createTextNode(job));
        html.replaceContent(
            document.getElementById('branch-title'),
            document.createTextNode(branch));
    }

    function updateChart(testCount) {
        function countTests(tc) {
            return [
                tc['total'],
                [tc['pass'], tc['failures'], tc['regressions'], tc['unknown']]
            ];
        }

        pieChart.testpie({
            element: 'test-chart',
            countFunc: countTests,
            response: testCount,
            legend: true,
            legendIds: {
                'pass': '#show-pass',
                'warning': '#show-warning',
                'fail': '#show-fail',
                'unknown': '#show-unknown',
            },
            legendTitles: {
                'pass': 'Successful',
                'warning': 'Failures',
                'fail': 'Regressions',
                'unknown': 'Unknown',
            },
            size: {
                height: 200,
                width: 200,
            },
            radius: {inner: -30, outer: -42},
        });
    }

    function listenForTableEvents(testCount) {
        var btnList = ['total', 'pass', 'regressions', 'failures', 'unknown'];

        function _tableFilter(event) {
            var activeId = event.target.id;
            var status = activeId.substring('btn-'.length);

            if (status == 'total') {
                status = '';
            } else if (status == 'regressions') {
                status = 'fail';
            } else if (status == 'failures') {
                status = 'warning';
            }

            gTestsTable.table.column(2).search(status).draw();

            btnList.forEach(function(id) {
                var btnId = 'btn-' + id;
                var ele = document.getElementById(btnId);

                if (btnId == activeId) {
                    html.addClass(ele, 'active');
                } else {
                    html.removeClass(ele, 'active');
                }
            });
        }

        btnList.forEach(function(id) {
            var ele = document.getElementById('btn-' + id);
            ele.addEventListener('click', _tableFilter, true);
            if (testCount[id])
                ele.removeAttribute('disabled');
            if (id == 'total')
                html.addClass(ele, 'active');
        });
    }

    function updateTestsTable(results) {
        var columns;
        var data;
        function _renderStatus(data, type) {
            if (type == "display") {
                var node = document.createElement('div');
                node.appendChild(ttable.statusNode(data));
                return node.outerHTML;
            } else {
                return data;
            }
        }

        data = [];
        results.forEach(function(item) {
            var status;

            if (item.result == 'pass')
                status = 'PASS';
            else if (item.result == 'fail')
                status = 'WARNING';
            else if (item.result === null)
                return
            else
                status = 'UNKNOWN';

            data.push({
                '_id': item._id,
                'test_case_path': item.path.join('.'),
                'measurements': '-',
                'status': status,
            });
        });

        columns = [
            {
                title: 'Test case path',
                data: 'test_case_path',
                type: 'string',
                className: 'test-group-column',
            },
            {
                title: 'Measurements',
                data: 'measurements',
                type: 'string',
                className: 'test-group-column',
                searchable: false,
                orderable: false,
            },
            {
                title: 'Status',
                data: 'status',
                type: 'string',
                className: 'pull-center',
                searchable: true,
                orderable: false,
                render: _renderStatus,
            },
        ];

        gTestsTable
            .data(data)
            .columns(columns)
            .order([0, 'asc'])
            .paging(true)
            .info(false)
            .draw();
    }

    function getTestsFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('No test data available.')
        );
    }

    function getTestsDone(response) {
        if (response.length === 0) {
            getTestsFailed();
            return;
        }

        updateTestsTable(response.items);
    }

    function testCountDone(response) {
        var testCount;
        var total = 0;
        var pass = 0;
        var fail = 0;
        var regressions = 0;
        var unknown = 0;

        response.forEach(function(item){
            if (item.path.length > 2 & item.result !== null) {
                switch(item.result) {
                    case 'fail':
                        fail += 1;
                        break;
                    case 'pass':
                        pass += 1;
                        break;
                    case 'unknown':
                        unknown += 1;
                        break;
                }
            }
        });

        total = fail+pass+regressions+unknown;

        testCount = {
            'total': total,
            'pass': pass,
            'regressions': regressions,
            'failures': fail,
            'unknown': unknown,
        };
        updateChart(testCount);
        listenForTableEvents(testCount);
    }

    function getPlanFailed() {
        detailsFailed();
    }

    function getPlanDone(response) {
        updateDetails(response.items[0]);
        getTestsDone(response);
        testCountDone(response.items);
    }

    function getPlan() {
        var data;
        if (!gPlan) {
            getPlanFailed();
            return;
        }

        data = {
            'revision.tree': gJob,
            'revision.branch': gBranch,
            'revision.describe': gKernel,
            group: gPlan,
            limit: 100000,
            offset: 0,
        };

        $.when(request.get('/_ajax/nodes', data))
            .fail(error.error, getPlanFailed)
            .done(getPlanDone);
    }
    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = URI.decode(document.getElementById('branch-name').value);
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('plan-name') !== null) {
        gPlan = document.getElementById('plan-name').value;
    }

    gTestsTable = table({
        tableId: 'tests-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getPlan, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
