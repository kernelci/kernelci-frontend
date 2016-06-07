/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/html',
    'tables/boot',
    'utils/table'
], function($, init, e, r, html, tboot, table) {
    'use strict';
    var boardName,
        bootsTable,
        defconfigFull,
        fileServer,
        jobName,
        kernelName;

    document.getElementById('li-boot').setAttribute('class', 'active');

    function getBootsFail() {
        html.removeElement(
            document.getElementById('boot-reports-loading-div'));
        html.replaceContent(
            document.getElementById('other-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns,
            results,
            rowURLFmt;

        /**
         * Wrapper to inject the server URL.
        **/
        function _renderBootLogs(data, type, object) {
            object.default_file_server = fileServer;
            return tboot.renderBootLogs(data, type, object);
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(
                document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No data found.'));
        } else {
            rowURLFmt = '/boot/id/%(_id)s/';

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
                    type: 'string',
                    className: 'lab-column',
                    render: tboot.renderLab
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    type: 'string',
                    className: 'arch-column'
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    type: 'string',
                    className: 'failure-column',
                    render: tboot.renderResultDescription
                },
                {
                    data: 'file_server_url',
                    title: 'Boot Log',
                    type: 'string',
                    className: 'log-column pull-center',
                    render: _renderBootLogs
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

            bootsTable
                .data(results)
                .columns(columns)
                .order([5, 'desc'])
                .rowURL(rowURLFmt)
                .rowURLElements(['_id'])
                .draw();
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: boardName,
                job: jobName,
                kernel: kernelName,
                defconfig_full: defconfigFull
            }
        );
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    function setUpData() {
        var aNode,
            spanNode,
            tooltipNode;

        // Add the tree data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot details for&nbsp;' + jobName);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/job/' + jobName + '/');
        aNode.appendChild(document.createTextNode(jobName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Details for job&nbsp;' + jobName);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + jobName + '/');

        aNode.appendChild(html.tree());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        // Add the kernel data.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + jobName +
                '&nbsp;&dash;&nbsp;' + kernelName
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + jobName + '/kernel/' + kernelName + '/');
        aNode.appendChild(document.createTextNode(kernelName));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Build reports for&nbsp;' + jobName +
                '&nbsp;&dash;&nbsp;' + kernelName
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/build/' + jobName + '/kernel/' + kernelName + '/');

        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // Add the defconfig data.
        html.replaceContent(
            document.getElementById('dd-defconfig'),
            document.createTextNode(defconfigFull));
    }

    if (document.getElementById('board-name') !== null) {
        boardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        defconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        kernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('file-server') !== null) {
        fileServer = document.getElementById('file-server').value;
    }

    bootsTable = table({
        tableId: 'boots-table',
        tableLoadingDivId: 'table-loading',
        tableDivId: 'table-div'
    });
    setUpData();
    getBoots();

    init.hotkeys();
    init.tooltip();
});
