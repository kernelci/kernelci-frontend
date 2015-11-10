/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'tables/boot',
    'utils/const'
], function($, e, init, r, t, html, boot, appconst) {
    'use strict';
    var boardName,
        bootReqData,
        bootsTable,
        dateRange,
        pageLen,
        searchFilter;

    document.getElementById('li-boot').setAttribute('class', 'active');
    dateRange = appconst.MAX_DATE_RANGE;
    pageLen = null;
    searchFilter = null;

    /**
     * Update the table with the new data.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBootsDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            bootsTable.addRows(results);
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
        var deferred,
            iNode,
            idx,
            resLen,
            resTotal,
            spanNode,
            totalReq;

        resTotal = response.count;
        resLen = response.result.length;

        if (resLen < resTotal) {
            // Add a small loading banner while we load more results.
            spanNode = document.createElement('span');

            iNode = document.createElement('i');
            iNode.className = 'fa fa-cog fa-spin';

            spanNode.appendChild(iNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
            spanNode.appendChild(
                document.createTextNode('loading more results'));
            spanNode.insertAdjacentHTML('beforeend', '&#8230;');

            html.replaceByClassNode('table-process', spanNode);

            totalReq = Math.floor(resTotal / appconst.MAX_QUERY_LIMIT);

            // Starting at 1 since we already got the first batch of results.
            for (idx = 1; idx <= totalReq; idx = idx + 1) {
                bootReqData.skip = appconst.MAX_QUERY_LIMIT * idx;
                deferred = r.get('/_ajax/boot', bootReqData);
                $.when(deferred)
                    .done(getMoreBootsDone);
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
            results,
            rowURLFmt;


        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
                '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'job',
                    title: 'Tree',
                    type: 'string',
                    className: 'tree-column',
                    render: boot.renderTableTree
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    className: 'branch-column'
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    className: 'kernel-column',
                    render: boot.renderTableKernel
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: boot.renderTableDefconfig
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
                    render: boot.renderTableDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: boot.renderTableStatus
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: boot.renderTableDetail
                }
            ];

            bootsTable
                .data(results)
                .columns(columns)
                .order([7, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name'])
                .draw();

            bootsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get('/_ajax/boot', bootReqData);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone, getMoreBoots);
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('board-name') !== null) {
        boardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }

    bootReqData = {
        board: boardName,
        date_range: dateRange,
        field: [
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
        ],
        limit: appconst.MAX_QUERY_LIMIT,
        sort: 'created_on',
        sort_order: -1
    };

    bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
    getBoots();
});
