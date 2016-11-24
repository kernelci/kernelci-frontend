/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
], function($, init, e, r, table, html, appconst, buildt) {
    'use strict';
    var gBuildsTable;
    var gBuildReqData;
    var gDateRange;
    var gPageLen;
    var gSearchFilter;

    document.getElementById('li-build').setAttribute('class', 'active');

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    /**
     * Update the table with the new data.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBuildsDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            setTimeout(function() {
                gBuildsTable.addRows(results);
            }, 0);
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
        var deferred;
        var docFrag;
        var iNode;
        var idx;
        var resTotal;
        var spanNode;
        var totalReq;

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
                gBuildReqData.skip = appconst.MAX_QUERY_LIMIT * idx;
                deferred = r.get('/_ajax/build', gBuildReqData);
                $.when(deferred).done(getMoreBuildsDone);
            }
        }
    }

    function getBuildsFail() {
        html.removeElement('table-loading');
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBuildsDone(response) {
        var columns;
        var results;

        function _renderKernel(data, type, object) {
            return buildt.renderKernel(
                data, type, '/build/' + object.job + '/kernel/' + data + '/');
        }

        function _renderDetails(data, type, object) {
            return buildt.renderDetails(
                '/build/id/' + object._id.$oid + '/', type);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement('table-loading');
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data available'));
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
                .languageLengthMenu('build reports per page')
                .rowURL('/build/id/%(_id)s/')
                .rowURLElements(['_id'])
                .draw();

            gBuildsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getBuilds() {
        var deferred;

        deferred = r.get('/_ajax/build', gBuildReqData);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
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

    gBuildReqData = {
        sort: 'created_on',
        sort_order: -1,
        date_range: gDateRange,
        limit: appconst.MAX_QUERY_LIMIT,
        field: [
            '_id',
            'arch',
            'created_on',
            'defconfig_full',
            'git_branch',
            'job',
            'kernel',
            'status'
        ]
    };

    gBuildsTable = table({
        tableId: 'builds-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    setTimeout(getBuilds, 0);

    init.hotkeys();
    init.tooltip();
});
