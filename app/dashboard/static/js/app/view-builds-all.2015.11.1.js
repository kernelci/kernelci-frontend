/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'utils/date'
], function($, e, init, r, table, html, appconst) {
    'use strict';
    var buildsTable,
        buildReqData,
        dateRange,
        pageLen,
        searchFilter;

    document.getElementById('li-build').setAttribute('class', 'active');
    dateRange = appconst.MAX_DATE_RANGE;
    pageLen = null;
    searchFilter = null;

    /**
     * Update the table with the new data.
     *
     * @param {object} response: The response from the previous request.
    **/
    function getMoreBuildsDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            buildsTable.addRows(results);
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
                buildReqData.skip = appconst.MAX_QUERY_LIMIT * idx;
                deferred = r.get('/_ajax/build', buildReqData);
                $.when(deferred)
                    .done(getMoreBuildsDone);
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
        var columns,
            resLen,
            results,
            rowUrl;

        results = response.result;
        resLen = results.length;
        if (resLen === 0) {
            html.removeElement('table-loading');
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data available'));
        } else {
            rowUrl = '/build/%(job)s/kernel/%(kernel)s/' +
                'defconfig/%(defconfig_full)s/';

            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'job',
                    title: 'Tree &dash; Branch',
                    className: 'tree-column',
                    render: function(data, type, object) {
                        var aNode,
                            branch,
                            branchNode,
                            rendered;

                        branch = object.git_branch;
                        rendered = data;

                        if (branch !== null && branch !== undefined) {
                            rendered = rendered + ' ' + branch;
                        }

                        if (type === 'display') {
                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute('href', '/job/' + data + '/');

                            aNode.appendChild(document.createTextNode(data));

                            if (branch !== null && branch !== undefined) {
                                branchNode = document.createElement('small');
                                branchNode.appendChild(
                                    document.createTextNode(branch));

                                aNode.insertAdjacentHTML(
                                    'beforeend', '&nbsp;&dash;&nbsp;');
                                aNode.appendChild(branchNode);
                            }

                            rendered = aNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: function(data, type) {
                        var tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', data);

                            tooltipNode.appendChild(
                                document.createTextNode(data));

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: function(data, type) {
                        var tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', data);

                            tooltipNode.appendChild(
                                document.createTextNode(data));

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    className: 'arch-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: function(data, type) {
                        var created,
                            iNode,
                            rendered,
                            timeNode,
                            tooltipNode;

                        if (data === null) {
                            rendered = data;
                            if (type === 'display') {
                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('Not available');

                                iNode = document.createElement('i');
                                iNode.className = 'fa fa-ban';

                                tooltipNode.appendChild(iNode);
                                rendered = tooltipNode.outerHTML;
                            }
                        } else {
                            created = new Date(data.$date);
                            rendered = created.toCustomISODate();

                            if (type === 'display') {
                                timeNode = document.createElement('time');
                                timeNode.setAttribute(
                                    'datetime', created.toISOString());
                                timeNode.appendChild(
                                    document.createTextNode(
                                        created.toCustomISODate())
                                );
                                rendered = timeNode.outerHTML;
                            }
                        }

                        return rendered;
                    }
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: function(data, type) {
                        var tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();

                            switch (data) {
                                case 'PASS':
                                    tooltipNode.setAttribute(
                                        'title', 'Build completed');
                                    tooltipNode.appendChild(html.success());
                                    break;
                                case 'FAIL':
                                    tooltipNode.setAttribute(
                                        'title', 'Build failed');
                                    tooltipNode.appendChild(html.fail());
                                    break;
                                default:
                                    tooltipNode.setAttribute(
                                        'title', 'Unknown status');
                                    tooltipNode.appendChild(html.unknown());
                                    break;
                            }

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'job',
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode;

                        rendered = null;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Details for&nbsp;' + data +
                                '&nbsp;&dash;&nbsp;' + object.kernel +
                                '&nbsp;and&nbsp;' + object.defconfig_full
                            );

                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/build/' + data + '/kernel/' + object.kernel +
                                '/defconfig/' + object.defconfig_full +
                                '/?_id=' + object._id.$oid
                            );

                            iNode = document.createElement('i');
                            iNode.className = 'fa fa-search';

                            aNode.appendChild(iNode);
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                }
            ];

            buildsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .languageLengthMenu('build reports per page')
                .rowURL(rowUrl)
                .rowURLElements(['job', 'kernel', 'defconfig_full'])
                .draw();

            buildsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBuilds() {
        var deferred;

        deferred = r.get('/_ajax/build', buildReqData);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone, getMoreBuilds);
    }

    init.hotkeys();
    init.tooltip();

    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }

    buildReqData = {
        sort: 'created_on',
        sort_order: -1,
        date_range: dateRange,
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

    buildsTable = table({
        tableId: 'builds-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div',
        disableSearch: true
    });
    getBuilds();
});
