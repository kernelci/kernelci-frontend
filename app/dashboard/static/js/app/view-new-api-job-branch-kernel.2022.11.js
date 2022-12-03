/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2022 Collabora Ltd
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
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
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/table',
    'tables/test',
    'charts/passpie',
    'URI',
], function($, init, html, error, request, table, ttest, chart, URI) {
    'use strict';
    var gJob;
    var gBranch;
    var gKernel;
    var gPlansTable;

    setTimeout(function() {
        document.getElementById('li-test').setAttribute('class', 'active');
    }, 15);

    function detailsFailed() {
        html.replaceByClassTxt('loading-content', '?');
    }

    function updateChart(response) {
        function countTests(response) {
            var count = {'pass': 0, 'fail': 0, 'warning': 0};
            response.forEach(function(item){
                count.pass += item.result.pass;
                count.fail += item.result.fail;
                count.warning += item.result.warning;
            })
            var total = count.pass + count.fail + count.warning;
            return [total, [count.pass, count.fail, count.warning]];
        }

        chart.testpie({
            element: 'test-chart',
            countFunc: countTests,
            response: response,
            size: {
                height: 140,
                width: 140
            },
            radius: {inner: -12.5, outer: 0},
        });
    }

    function updateDetails(results) {
        var job;
        var branch;
        var kernel;
        var commit;
        var treeNode;
        var describeNode;
        var branchNode;
        var gitNode;
        var createdOn;
        var dateNode;
        var url;

        job = results.tree;
        branch = results.branch;
        kernel = results.describe;
        commit = results.commit;
        url = results.url.replace('.git', '/commit/' + commit);

        treeNode = html.tooltip();
        treeNode.title = "All results for tree &#171;" + job + "&#187;";
        treeNode.appendChild(document.createTextNode(job));

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
            document.getElementById('git-branch'), branchNode);
        html.replaceContent(
            document.getElementById('git-describe'), describeNode);
        html.replaceContent(
            document.getElementById('git-url'), gitNode);
        html.replaceContent(
            document.getElementById('job-date'), dateNode);
    }

    function getBuilds() {
        var data;
        var deferred;

        data = {
            'revision.tree': gJob,
            'revision.branch': gBranch,
            'revision.describe': gKernel,
            limit: 100000,
            offset: 0,
        };

        deferred = request.get('/_ajax/nodes', data);
        $.when(deferred)
            .fail(
                error.error,
                getBuildsFailed)
            .done(getBuildsDone);
    }

    function getBuildsFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading build data.'));
    }

    function plansFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('No test data available.')
        );
    }

    function getPlansFailed() {
        detailsFailed();
        plansFailed();
    }

    function getBuildsDone(response) {
        if (response.items.length === 0) {
            getPlansFailed();
            return;
        }
        var columns;
        var results;
        var count = {};

        response.items.forEach(function(item){
            var date = new Date(item.created).toCustomISODate();
            if (!(date in count) && item.group !== null) {
                count[date] = {};
                count[date][item.group] = {'pass':0, 'fail': 0, 'warning':0, 'id': item._id};
            } else if (item.group !== null && !(item.group in count[date])) {
                count[date][item.group] = {'pass':0, 'fail': 0, 'warning':0, 'id': item._id};
            } else if (date in count && item.group in count[date]) {
                if (item.result) {
                    if (item.result in count[date][item.group]) {
                        count[date][item.group][item.result]++;
                    } else {
                        count[date][item.group]['pass'] = 0;
                        count[date][item.group]['fail'] = 0;
                        count[date][item.group]['warning'] = 0;
                        count[date][item.group]['group'] = item.group;
                    }
                }
            }
        });
        results = Object.values(response.items).filter(item => item.path.length === 2 && item.group !== null).map((item) => {
            var revision = item.revision;
            var newDate = new Date(item.created);
            revision.status = String(item.state).toUpperCase();
            revision.created = new Date(newDate);
            revision.group = item.group;
            if (newDate.toCustomISODate() in count){
                if (Object.keys(count[newDate.toCustomISODate()][item.group]).length === 0){
                    revision.result = {'pass':0, 'fail': 0, 'warning':0};
                } else {
                    revision.result = count[newDate.toCustomISODate()][item.group];
                }
            }
            return revision
        });

        /**
         * Create the table column title for the tests count.
        **/
         function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Successful/Regressions/Failures');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderTestCount(data, type) {
            return ttest.renderTestCount({data: data.id, type: type});
        }

        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No builds data available.'));
        } else {
            updateDetails(results[0]);
            updateChart(results);
            columns = [
                {
                    data: 'group',
                    title: 'Test Plan',
                    type: 'string',
                    className: 'test-group-column',
                },
                {
                    data: 'created',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: ttest.renderDate
                },
                {
                    data: 'result',
                    title: _testColumnTitle(),
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'test-count pull-center',
                    render: _renderTestCount
                },
                {
                    data: 'tree',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center',
                }
            ];
            gPlansTable
                .data(results)
                .columns(columns)
                .order([1, 'desc'])
                .paging(true)
                .info(false)
                .draw();
        }
        results.forEach(function(data) {
            var objectId;
            for (var key in data.result) {
                if (key === 'id')
                    continue;
                objectId = 'test-' + key + '-count-' + data.result.id;
                html.replaceContent(
                    document.getElementById(objectId),
                    document.createTextNode(data.result[key]))
            }
        });
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

    gPlansTable = table({
        tableId: 'plans-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
    });

    setTimeout(getBuilds, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
