/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/html',
    'utils/table',
    'utils/date'
], function($, init, format, e, r, urls, bisect, html, table) {
    'use strict';
    var buildId,
        defconfigFull,
        fileServer,
        jobName,
        kernelName;

    document.getElementById('li-build').setAttribute('class', 'active');

    function getBisectFail() {
        html.removeElement('bisect-loading-div');
        html.replaceContent(
            document.getElementById('bisect-content'),
            html.errorDiv('Error loading bisect data.'));
        html.removeClass(document.getElementById('bisect-content'), 'hidden');
    }

    function getBisectToMainlineFail() {
        html.removeElement('bisect-compare-loading-div');
        html.replaceContent(
            document.getElementById('bisect-compare-content'),
            html.errorDiv('Error loading bisect data.'));
        html.removeClass(
            document.getElementById('bisect-compare-content'), 'hidden');
    }

    function getBisectToMainline(bisectData, build) {
        var deferred,
            settings;

        settings = {
            showHideID: 'buildb-compare-showhide',
            tableDivID: 'table-compare-div',
            tableID: 'bisect-compare-table',
            tableBodyID: 'bisect-compare-table-body',
            contentDivID: 'bisect-compare-content',
            loadingDivID: 'bisect-compare-loading-div',
            loadingContentID: 'bisect-compare-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: null,
            goodCommitID: null,
            bisectScriptContainerID: 'dl-bisect-compare-script',
            bisectScriptContentID: 'bisect-compare-script',
            bisectCompareDescriptionID: 'bisect-compare-description',
            prevBisect: bisectData,
            bisectShowHideID: 'bisect-compare-hide-div',
            isCompared: true
        };

        deferred = r.get(
            '/_ajax/bisect?collection=build&' +
                'compare_to=mainline&build_id=' + build,
            {}
        );

        $.when(deferred)
            .fail(e.error, getBisectToMainlineFail)
            .done(function(data) {
                settings.data = data;
                bisect(settings).draw();
            });
    }

    function getBisectCompareTo(response) {
        var bisectData,
            lBuildId,
            resLen,
            result;

        result = response.result;
        resLen = result.length;
        if (resLen > 0) {
            bisectData = result[0];
            lBuildId = bisectData.build_id.$oid;
            if (bisectData.job !== 'mainline') {
                html.removeClass(
                    document.getElementById('bisect-compare-div'), 'hidden');
                getBisectToMainline(bisectData, lBuildId);
            } else {
                html.removeElement(
                    document.getElementById('bisect-compare-div'));
            }
        } else {
            html.removeElement(document.getElementById('bisect-compare-div'));
        }
    }

    function getBisectDone(response) {
        var settings;

        settings = {
            showHideID: 'buildb-showhide',
            tableDivID: 'table-div',
            tableID: 'bisect-table',
            tableBodyID: 'bisect-table-body',
            contentDivID: 'bisect-content',
            loadingDivID: 'bisect-loading-div',
            loadingContentID: 'bisect-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: 'bad-commit',
            goodCommitID: 'good-commit',
            bisectScriptContainerID: 'dl-bisect-script',
            bisectScriptContentID: 'bisect-script',
            bisectCompareDescriptionID: null,
            prevBisect: null,
            bisectShowHideID: 'bisect-hide-div',
            data: response
        };

        bisect(settings).draw();
    }

    function getBisect(response) {
        var deferred,
            resLen,
            results;

        results = response.result;
        resLen = results.length;
        if (resLen > 0) {
            results = response.result[0];
            if (results.status === 'FAIL') {
                html.removeClass(document.getElementById('bisect'), 'hidden');
                html.removeClass(
                    document.getElementById('bisect-div'), 'hidden');

                deferred = r.get(
                    '/_ajax/bisect?collection=build&build_id=' +
                        results._id.$oid,
                    {}
                );

                $.when(deferred)
                    .fail(e.error, getBisectFail)
                    .done(getBisectDone, getBisectCompareTo);
            } else {
                html.removeElement(document.getElementById('bisect-div'));
            }
        } else {
            html.removeElement(document.getElementById('bisect-div'));
        }
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('table-div'),
            html.errorDiv('Error loading boot reports data.')
        );
    }

    function createBootLogLinks(object) {
        var aNode,
            arch,
            bootLogHtml,
            bootLogTxt,
            defconfig,
            divNode,
            fileServerData,
            job,
            kernel,
            labName,
            logPath,
            serverResource,
            serverUrl,
            tooltipNode,
            translatedUri;

        arch = object.arch;
        bootLogHtml = object.boot_log_html;
        bootLogTxt = object.boot_log;
        defconfig = object.defconfig_full;
        job = object.job;
        kernel = object.kernel;
        labName = object.lab_name;
        serverResource = object.file_server_resource;
        serverUrl = object.file_server_url;

        if (serverUrl === null || serverUrl === undefined) {
            serverUrl = fileServer;
        }

        fileServerData = [job, kernel, arch + '-' + defconfig];
        translatedUri = urls.translateServerURL(
            serverUrl, serverResource, fileServerData);

        divNode = null;
        if (bootLogTxt !== null || bootLogHtml !== null) {
            divNode = document.createElement('div');

            if (bootLogTxt !== null) {
                if (bootLogTxt.search(labName) === -1) {
                    logPath = translatedUri[1] + '/' + labName +
                        '/' + bootLogTxt;
                } else {
                    logPath = translatedUri[1] + '/' + bootLogTxt;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View raw text boot log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    translatedUri[0].path(logPath).normalizePath().href());

                aNode.appendChild(document.createTextNode('txt'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
                tooltipNode.appendChild(aNode);
                divNode.appendChild(tooltipNode);
            }

            if (bootLogHtml !== null) {
                if (bootLogTxt !== null) {
                    divNode.insertAdjacentHTML(
                        'beforeend', '&nbsp;&mdash;&nbsp;');
                }

                if (bootLogHtml.search(labName) === -1) {
                    logPath = translatedUri[1] + '/' + labName +
                        '/' + bootLogHtml;
                } else {
                    logPath = translatedUri[1] + '/' + bootLogHtml;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View HTML boot log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    translatedUri[0].path(logPath).normalizePath().href());

                aNode.appendChild(document.createTextNode('html'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
                tooltipNode.appendChild(aNode);
                divNode.appendChild(tooltipNode);
            }
        }

        return divNode;
    }

    function getBootsDone(response) {
        var bootsTable,
            columns,
            resLen,
            results,
            rowURL;

        results = response.result;
        resLen = results.length;

        if (resLen > 0) {
            rowURL = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
                '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

            bootsTable = table({
                tableId: 'bootstable',
                tableLoadingDivId: 'table-loading',
                tableDivId: 'boots-table-div'
            });

            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'board',
                    title: 'Board Model',
                    type: 'string',
                    className: 'board-column'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column'
                },
                {
                    data: 'boot_result_description',
                    title: 'Failure Reason',
                    className: 'failure-column',
                    render: function(data, type) {
                        var rendered,
                            tooltipNode;

                        rendered = data;
                        if (data !== null) {
                            rendered = html.escape(data);

                            if (type === 'display') {
                                tooltipNode = html.tooltip();
                                tooltipNode.setAttribute('title', rendered);
                                tooltipNode.setAttribute(
                                    'data-placement', 'left');
                                tooltipNode.insertAdjacentHTML(
                                    'beforeend', rendered);

                                rendered = tooltipNode.outerHTML;
                            }
                        }

                        return rendered;
                    }
                },
                {
                    data: 'boot_log',
                    title: 'Boot Log',
                    searchable: false,
                    orderable: false,
                    className: 'log-column pull-center',
                    render: function(data, type, object) {
                        var rendered;

                        rendered = null;
                        if (type === 'display') {
                            rendered = createBootLogLinks(object).outerHTML;
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
                    className: 'select-column pull-center',
                    render: function(data, type, object) {
                        var aNode,
                            iNode,
                            rendered,
                            tooltipNode,
                            lab;

                        rendered = null;
                        if (type === 'display') {
                            lab = object.lab_name;

                            tooltipNode = html.tooltip();
                            tooltipNode.setAttribute('title', 'More details');
                            aNode = document.createElement('a');
                            aNode.setAttribute(
                                'href',
                                '/boot/' + data + '/job/' + jobName +
                                '/kernel/' + kernelName +
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
                .data(results)
                .columns(columns)
                .lengthMenu([5, 10, 25, 50])
                .order([1, 'asc'])
                .languageLengthMenu('boot reports per page')
                .rowURL(rowURL)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name']
                )
                .draw();
        } else {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('boots-table-div'),
                html.errorDiv('No boot reports available.'));
        }
    }

    function getBoots(response) {
        var data,
            deferred,
            results,
            resLen;

        results = response.result;
        resLen = results.length;

        if (resLen > 0) {
            results = response.result[0];

            if (results._id !== null) {
                data = {
                    build_id: results._id.$oid,
                    field: [
                        '_id',
                        'arch',
                        'board',
                        'boot_result_description',
                        'boot_log',
                        'boot_log_html',
                        'file_server_url',
                        'file_server_resource',
                        'job', 'kernel', 'defconfig_full', 'lab_name', 'status'
                    ]
                };
            } else {
                data = {
                    defconfig: results.defconfig,
                    defconfig_full: results.defconfig_full,
                    field: [
                        '_id',
                        'arch',
                        'board',
                        'boot_result_description',
                        'boot_log',
                        'boot_log_html',
                        'file_server_url',
                        'file_server_resource',
                        'job', 'kernel', 'defconfig_full', 'lab_name', 'status'
                    ],
                    job: results.job,
                    kernel: results.kernel
                };
            }

            deferred = r.get('/_ajax/boot', data);
            $.when(deferred)
                .fail(e.error, getBootsFail)
                .done(getBootsDone);
        } else {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('boots-table-div'),
                html.errorDiv('No boot reports found.'));
        }
    }

    function getBuildsFail() {
        var tooltipNode,
            iNode;

        tooltipNode = document.createElement('span');
        tooltipNode.setAttribute('title', 'Not available');
        tooltipNode.setAttribute('rel', 'tooltip');
        tooltipNode.setAttribute('data-toggle', 'tooltip');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-ban';

        tooltipNode.appendChild(iNode);

        html.removeElement(document.getElementById('bisect-div'));
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('boots-table-div'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassHTML('loading-content', tooltipNode.outerHTML);
    }

    function getBuildsDone(response) {
        var aNode,
            arch,
            buildLog,
            buildModules,
            buildModulesSize,
            buildPlatform,
            buildTime,
            compiler,
            compilerVersion,
            compilerVersionFull,
            configFragments,
            createdOn,
            crossCompile,
            defconfig,
            defconfigNode,
            detailNode,
            divNode,
            dtb,
            fileServerData,
            fileServerResource,
            fileServerURI,
            fileServerURL,
            gitCommit,
            gitURL,
            gitURLs,
            job,
            kernel,
            kernelConfig,
            kernelImage,
            kernelImageSize,
            lDefconfigFull,
            modulesDirectory,
            pathURI,
            resLen,
            results,
            spanNode,
            textOffset,
            tooltipNode,
            translatedUri;

        results = response.result;
        resLen = results.length;

        function _createSizeNode(size) {
            var sizeNode;
            sizeNode = document.createElement('small');

            sizeNode.appendChild(document.createTextNode('('));
            sizeNode.appendChild(document.createTextNode(format.bytes(size)));
            sizeNode.appendChild(document.createTextNode(')'));

            return sizeNode;
        }

        if (resLen === 0) {
            html.removeElement('bisect-div');
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('boots-table-div'),
                html.errorDiv('No data available.'));
            html.replaceByClassTxt('loading-content', '?');
        } else {
            // We only have 1 result!
            results = response.result[0];
            job = results.job;
            kernel = results.kernel;
            gitURL = results.git_url;
            gitCommit = results.git_commit;
            createdOn = results.created_on;
            arch = results.arch;
            defconfig = results.defconfig;
            lDefconfigFull = results.defconfig_full;
            buildTime = results.build_time;
            dtb = results.dtb_dir;
            buildModules = results.modules;
            buildModulesSize = results.modules_size;
            modulesDirectory = results.modules_dir;
            textOffset = results.text_offset;
            configFragments = results.kconfig_fragments;
            kernelImage = results.kernel_image;
            kernelImageSize = results.kernel_image_size;
            kernelConfig = results.kernel_config;
            buildLog = results.build_log;
            buildPlatform = results.build_platform;
            fileServerURL = results.file_server_url;
            fileServerResource = results.file_server_resource;
            compiler = results.compiler;
            compilerVersion = results.compiler_version;
            compilerVersionFull = results.compiler_version_full;
            crossCompile = results.cross_compile;

            if (fileServerURL === null || fileServerURL === undefined) {
                fileServerURL = fileServer;
            }

            fileServerData = [
                job, kernel, arch + '-' + lDefconfigFull
            ];
            translatedUri = urls.translateServerURL(
                fileServerURL, fileServerResource, fileServerData);
            fileServerURI = translatedUri[0];
            pathURI = translatedUri[1];

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            detailNode = document.getElementById('details');
            detailNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = document.createElement('small');
            defconfigNode.appendChild(
                document.createTextNode('(' + defconfig + ')'));

            detailNode.appendChild(defconfigNode);

            spanNode = document.createElement('span');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + job);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/job/' + job + '/');
            aNode.appendChild(document.createTextNode(job));

            tooltipNode.appendChild(aNode);
            spanNode.appendChild(tooltipNode);

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for tree&nbsp;' + job);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/boot/all/job/' + job + '/');
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(document.getElementById('tree'), spanNode);

            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(results.git_branch));

            spanNode = document.createElement('span');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Build details for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/build/' + job + '/kernel/' + kernel + '/');
            aNode.appendChild(document.createTextNode(kernel));

            tooltipNode.appendChild(aNode);
            spanNode.appendChild(tooltipNode);

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/boot/all/job/' + job + '/kernel/' + kernel + '/');
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('git-describe'), spanNode);

            if (gitURLs[0] !== null) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-url'), aNode);
            } else {
                if (gitURL !== null) {
                    html.replaceContent(
                        document.getElementById('git-url'),
                        document.createTextNode(gitURL));
                } else {
                    html.replaceContent(
                        document.getElementById('git-url'), html.nonavail());
                }
            }

            if (gitURLs[1] !== null) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-commit'), aNode);
            } else {
                if (gitCommit !== null) {
                    html.replaceContent(
                        document.getElementById('git-commit'),
                        document.createTextNode(gitCommit));
                } else {
                    html.replaceContent(
                        document.getElementById('git-commit'),
                        html.nonavail());
                }
            }

            if (crossCompile) {
                html.replaceContent(
                    document.getElementById('cross-compile'),
                    document.createTextNode(crossCompile));
            } else {
                html.replaceContent(
                    document.getElementById('cross-compile'),
                    html.nonavail());
            }

            if (compiler) {
                html.replaceContent(
                    document.getElementById('compiler'),
                    document.createTextNode(compiler));
            } else {
                html.replaceContent(
                    document.getElementById('compiler'), html.nonavail());
            }

            if (compilerVersion) {
                html.replaceContent(
                    document.getElementById('compiler-version'),
                    document.createTextNode(compilerVersion));
            } else {
                html.replaceContent(
                    document.getElementById('compiler-version'),
                    html.nonavail());
            }

            if (compilerVersionFull) {
                html.replaceContent(
                    document.getElementById('compiler-version-full'),
                    document.createTextNode(compilerVersionFull));
            } else {
                html.replaceContent(
                    document.getElementById('compiler-version-full'),
                    html.nonavail());
            }

            if (arch) {
                html.replaceContent(
                    document.getElementById('build-arch'),
                    document.createTextNode(arch));
            } else {
                html.replaceContent(
                    document.getElementById('build-arch'), html.nonavail());
            }

            html.replaceContent(
                document.getElementById('build-errors'),
                document.createTextNode(results.errors));

            html.replaceContent(
                document.getElementById('build-warnings'),
                document.createTextNode(results.warnings));

            if (buildTime !== null) {
                html.replaceContent(
                    document.getElementById('build-time'),
                    document.createTextNode(buildTime + 'sec.'));
            } else {
                html.replaceContent(
                    document.getElementById('build-time'), html.nonavail());
            }

            spanNode = document.createElement('span');

            spanNode.appendChild(document.createTextNode(lDefconfigFull));

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + jobName +
                    '&nbsp;&dash;&nbsp;' + kernelName +
                    '&nbsp;&dash;&nbsp;' + lDefconfigFull
                );

            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                '/boot/all/job/' + jobName + '/kernel/' +
                kernelName + '/defconfig/' + lDefconfigFull + '/'
            );
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('build-defconfig'), spanNode);

            html.replaceContent(
                document.getElementById('build-date'), html.time(createdOn));

            tooltipNode = html.tooltip();
            switch (results.status) {
                case 'PASS':
                    tooltipNode.setAttribute('title', 'Build completed');
                    tooltipNode.appendChild(html.success());
                    break;
                case 'FAIL':
                    tooltipNode.setAttribute('title', 'Build failed');
                    tooltipNode.appendChild(html.fail());
                    break;
                default:
                    tooltipNode.setAttribute('title', 'Unknown status');
                    tooltipNode.appendChild(html.unknown());
                    break;
            }

            html.replaceContent(
                document.getElementById('build-status'), tooltipNode);

            if (dtb !== null) {
                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + dtb + '/')
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(dtb));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(document.getElementById('dtb-dir'), aNode);
            } else {
                html.replaceContent(
                    document.getElementById('dtb-dir'), html.nonavail());
            }

            if (buildModules !== null) {
                spanNode = document.createElement('span');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + buildModules)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(buildModules));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                spanNode.appendChild(aNode);

                if (buildModulesSize !== null &&
                        buildModulesSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(buildModulesSize));
                }

                html.replaceContent(
                    document.getElementById('build-modules'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('build-modules'), html.nonavail());
            }

            if (modulesDirectory !== null) {
                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + modulesDirectory + '/')
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(modulesDirectory));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('modules-directory'), aNode);
            } else {
                html.replaceContent(
                    document.getElementById('modules-directory'),
                    html.nonavail());
            }

            if (textOffset !== null) {
                html.replaceContent(
                    document.getElementById('text-offset'),
                    document.createTextNode(textOffset));
            } else {
                html.replaceContent(
                    document.getElementById('text-offset'), html.nonavail());
            }

            if (configFragments !== null) {
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', configFragments);
                tooltipNode.appendChild(
                    document.createTextNode(
                        html.sliceText(configFragments, 40)));

                html.replaceContent(
                    document.getElementById('config-fragments'), tooltipNode);
            } else {
                html.replaceContent(
                    document.getElementById('config-fragments'),
                    html.nonavail());
            }

            if (kernelImage !== null) {
                spanNode = document.createElement('span');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + kernelImage)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(kernelImage));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                spanNode.appendChild(aNode);

                if (kernelImageSize !== null &&
                        kernelImageSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(kernelImageSize));
                }

                html.replaceContent(
                    document.getElementById('kernel-image'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-image'), html.nonavail());
            }

            if (kernelConfig !== null) {
                spanNode = document.createElement('span');
                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + kernelConfig)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(kernelConfig));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                spanNode.appendChild(aNode);

                if (results.kernel_config_size !== null &&
                        results.kernel_config_size !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(
                        _createSizeNode(results.kernel_config_size));
                }

                html.replaceContent(
                    document.getElementById('kernel-config'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-config'), html.nonavail());
            }

            if (results.system_map) {
                spanNode = document.createElement('span');
                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + results.system_map)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(results.system_map));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                spanNode.appendChild(aNode);

                if (results.system_map_size !== null &&
                        results.system_map_size !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(
                        _createSizeNode(results.system_map_size));
                }

                html.replaceContent(
                    document.getElementById('system-map'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('system-map'), html.nonavail());
            }

            if (buildLog) {
                spanNode = document.createElement('span');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + buildLog)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(buildLog));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                spanNode.appendChild(aNode);

                if (results.build_log_size !== null &&
                        results.build_log_size !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(
                        _createSizeNode(results.build_log_size));
                }

                html.replaceContent(
                    document.getElementById('build-log'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('build-log'), html.nonavail());
            }

            if (buildPlatform !== null && buildPlatform.length === 6) {
                html.replaceContent(
                    document.getElementById('platform-system'),
                    document.createTextNode(buildPlatform[0]));
                html.replaceContent(
                    document.getElementById('platform-node'),
                    document.createTextNode(buildPlatform[1]));
                html.replaceContent(
                    document.getElementById('platform-release'),
                    document.createTextNode(buildPlatform[2]));
                html.replaceContent(
                    document.getElementById('platform-full-release'),
                    document.createTextNode(buildPlatform[3]));
                html.replaceContent(
                    document.getElementById('platform-machine'),
                    document.createTextNode(buildPlatform[4]));
                html.replaceContent(
                    document.getElementById('platform-cpu'),
                    document.createTextNode(buildPlatform[5]));
            } else {
                divNode = document.createElement('div');
                divNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
                divNode.appendChild(html.errorDiv('No data available.'));

                html.replaceContent(
                    document.getElementById('build-platform'), divNode);
            }
        }
    }

    function getBuilds() {
        var data,
            deferred;

        if (buildId !== 'None') {
            data = {
                id: buildId,
                nfield: ['dtb_dir_data']
            };
        } else {
            data = {
                job: jobName,
                kernel: kernelName,
                defconfig_full: defconfigFull,
                nfield: ['dtb_dir_data']
            };
        }

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone, getBoots, getBisect);
    }

    if (document.getElementById('file-server') !== null) {
        fileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('job-name') !== null) {
        jobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        kernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        defconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('build-id') !== null) {
        buildId = document.getElementById('build-id').value;
    }

    getBuilds();

    init.hotkeys();
    init.tooltip();
});
