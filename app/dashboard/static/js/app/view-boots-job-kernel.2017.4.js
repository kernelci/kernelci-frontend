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
    'utils/request',
    'utils/error',
    'utils/urls',
    'utils/html',
    'utils/table',
    'tables/common',
    'tables/boot',
    'utils/date'
], function($, init, request, e, urls, html, table, tcommon, tboot) {
    'use strict';
    var gFileServer;
    var gJob;
    var gKernel;
    var gSearchFilter;
    var gBootsTable;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    function getBootsFailed() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data'));
    }

    function getBootsDone(response) {
        var columns;
        var results;

        function renderDetails(data, type, object) {
            var href = '/boot/all/job/';
            href += object.job;
            href += '/branch/';
            href += data;
            href += '/kernel/';
            href += object.kernel;
            href += '/';
            return tcommon.renderDetails(href, type);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No boot reports found.'));
        } else {
            columns = [
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: tboot.renderDate
                },
                {
                    data: 'git_branch',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: renderDetails
                }
            ];

            gBootsTable
                .data(results)
                .columns(columns)
                .order([1, 'desc'])
                .rowURL(
                    '/boot/all/job/%(job)s/branch/%(git_branch)s/kernel/%(kernel)s/')
                .rowURLElements(['job', 'git_branch', 'kernel'])
                .draw();
        }
    }

    function getBoots(response) {
        var deferred;
        var result;

        result = response.result;

        if (result.length > 0) {
            deferred = request.get(
                '/_ajax/boot',
                {
                    aggregate: 'kernel',
                    job: result[0].job,
                    kernel: result[0].kernel,
                    sort: 'created_on',
                    sort_order: -1,
                    field: [
                        'job', 'kernel', 'created_on', 'git_branch'
                    ]
                }
            );

            $.when(deferred)
                .fail(e.error, getBootsFailed)
                .done(getBootsDone);
        } else {
            getBootsFailed();
        }

    }

    function getJobFailed() {
        html.replaceByClassHTML('loading-content', '&infin;');
        getBootsFailed();
    }

    function setupData(response) {
        var aNode;
        var docFrag;
        var domNode;
        var str;
        var tooltipNode;
        var result;
        var job;
        var kernel;

        result = response.result;
        if (result.length > 0) {
            job = result[0].job;
            kernel = result[0].kernel;
            // The kernel name in the title.
            html.replaceContent(
                document.getElementById('kernel-title'),
                document.createTextNode(kernel));

            // Tree.
            docFrag = document.createDocumentFragment();
            domNode = docFrag.appendChild(document.createElement('div'));
            tooltipNode = domNode.appendChild(html.tooltip());
            str = 'Boot reports for tree&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/boot/all/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(document.createTextNode(job));

            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = domNode.appendChild(html.tooltip());
            str = 'Details for tree&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.tree());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Git describe.
            docFrag = document.createDocumentFragment();
            domNode = docFrag.appendChild(document.createElement('div'));
            domNode.appendChild(document.createTextNode(kernel));
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = domNode.appendChild(html.tooltip());
            str = 'Build reports for&nbsp;';
            str += job;
            str += '&nbsp&ndash;&nbsp;';
            str += kernel;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/build/';
            str += job;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.build());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

        } else {
            html.replaceByClassHTML('loading-content', '?');
        }
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

        $.when(request.get('/_ajax/job', data))
            .fail(e.error, getJobFailed)
            .done(setupData, getBoots);
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
        if (gKernel === 'None' || gKernel === 'null') {
            gKernel = null;
        }
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gBootsTable = table({
        tableId: 'boots-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getJob.bind(null, gJob, gKernel), 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
