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
    'utils/html',
    'tables/boot',
    'utils/table'
], function($, init, e, r, html, tboot, table) {
    'use strict';
    var gBootsTable;
    var fileServer;
    var gBoard;
    var gBranch;
    var gDefconfigFull;
    var gKernel;
    var gTree;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    function getBootsFail() {
        html.removeElement(
            document.getElementById('boot-reports-loading-div'));
        html.replaceContent(
            document.getElementById('other-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns;
        var results;
        var rowURLFmt;

        /**
         * Wrapper to inject the server URL.
        **/
        function _renderBootLogs(data, type, object) {
            object.default_file_server = fileServer;
            return tboot.renderBootLogs(data, type, object);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(
                document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            rowURLFmt = '/boot/id/%(_id)s/';

            columns = [
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    type: 'string',
                    className: 'lab-column',
                    render: tboot.renderLab
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
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
                .order([4, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['_id'])
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: gBoard,
                job: gTree,
                git_branch: gBranch,
                kernel: gKernel,
                defconfig_full: gDefconfigFull
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    function setUpData() {
        var aNode;
        var spanNode;
        var str;
        var tooltipNode;

        // Add the tree data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot details for&nbsp;';
        str += gTree;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/boot/all/job/';
        str += gTree;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gTree));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        str = 'Details for job&nbsp;';
        str += gTree;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/job/';
        str += gTree;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.tree());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        // Add the git branch data.
        html.replaceContent(
            document.getElementById('dd-branch'),
            document.createTextNode(gBranch));

        // Add the kernel data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot reports for&nbsp;';
        str += gTree;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernel;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/boot/all/job/';
        str += gTree;
        str += '/branch/';
        str += gBranch;
        str += '/kernel/';
        str += gKernel;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gKernel));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        str = 'Build reports for&nbsp;';
        str += gTree;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernel;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/build/';
        str += gTree;
        str += '/branch/';
        str += gBranch;
        str += '/kernel/';
        str += gKernel;
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

    if (document.getElementById('board-name') !== null) {
        gBoard = document.getElementById('board-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        gDefconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gTree = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        fileServer = document.getElementById('file-server').value;
    }

    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(setUpData, 25);
    setTimeout(getBoots, 25);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
