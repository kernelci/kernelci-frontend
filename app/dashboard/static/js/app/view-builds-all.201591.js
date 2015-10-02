/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/date'
], function($, e, init, r, t, html) {
    'use strict';
    var buildsTable,
        dateRange,
        pageLen,
        searchFilter;

    document.getElementById('li-build').setAttribute('class', 'active');

    dateRange = 14;

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
                            aNode = html.a();
                            aNode.className = 'table-link';
                            aNode.setAttribute('href', '/job/' + data + '/');

                            aNode.appendChild(document.createTextNode(data));

                            if (branch !== null && branch !== undefined) {
                                branchNode = html.small();
                                branchNode.appendChild(
                                    document.createTextNode(branch));

                                aNode.innerHTML = aNode.innerHTML +
                                    '&nbsp;&dash;&nbsp;';
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
                    title: 'Arch.'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: function(data, type) {
                        var tooltipNode,
                            created,
                            iNode;

                        if (data === null) {
                            created = data;
                            if (type === 'display') {
                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('Not available');

                                iNode = html.i();
                                iNode.className = 'fa fa-ban';

                                tooltipNode.appendChild(iNode);
                                created = tooltipNode.outerHTML;
                            }
                        } else {
                            created = new Date(data.$date);
                            if (type === 'display' || type === 'filter') {
                                created = created.toCustomISODate();
                            }
                        }

                        return created;
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
                    className: 'pull-center',
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
                                '&nbsp;and;&nbsp;' + object.defconfig_full
                            );

                            aNode = html.a();
                            aNode.setAttribute(
                                'href',
                                '/build/' + data + '/kernel/' + object.kernel +
                                '/defconfig/' + object.defconfig_full + '/'
                            );

                            iNode = html.i();
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
                .tableData(results)
                .columns(columns)
                .order([5, 'desc'])
                .menu('build reports per page')
                .rowURL(rowUrl)
                .rowURLElements(['job', 'kernel', 'defconfig_full'])
                .draw();

            buildsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBuilds() {
        var data,
            deferred;

        data = {
            sort: 'created_on',
            sort_order: -1,
            date_range: dateRange,
            field: [
                '_id', 'job', 'kernel', 'status',
                'arch', 'created_on', 'git_branch', 'defconfig_full'
            ]
        };

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone);
    }

    init();

    if (document.getElementById('search-filter') !== null) {
        searchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        pageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        dateRange = document.getElementById('date-range').value;
    }

    buildsTable = t(['builds-table', 'table-loading', 'table-div'], true);
    getBuilds();
});
