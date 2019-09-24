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
    'utils/error',
    'utils/request',
    'utils/html',
    'utils/urls',
    'tables/build',
    'utils/table'
], function($, init, e, r, html, u, buildt, table) {
    'use strict';
    var gFileServer;
    var gBuildsTables;
    var gKernel;
    var gTree;
    var gNumberRange;

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 10);

    function getBuildsFail() {
        html.removeElement(
            document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBuildsDone(response) {
        var columns;
        var results;

        function _renderKernel(data, type, object) {
            return buildt.renderKernel(
                data, type, u.createPathHref([
                    '/build/',
                    gTree,
                    'branch',
                    object.git_branch,
                    'kernel',
                    data,
                    '/'
                ]));
        }

        function _renderDetails(data, type, object) {
            return buildt.renderDetails(
                u.createPathHref([
                    '/build/',
                    gTree,
                    'branch',
                    data,
                    'kernel',
                    object.kernel,
                    '/'
                ]), type);
        }

        function _renderCommit(data, type, object) {
            var gitURLs;

            gitURLs = u.translateCommit(object.git_url, data);
            return buildt.renderCommit(data, type, gitURLs[1]);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(
                document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
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
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: buildt.renderDate
                },
                {
                    data: 'git_branch',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gBuildsTables
                .data(results)
                .columns(columns)
                .order([3, 'desc'])
                .rowURL(
                    '/build/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/')
                .rowURLElements(['job', 'git_branch', 'kernel'])
                .paging(false)
                .info(false)
                .draw();
        }
    }

    function getBuilds(response) {
        var data;
        var result = response.result;

        if (result.length > 0) {
            data = {
                aggregate: 'git_branch',
                job: gTree,
                kernel: result[0].kernel,
                sort_on: 'created_on',
                sort_order: -1,
                field: [
                    'job',
                    'kernel',
                    'created_on',
                    'git_branch',
                    'git_commit',
                    'git_url'
                ],
                limit: gNumberRange
            };
            $.when(r.get('/_ajax/build', data))
                .fail(e.error, getBuildsFail)
                .done(getBuildsDone);
        } else {
            getBuildsFail();
        }
    }

    function getJobDone(response) {
        var aNode;
        var docFrag;
        var job;
        var kernel;
        var results;
        var spanNode;
        var tooltipNode;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('loading-content', '?');
        } else {
            results = results[0];
            job = results.job;
            kernel = results.kernel;

            // The kernel name in the title.
            html.replaceContent(
                document.getElementById('kernel-title'),
                document.createTextNode(kernel));

            // Tree.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Details for tree ' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', u.createPathHref(['/job/', job, '/']));
            aNode.appendChild(document.createTextNode(job));

            spanNode.insertAdjacentHTML(
                'beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'Boot reports for ' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', u.createPathHref(['/boot/all/job/', job, '/']));
            aNode.appendChild(html.boot());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Git describe.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            spanNode.appendChild(document.createTextNode(kernel));

            spanNode.insertAdjacentHTML(
                'beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title',
                'Boot reports for ' + job + '&nbsp;&ndash;&nbsp;' + kernel
            );
            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href',
                u.createPathHref([
                    '/boot/all/job/',
                    job,
                    'kernel',
                    kernel,
                    '/'
                ]));
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);
        }
    }

    function getJobFail() {
        html.replaceByClassHTML('loading-content', '&infin;');
        html.removeElement(
            document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getJob(job, kernel) {
        var data;

        data = {
            job: job
        };

        if (kernel) {
            data.kernel = kernel;
        } else {
            data.sort = 'created_on';
            data.sort_order = -1;
            data.limit = 1;
        }

        $.when(r.get('/_ajax/job', data))
            .fail(e.error, getJobFail)
            .done(getJobDone, getBuilds);
    }

    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
        if (gKernel === 'None' || gKernel === 'null') {
            gKernel = null;
        }
    }
    if (document.getElementById('job-name') !== null) {
        gTree = document.getElementById('job-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('number-range') !== null) {
        gNumberRange = document.getElementById('number-range').value;
    }

    gBuildsTables = table({
        tableId: 'builds-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(getJob.bind(null, gTree, gKernel), 10);

    init.hotkeys();
    init.tooltip();
});
