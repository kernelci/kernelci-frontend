/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls',
    'utils/html',
    'utils/boot',
    'utils/tables',
    'utils/date'
], function($, e, init, r, u, html, boot, tables) {
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

        results = response.result;
        if (results.length === 0) {
            html.removeElement(
                document.getElementById('table-loading'));
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
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column'
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    className: 'arch-column'
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    className: 'failure-column',
                    render: function(data, type) {
                        var rendered,
                            tooltipNode;

                        rendered = '';
                        if (data) {
                            rendered = data;

                            if (type === 'display') {
                                data = html.escape(data);

                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('title', data);
                                tooltipNode.insertAdjacentHTML(
                                    'beforeend', data);

                                rendered = tooltipNode.outerHTML;
                            }
                        }
                        return rendered;
                    }
                },
                {
                    data: 'file_server_url',
                    title: 'Boot Log',
                    className: 'log-column pull-center',
                    render: function(data, type, object) {
                        var arch,
                            logNode,
                            pathURI,
                            rendered,
                            serverResource,
                            serverURI,
                            translatedURI,
                            urlData;

                        rendered = null;
                        if (type === 'display') {
                            if (!data) {
                                data = fileServer;
                            }

                            serverResource = object.file_server_resource;
                            arch = object.arch;

                            urlData = [
                                jobName, kernelName, arch + '-' + defconfigFull
                            ];

                            translatedURI = u.translateServerURL(
                                data, serverResource, urlData
                            );
                            serverURI = translatedURI[0];
                            pathURI = translatedURI[1];

                            logNode = boot.createBootLog(
                                object.boot_log,
                                object.boot_log_html,
                                object.lab_name,
                                serverURI,
                                pathURI
                            );
                            if (logNode) {
                                rendered = logNode.outerHTML;
                            }
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
                    width: '30px',
                    className: 'pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            job,
                            kernel,
                            lab,
                            rendered,
                            tooltipNode;

                        rendered = null;
                        if (type === 'display') {
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
                .rowURL(rowURLFmt)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name'])
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
            iNode,
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

        iNode = document.createElement('i');
        iNode.className = 'fa fa-sitemap';

        aNode.appendChild(iNode);
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

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cube';

        aNode.appendChild(iNode);
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-git-describe'), spanNode);

        // Add the defconfig data.
        html.replaceContent(
            document.getElementById('dd-defconfig'),
            document.createTextNode(defconfigFull));
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

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

    bootsTable = tables(['boots-table', 'table-loading', 'table-div'], false);
    setUpData();
    getBoots();
});
