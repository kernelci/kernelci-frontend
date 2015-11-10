/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/html',
    'tables/boot',
    'utils/date'
], function($, e, init, r, t, html, boot) {
    'use strict';
    var gBoardName,
        gBootsTable,
        gFileServer,
        gJobName,
        gKernelName,
        gPageLen,
        gSearchFilter;

    document.getElementById('li-boot').setAttribute('class', 'active');

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var results,
            columns,
            rowURL;

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
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
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column',
                    render: boot.renderTableLabAll
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: boot.renderTableDefconfig
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    className: 'failure-column',
                    render: boot.renderTableResultDescription
                },
                {
                    data: 'file_server_url',
                    title: 'Boot Log',
                    className: 'log-column pull-center',
                    render: function(data, type, object) {
                        object.default_file_server = gFileServer;
                        return boot.renderTableLogs(data, type, object);
                    }
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

            gBootsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .languageLengthMenu('boot reports per page')
                .rowURL(rowURL)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name'])
                .draw();

            gBootsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: gBoardName,
                job: gJobName,
                kernel: gKernelName
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    function setupData() {
        var aNode,
            spanNode,
            tooltipNode;

        // Add the tree data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot details for&nbsp;' + gJobName);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/job/' + gJobName + '/');
        aNode.appendChild(document.createTextNode(gJobName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Details for job&nbsp;' + gJobName);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + gJobName + '/');

        aNode.appendChild(html.tree());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        // Add the kernel data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + gJobName +
                '&nbsp;&dash;&nbsp;' + gKernelName
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + gJobName + '/kernel/' + gKernelName + '/');
        aNode.appendChild(document.createTextNode(gKernelName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Build reports for&nbsp;' + gJobName +
                '&nbsp;&dash;&nbsp;' + gKernelName
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/build/' + gJobName + '/kernel/' + gKernelName + '/');

        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // The board.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for board&nbsp;&#171;' + gBoardName + '&#187;');
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/' + gBoardName + '/');
        aNode.appendChild(document.createTextNode(gBoardName));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        tooltipNode.appendChild(aNode);
        html.replaceContent(document.getElementById('dd-board'), tooltipNode);
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

    if (document.getElementById('board-name') !== null) {
        gBoardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }

    gBootsTable = t(['boots-table', 'table-loading', 'table-div'], true);
    setupData();
    getBoots();
});
