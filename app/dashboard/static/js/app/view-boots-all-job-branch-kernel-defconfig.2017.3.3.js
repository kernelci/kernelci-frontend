/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
    'utils/table',
    'utils/html',
    'tables/boot'
], function($, init, e, r, table, html, tboot) {
    'use strict';
    var gBootsTable;
    var gDefconfigFull;
    var gFileServer;
    var gJobName;
    var gKernelName;
    var gPageLen;
    var gSearchFilter;
    var gBranch;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    gPageLen = null;
    gSearchFilter = null;
    gFileServer = null;

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data'));
    }

    function getBootsDone(response) {
        var columns;
        var results;

        /**
         * Wrapper to inject the server URL.
        **/
        function _renderBootLogs(data, type, object) {
            object.default_file_server = gFileServer;
            return tboot.renderBootLogs(data, type, object);
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
                    data: 'board',
                    title: 'Board Model',
                    type: 'string',
                    className: 'board-column',
                    render: tboot.renderBoard
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    type: 'string',
                    class: 'lab-column',
                    render: tboot.renderLab
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    type: 'string',
                    className: 'failure-column',
                    render: tboot.renderResultDescription
                },
                {
                    data: 'file_server_url',
                    title: 'Boot Log',
                    type: 'string',
                    className: 'log-column pull-center',
                    render: _renderBootLogs
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: tboot.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: tboot.renderStatus
                },
                {
                    data: '_id',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: tboot.renderDetails
                }
            ];

            gBootsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .languageLengthMenu('boot reports per page')
                .rowURL('/boot/id/%(_id)s/')
                .rowURLElements(['_id'])
                .draw();

            gBootsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getBoots() {
        var deferred;
        setTimeout(function() {
            deferred = r.get(
                '/_ajax/boot',
                {
                    job: gJobName,
                    git_branch: gBranch,
                    kernel: gKernelName,
                    defconfig_full: gDefconfigFull
                }
            );
            $.when(deferred)
                .fail(e.error, getBootsFail)
                .done(getBootsDone);
        }, 25);
    }

    function setupData() {
        var aNode;
        var spanNode;
        var str;
        var tooltipNode;

        // Add the tree data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot details for';
        str += '&nbsp;';
        str += gJobName;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/boot/all/job/';
        str += gJobName;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gJobName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        str = 'Details for job';
        str += '&nbsp;';
        str += gJobName;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/job/';
        str += gJobName;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.tree());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        // The branch.
        html.replaceContent(
            document.getElementById('dd-git-branch'),
            document.createTextNode(gBranch));

        // Add the kernel data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot reports for';
        str += '&nbsp;';
        str += gJobName;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernelName;
        str += '&nbsp;(';
        str += gBranch;
        str += ')';
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str ='/boot/all/job/';
        str += gJobName;
        str += '/branch/';
        str += gBranch;
        str += '/kernel/';
        str += gKernelName;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gKernelName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        str = 'Build reports for';
        str += '&nbsp;';
        str += gJobName;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernelName;
        str += '&nbsp;(';
        str += gBranch;
        str += ')';
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/build/';
        str += gJobName;
        str += '/branch/';
        str += gBranch;
        str += '/kernel/';
        str += gKernelName;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // Add the defconfig data.
        html.replaceContent(
            document.getElementById('dd-defconfig'),
            document.createTextNode(gDefconfigFull));
    }

    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        gDefconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gBootsTable = table({
        tableId: 'boots-table',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(setupData, 25);
    setTimeout(getBoots, 25);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
