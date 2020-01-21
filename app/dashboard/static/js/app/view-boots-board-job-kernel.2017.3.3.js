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
    'tables/boot',
    'utils/date'
], function($, init, e, r, table, html, tboot) {
    'use strict';
    var gBoardName;
    var gBootsTable;
    var gFileServer;
    var gJobName;
    var gKernelName;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var results;
        var columns;

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
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column',
                    render: tboot.renderLab
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: tboot.renderDefconfig
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    className: 'failure-column',
                    render: tboot.renderResultDescription
                },
                {
                    data: 'file_server_url',
                    title: 'Boot Log',
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
                    className: 'pull-center',
                    render: tboot.renderStatus
                },
                {
                    data: '_id',
                    title: '',
                    orderable: false,
                    searchable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: tboot.renderDetails
                }
            ];

            gBootsTable
                .data(results)
                .columns(columns)
                .order([4, 'desc'])
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

        deferred = r.get(
            '/_ajax/boot',
            {
                board: gBoardName,
                job: gJobName,
                kernel: gKernelName
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    function setupData() {
        var aNode;
        var spanNode;
        var tooltipNode;
        var str;

        // Add the tree data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot reports for tree&nbsp;';
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
        str = 'Details for tree&nbsp;';
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

        // Add the kernel data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot reports for&nbsp;' ;
        str += gJobName;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernelName;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/boot/all/job/';
        str += gJobName;
        str += '/kernel/';
        str += gKernelName;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gKernelName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        str = 'Build reports for&nbsp;';
        str += gJobName;
        str += '&nbsp;&ndash;&nbsp;';
        str += gKernelName;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/build/';
        str += gJobName;
        str += '/kernel/';
        str += gKernelName;
        str += '/';
        aNode.setAttribute('href', str);

        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // The board.
        tooltipNode = html.tooltip();
        str = 'Boot reports for board&nbsp;';
        str += gBoardName;
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/boot/';
        str += gBoardName;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gBoardName));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        tooltipNode.appendChild(aNode);
        html.replaceContent(document.getElementById('dd-board'), tooltipNode);
    }

    if (document.getElementById('board-name') !== null) {
        gBoardName = document.getElementById('board-name').value;
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
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(setupData, 10);
    setTimeout(getBoots, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
