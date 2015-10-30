/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/const',
    'utils/date'
], function($, init, e, r, t, html, appconst) {
    'use strict';
    var boardName,
        bootReqData,
        bootsTable,
        dateRange,
        jobName,
        pageLen,
        rowURLFmt,
        searchFilter;

    document.getElementById('li-boot').setAttribute('class', 'active');

    dateRange = appconst.MAX_DATE_RANGE;
    pageLen = null;
    searchFilter = null;
    rowURLFmt = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
        '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

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
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: function(data, type, object) {
                        var aNode,
                            job,
                            tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            job = object.job;
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Boot reports for&nbsp;' + data);

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/all/job/' + job + '/kernel/' +
                                data + '/'
                            );

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column-nf',
                    render: function(data, type, object) {
                        var aNode,
                            job,
                            kernel,
                            rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            job = object.job;
                            kernel = object.kernel;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Boot reports for&nbsp;' + data);

                            aNode = document.createElement('a');
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/' + boardName + '/job/' + job +
                                '/kernel/' + kernel + '/defconfig/' +
                                data + '/'
                            );

                            aNode.appendChild(document.createTextNode(data));
                            tooltipNode.appendChild(aNode);

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
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column'
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
                        var rendered,
                            tooltipNode;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();

                            switch (data) {
                                case 'PASS':
                                    tooltipNode.setAttribute(
                                        'title', 'Board booted successfully');
                                    tooltipNode.appendChild(html.success());
                                    break;
                                case 'FAIL':
                                    tooltipNode.setAttribute(
                                        'title', 'Board boot failed');
                                    tooltipNode.appendChild(html.fail());
                                    break;
                                case 'OFFLINE':
                                    tooltipNode.setAttribute(
                                        'title', 'Board offline');
                                    tooltipNode.appendChild(html.offline());
                                    break;
                                default:
                                    tooltipNode.setAttribute(
                                        'href', 'Board boot status unknown');
                                    tooltipNode.appendChild(html.unknown());
                                    break;
                            }

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'pull-center',
                    width: '30px',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode,
                            defconfigFull,
                            kernel,
                            job,
                            lab;

                        rendered = null;
                        if (type === 'display') {
                            defconfigFull = object.defconfig_full;
                            job = object.job;
                            kernel = object.kernel;
                            lab = object.lab_name;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Boot report details');
                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + job +
                                '/kernel/' + kernel +
                                '/defconfig/' + defconfigFull +
                                '/lab/' + lab + '/?_id=' + object._id.$oid
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

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
                .menu('boot reports per page')
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

    function setUpData() {
        var spanNode,
            aNode,
            iNode,
            tooltipNode;

        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'All boot reports for &nbsp;&#171;' + jobName + '&#187;');

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/job/' + jobName + '/');
        aNode.appendChild(document.createTextNode(jobName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Details for job&nbsp;&#171;' + jobName + '&#187;');

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + jobName + '/');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-sitemap';

        aNode.appendChild(iNode);
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);
        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'All boot reports for &nbsp;&#171;' + boardName + '&#187;');

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/' + boardName + '/');
        aNode.appendChild(document.createTextNode(boardName));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-search';

        aNode.appendChild(iNode);
        tooltipNode.appendChild(aNode);
        html.replaceContent(document.getElementById('dd-board'), tooltipNode);
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('board-name') !== null) {
        boardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }

    bootReqData = {
        board: boardName,
        date_range: dateRange,
        job: jobName,
        limit: appconst.MAX_QUERY_LIMIT,
        sort: 'created_on',
        sort_order: -1
    };

    bootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
    setUpData();
    getBoots();
});
