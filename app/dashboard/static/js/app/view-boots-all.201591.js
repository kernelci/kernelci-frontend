/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/tables',
    'utils/html',
    'utils/date'
], function($, init, e, r, t, html) {
    'use strict';
    var bootsTable,
        dateRange,
        pageLen,
        searchFilter;

    document.getElementById('li-boot').setAttribute('class', 'active');

    searchFilter = null;
    pageLen = null;
    bootsTable = null;
    dateRange = 14;

    function getBootsFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns,
            resLen,
            results,
            rowURL;

        results = response.result;
        resLen = results.length;
        if (resLen === 0) {
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No boots data available'));
        } else {
            rowURL = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
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
                    title: 'Tree &dash; Branch',
                    type: 'string',
                    className: 'tree-column',
                    render: function(data, type, object) {
                        var aNode,
                            branch,
                            branchNode,
                            rendered,
                            tooltipNode;

                        branch = object.git_branch;
                        rendered = data;

                        if (branch !== null && branch !== undefined) {
                            rendered = rendered + ' ' + branch;
                        }

                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title', 'Boot reports for&nbsp;' + data);

                            aNode = html.a();
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href', '/boot/all/job/' + data + '/');

                            aNode.appendChild(document.createTextNode(data));

                            if (branch !== null && branch !== undefined) {
                                branchNode = html.small();
                                branchNode.appendChild(
                                    document.createTextNode(branch));

                                aNode.innerHTML = aNode.innerHTML +
                                    '&nbsp;&dash;&nbsp;';
                                aNode.appendChild(branchNode);
                            }

                            tooltipNode.appendChild(aNode);

                            rendered = tooltipNode.outerHTML;
                        }

                        return rendered;
                    }
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
                                'title',
                                'Boot reports for&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + data
                            );

                            aNode = html.a();
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
                    data: 'board',
                    title: 'Board Model',
                    type: 'string',
                    className: 'board-column',
                    render: function(data, type, object) {
                        var aNode,
                            job,
                            kernel,
                            tooltipNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            job = object.job;
                            kernel = object.kernel;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for board&nbsp;' + data +
                                '&nbsp;with&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel
                            );

                            aNode = html.a();
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + job +
                                '/kernel/' + kernel + '/'
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
                    className: 'defconfig-column',
                    render: function(data, type, object) {
                        var aNode,
                            board,
                            job,
                            kernel,
                            rendered,
                            tooltipNode;

                        board = object.board;
                        job = object.job;
                        kernel = object.kernel;

                        rendered = data;
                        if (type === 'display') {
                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute(
                                'title',
                                'Boot reports for board&nbsp;' + board +
                                '&nbsp;with&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel +
                                '&nbsp;and&nbsp;' + data
                            );

                            aNode = html.a();
                            aNode.className = 'table-link';
                            aNode.setAttribute(
                                'href',
                                '/boot/' + board + '/job/' + job +
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
                    type: 'string'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column',
                    render: function(data, type) {
                        var labNode,
                            rendered;

                        rendered = data;
                        if (type === 'display') {
                            labNode = html.small();
                            labNode.appendChild(document.createTextNode(data));
                            rendered = labNode.outerHTML;
                        }

                        return rendered;
                    }
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: function(data, type) {
                        var created,
                            iNode,
                            tooltipNode;

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
                    width: '30px',
                    className: 'pull-center',
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
                                'title',
                                'Details for board&nbsp;' + data +
                                '&nbsp;with tree&nbsp;' + job +
                                '&nbsp;&dash;&nbsp;' + kernel +
                                '&nbsp;and&nbsp;' + defconfigFull +
                                '&nbsp;(' + lab + ')'
                            );
                            aNode = html.a();
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + job +
                                '/kernel/' + kernel +
                                '/defconfig/' + defconfigFull +
                                '/lab/' + lab + '/?_id=' + object._id.$oid
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

            bootsTable
                .tableData(results)
                .columns(columns)
                .order([7, 'desc'])
                .menu('boot reports per page')
                .rowURL(rowURL)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name']
                )
                .draw();

            bootsTable
                .pageLen(pageLen)
                .search(searchFilter);
        }
    }

    function getBoots() {
        var data,
            deferred;

        data = {
            sort: 'created_on',
            sort_order: -1,
            date_range: dateRange
        };

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
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

    bootsTable = t(['bootstable', 'table-loading', 'table-div'], true);
    getBoots();
});
