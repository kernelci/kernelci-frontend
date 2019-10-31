/*!
 * Copyright (C) Linaro Limited 2017,2018,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Charles <18oliveira.charles@gmail.com>
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
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/build',
    'utils/date'
], function($, init, error, request, table, html, appconst, buildt) {
    'use strict';
    var gBuildReqData;
    var gBuildSearchFields;
    var gBuildsTable;
    var gDateRange;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document
            .getElementById('li-build').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;
    gBuildSearchFields = [
        '_id',
        'arch',
        'compiler_version_ext',
        'created_on',
        'defconfig_full',
        'git_branch',
        'job',
        'kernel',
        'status'
    ];

    /**
     * Update the table with the new data.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBuildsDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            setTimeout(gBuildsTable.addRows.bind(gBuildsTable, results), 25);
        }

        // Remove the loading banner when we get the last response.
        // Not the best solution since the last real response might come
        // before other requests depending on API time.
        if ((response.skip + response.limit) >= response.count) {
            html.removeChildrenByClass('table-process');
        }
    }

    /**
     * Get the other remaining build reports.
     * Triggered after the initial get request.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBuilds(response) {
        var docFrag;
        var iNode;
        var idx;
        var lBuildReqData;
        var resTotal;
        var spanNode;
        var totalReq;

        function getData(reqData) {
            $.when(request.get('/_ajax/build', reqData))
                .done(getMoreBuildsDone);
        }

        resTotal = response.count;
        if (response.result.length < resTotal) {
            // Add a small loading banner while we load more results.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            iNode = spanNode.appendChild(document.createElement('i'));
            iNode.className = 'fa fa-circle-o-notch fa-spin fa-fw';

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
            spanNode.appendChild(
                document.createTextNode('loading more results'));
            spanNode.insertAdjacentHTML('beforeend', '&#8230;');

            html.replaceByClassNode('table-process', docFrag);

            totalReq = Math.floor(resTotal / appconst.MAX_QUERY_LIMIT);

            // Starting at 1 since we already got the first batch of results.
            for (idx = 1; idx <= totalReq; idx = idx + 1) {
                lBuildReqData = {
                    sort: 'created_on',
                    sort_order: -1,
                    date_range: gDateRange,
                    limit: appconst.MAX_QUERY_LIMIT,
                    field: gBuildSearchFields,
                    skip: appconst.MAX_QUERY_LIMIT * idx
                };
                setTimeout(getData.bind(null, lBuildReqData), 25);
            }
        }
    }

    function getBuildsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBuildsDone(response) {
        var columns;
        var results;

        function _renderKernel(data, type, object) {
            var href = '/build/';
            href += object.job;
            href += '/branch/';
            href += object.git_branch;
            href += '/kernel/';
            href += data;
            href += '/';
            return buildt.renderKernel(data, type, href);
        }

        function _renderDetails(data, type, object) {
            var href = '/build/id/';
            href += object._id.$oid;
            href += '/';
            return buildt.renderDetails(href, type);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data available.'));
        } else {
            columns = [
                {
                    data: 'job',
                    title: 'Tree',
                    type: 'string',
                    className: 'tree-column',
                    render: buildt.renderTree
                },
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
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    type: 'string',
                    className: 'defconfig-column',
                    render: buildt.renderDefconfig
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
                },
                {
                    data: 'compiler_version_ext',
                    title: 'Compiler',
                    type: 'string',
                    className: 'compiler-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: buildt.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: buildt.renderStatus
                },
                {
                    data: 'job',
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
                .order([5, 'desc'])
                .rowURL('/build/id/%(_id)s/')
                .rowURLElements(['_id'])
                .draw();

            gBuildsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getBuilds() {
        var reqData;
        reqData = {
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            limit: appconst.MAX_QUERY_LIMIT,
            field: gBuildSearchFields
        };
        $.when(request.get('/_ajax/build', reqData))
            .fail(error.error, getBuildsFail)
            .done(getBuildsDone, getMoreBuilds);
    }

    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gBuildsTable = table({
        tableId: 'builds-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(getBuilds, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
