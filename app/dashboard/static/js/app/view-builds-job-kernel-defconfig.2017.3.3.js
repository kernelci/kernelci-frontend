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
    'utils/html',
    'tables/build',
    'utils/table'
], function($, init, format, e, r, html, tbuild, table) {
    'use strict';
    var gBuildsTable;
    var gDefconfigFull;
    var gFileServer;
    var gJobName;
    var gKernelName;

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 0);

    function getBuildsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function getBuildsDone(response) {
        var columns;
        var results;

        function _renderDetails(data, type) {
            return tbuild.renderDetails('/build/id/' + data.$oid + '/', type);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No build data found.'));
        } else {
            columns = [
                {
                    data: 'git_branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'compiler_version_ext',
                    title: 'Compiler',
                    type: 'string'
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: tbuild.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: tbuild.renderStatus
                },
                {
                    data: '_id',
                    title: '',
                    type: 'string',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderDetails
                }
            ];

            gBuildsTable
                .data(results)
                .columns(columns)
                .order([3, 'desc'])
                .languageLengthMenu('build reports per page')
                .rowURL('/build/id/%(_id)s/')
                .rowURLElements(['_id'])
                .draw();
        }
    }

    function setDetails() {
        var aNode;
        var docFrag;
        var spanNode;
        var tooltipNode;

        // Tree.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + gJobName);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/job/' + gJobName + '/');
        aNode.appendChild(document.createTextNode(gJobName));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title', 'Boot reports for tree&nbsp;' + gJobName);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute('href', '/boot/all/job/' + gJobName + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.boot());

        html.replaceContent(document.getElementById('dd-tree'), docFrag);

        // Git describe.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title',
            'Build reports for&nbsp;' + gJobName +
            '&nbsp;&dash;&nbsp;' + gKernelName
        );

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href', '/build/' + gJobName + '/kernel/' + gKernelName + '/');
        aNode.appendChild(document.createTextNode(gKernelName));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

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
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.boot());

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // Defconfig.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        spanNode.appendChild(document.createTextNode(gDefconfigFull));
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + gJobName +
                '&nbsp;&dash;&nbsp;' + gKernelName +
                '&nbsp;&dash;&nbsp;' + gDefconfigFull
        );

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + gJobName +
            '/kernel/' + gKernelName + '/defconfig/' + gDefconfigFull + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.boot());

        html.replaceContent(document.getElementById('dd-defconfig'), docFrag);
    }

    function getBuilds() {
        var data;

        data = {
            job: gJobName,
            kernel: gKernelName,
            defconfig_full: gDefconfigFull,
            nfield: ['dtb_dir_data']
        };

        $.when(r.get('/_ajax/build', data))
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone);
    }

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        gDefconfigFull = document.getElementById('defconfig-full').value;
    }

    gBuildsTable = table({
        tableId: 'builds-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(setDetails, 0);
    setTimeout(getBuilds, 0);

    init.hotkeys();
    init.tooltip();
});
