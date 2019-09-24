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
    'utils/table',
    'utils/html',
    'tables/boot',
    'utils/const'
], function($, init, e, r, table, html, tboot, appconst) {
    'use strict';
    var gBoard;
    var gBootReqData;
    var gBootsTable;
    var gDateRange;
    var gTree;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

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
        var iNode;
        var idx;
        var resLen;
        var resTotal;
        var spanNode;
        var totalReq;

        function getData(reqData) {
            $.when(r.get('/_ajax/boot', reqData))
                .done(getMoreBootsDone);
        }

        resTotal = response.count;
        resLen = response.result.length;

        if (resLen < resTotal) {
            // Add a small loading banner while we load more results.
            spanNode = document.createElement('span');

            iNode = document.createElement('i');
            iNode.className = 'fa fa-circle-o-notch fa-spin fa-fw';

            spanNode.appendChild(iNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
            spanNode.appendChild(
                document.createTextNode('loading more results'));
            spanNode.insertAdjacentHTML('beforeend', '&#8230;');

            html.replaceByClassNode('table-process', spanNode);

            totalReq = Math.floor(resTotal / appconst.MAX_QUERY_LIMIT);

            // Starting at 1 since we already got the first batch of results.
            for (idx = 1; idx <= totalReq; idx = idx + 1) {
                gBootReqData.skip = appconst.MAX_QUERY_LIMIT * idx;

                setTimeout(getData.bind(null, gBootReqData), 25);
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
        var columns,
            results;

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            columns = [
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: tboot.renderKernel
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column-nf',
                    render: tboot.renderDefconfig
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    className: 'arch-column'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
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
                    orderable: false,
                    searchable: false,
                    className: 'pull-center',
                    width: '30px',
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
                .gPageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getBoots() {
        $.when(r.get('/_ajax/boot', gBootReqData))
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getMoreBoots);
    }

    function setUpData() {
        var aNode;
        var iNode;
        var spanNode;
        var str;
        var tooltipNode;

        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        str = 'Boot reports for tree &#171;';
        str += gTree;
        str += '&#187;';
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
        str = 'Details for tree &#171;';
        str += gTree;
        str += '&#187;';
        tooltipNode.setAttribute('title', str);

        aNode = document.createElement('a');
        str = '/job/';
        str += gTree;
        str += '/';
        aNode.setAttribute('href', str);

        iNode = document.createElement('i');
        iNode.className = 'fa fa-sitemap';

        aNode.appendChild(iNode);
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);
        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        tooltipNode = html.tooltip();
        str = 'Boot reports for board &#171;';
        str += gBoard;
        str += '&#187;';
        tooltipNode.setAttribute(
            'title', str);

        aNode = document.createElement('a');
        str = '/boot/';
        str += gBoard;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(gBoard));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-search';

        aNode.appendChild(iNode);
        tooltipNode.appendChild(aNode);
        html.replaceContent(document.getElementById('dd-board'), tooltipNode);
    }

    if (document.getElementById('board-name') !== null) {
        gBoard = document.getElementById('board-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gTree = document.getElementById('job-name').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gBootReqData = {
        board: gBoard,
        date_range: gDateRange,
        job: gTree,
        limit: appconst.MAX_QUERY_LIMIT,
        sort: 'created_on',
        sort_order: -1
    };

    gBootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });

    setTimeout(setUpData, 10);
    setTimeout(getBoots, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
