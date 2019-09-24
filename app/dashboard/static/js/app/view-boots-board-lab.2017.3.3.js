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
    'tables/boot',
    'utils/table'
], function($, init, e, r, html, tboot, table) {
    'use strict';
    var gBoardName;
    var gBootsTable;
    var gDefconfigFull;
    var gFileServer;
    var gJobName;
    var gKernelName;
    var gLabName;

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

        /**
         * Wrapper to inject the server URL.
        **/
        function _renderBootLogs(data, type, object) {
            object.default_file_server = gFileServer;
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
            columns = [
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
                },
                {
                    data: 'compiler_version_ext',
                    title: 'Compiler',
                    type: 'string'
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
                .rowURL('/boot/id/%(_id)s/')
                .rowURLElements(['_id'])
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: gBoardName,
                job: gJobName,
                kernel: gKernelName,
                defconfig_full: gDefconfigFull,
                lab_name: gLabName
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    function setUpData() {
        var aNode;
        var spanNode;
        var tooltipNode;
        var docFrag;

        // Lab.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title', 'Boot reports for lab&nbsp' + gLabName);
        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/boot/all/lab/' + gLabName + '/');
        aNode.appendChild(document.createTextNode(gLabName));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(document.getElementById('dd-lab'), docFrag);

        // Board.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title', 'Boot reports for board&nbsp;' + gBoardName);
        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/boot/' + gBoardName + '/');
        aNode.appendChild(document.createTextNode(gBoardName));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(document.getElementById('dd-board'), docFrag);

        // Tree.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Boot details for&nbsp;' + gJobName);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/boot/all/job/' + gJobName + '/');
        aNode.appendChild(document.createTextNode(gJobName));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Details for job&nbsp;' + gJobName);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/job/' + gJobName + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.tree());

        html.replaceContent(document.getElementById('dd-tree'), docFrag);

        // Git describe.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + gJobName +
                '&nbsp;&dash;&nbsp;' + gKernelName
        );

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + gJobName + '/kernel/' + gKernelName + '/');
        aNode.appendChild(document.createTextNode(gKernelName));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title',
            'Build reports for&nbsp;' + gJobName +
                '&nbsp;&dash;&nbsp;' + gKernelName
        );

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href', '/build/' + gJobName + '/kernel/' + gKernelName + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.build());

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // Defconfig.
        html.replaceContent(
            document.getElementById('dd-defconfig'),
            document.createTextNode(gDefconfigFull));
    }

    if (document.getElementById('board-name') !== null) {
        gBoardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        gDefconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('lab-name') !== null) {
        gLabName = document.getElementById('lab-name').value;
    }

    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(setUpData, 0);
    setTimeout(getBoots, 0);

    init.hotkeys();
    init.tooltip();
});
