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
    'utils/const',
    'tables/boot'
], function($, init, e, r, table, html, appconst, tboot) {
    'use strict';
    var gBootSearchFields;
    var gBootsTable;
    var gDateRange;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    gSearchFilter = null;
    gPageLen = null;
    gDateRange = appconst.MAX_DATE_RANGE;
    gBootSearchFields = [
        '_id',
        'arch',
        'board',
        'created_on',
        'defconfig_full',
        'git_branch',
        'job',
        'kernel',
        'lab_name',
        'status'
    ];

    /**
     * Update the table with the new data.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBootsDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            setTimeout(gBootsTable.addRows.bind(gBootsTable, results), 25);
        }

        // Remove the loading banner when we get the last response.
        // Not the best solution since the last real response might come
        // before other requests depending on API time.
        if ((response.skip + response.limit) >= response.count) {
            html.removeChildrenByClass('table-process');
        }
    }

    /**
     * Get the other remaining boot reports.
     * Triggered after the initial get request.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBoots(response) {
        var docFrag;
        var iNode;
        var idx;
        var lBootReqData;
        var resTotal;
        var spanNode;
        var totalReq;

        function getData(reqData) {
            $.when(r.get('/_ajax/boot', reqData))
                .done(getMoreBootsDone);
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
                lBootReqData = {
                    sort: 'created_on',
                    sort_order: -1,
                    date_range: gDateRange,
                    limit: appconst.MAX_QUERY_LIMIT,
                    fields: gBootSearchFields,
                    skip: appconst.MAX_QUERY_LIMIT * idx
                };
                setTimeout(getData.bind(null, lBootReqData), 25);
            }
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns;
        var results;

        /**
         * Wrapper to provide the href.
        **/
        function _renderTree(data, type) {
            var href = '/boot/all/job/';
            href += data;
            href += '/';

            return tboot.renderTree(data, type, href);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No boots data available.'));
        } else {
            columns = [
                {
                    data: 'job',
                    title: 'Tree',
                    type: 'string',
                    className: 'tree-column',
                    render: _renderTree
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
                    render: tboot.renderKernel
                },
                {
                    data: 'board',
                    title: 'Board Model',
                    type: 'string',
                    className: 'board-column',
                    render: tboot.renderBoard
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    type: 'string',
                    className: 'defconfig-column',
                    render: tboot.renderDefconfig
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    type: 'string',
                    className: 'lab-column'
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
                .order([7, 'desc'])
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
        var reqData;
        reqData = {
            sort: 'created_on',
            sort_order: -1,
            date_range: gDateRange,
            limit: appconst.MAX_QUERY_LIMIT,
            fields: gBootSearchFields
        };
        $.when(r.get('/_ajax/boot', reqData))
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getMoreBoots);
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

    gBootsTable = table({
        tableId: 'bootstable',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getBoots, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
