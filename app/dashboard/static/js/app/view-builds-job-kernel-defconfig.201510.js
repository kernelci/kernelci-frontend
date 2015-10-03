/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/show-hide-btns',
    'utils/html',
    'utils/date'
], function($, b, e, init, r, u, bisect, btns, html) {
    'use strict';
    var buildId,
        defconfigFull,
        fileServer,
        jobName,
        kernelName;

    document.getElementById('li-build').setAttribute('class', 'active');

    function bindBisectMoreLessBtns() {
        [].forEach.call(
            document.getElementsByClassName('bisect-pm-btn-less'),
            function(element) {
                element.removeEventListener('click');
                element.addEventListener('click', btns.showLessBisectRowsBtn);
            }
        );

        [].forEach.call(
            document.getElementsByClassName('bisect-pm-btn-more'),
            function(element) {
                element.removeEventListener('click');
                element.addEventListener('click', btns.showMoreBisectRowsBtn);
            }
        );
    }

    function bindBisectButtons() {
        [].forEach.call(
            document.getElementsByClassName('bisect-click-btn'),
            function(element) {
                element.removeEventListener('click');
                element.addEventListener('click', btns.showHideBisect);
            }
        );
    }

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
            elements;

        elements = {
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
            bisectShowHideID: 'bisect-compare-hide-div'
        };

        deferred = r.get(
            '/_ajax/bisect?collection=build&' +
                'compare_to=mainline&build_id=' + build,
            {}
        );

        $.when(deferred)
            .fail(e.error, getBisectToMainlineFail)
            .done(function(data) {
                bisect(data, elements, true);
                bindBisectButtons();
                bindBisectMoreLessBtns();
                btns.triggerMinusBisectBtns(true);
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
        var elements;

        elements = {
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
            bisectShowHideID: 'bisect-hide-div'
        };

        bisect(response, elements, false);
        bindBisectButtons();
        bindBisectMoreLessBtns();
        btns.triggerMinusBisectBtns(false);
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
        html.replaceContent(
            document.getElementById('boot-report'),
            html.errorDiv('Error loading boot reports data.')
        );
    }

    function getBootsDone(response) {
        var columnIndex,
            columns,
            resLen,
            results,
            totalColumns;

        results = response.result;
        resLen = results.length;

        totalColumns = 3;
        columnIndex = 1;

        columns = {
            col1: '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">',
            col2: '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4">' + '<ul class="list-unstyled">',
            col3: '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">'
        };

        if (resLen > 0) {
            results.forEach(function(result, idx) {
                columnIndex = (idx % totalColumns) + 1;

                columns['col' + columnIndex] += '<li>' +
                    '<a href="/boot/' + result.board + '/job/' +
                    jobName + '/kernel/' + kernelName + '/defconfig/' +
                    defconfigFull + '/lab/' + result.lab_name + '?_id=' +
                    result._id.$oid + '">' + result.board +
                    '&nbsp;<i class="fa fa-search"></i></a></li>';
            });

            columns.col1 += '</ul></div>';
            columns.col2 += '</ul></div>';
            columns.col3 += '</ul></div>';

            b.replaceById(
                'boot-report', columns.col1 + columns.col2 + columns.col3);
            b.addContent(
                'boot-report',
                '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                '<span rel="tooltip" data-toggle="tooltip" title="' +
                'More details on the boot reports for&nbsp;' + jobName +
                '&nbsp;&dash;&nbsp;' + kernelName + '&nbsp;&dash;&nbsp;' +
                defconfigFull + '">' +
                '<a href="/boot/all/job/' + jobName + '/kernel/' + kernelName +
                '/defconfig/' + defconfigFull + '">More details</a></span>' +
                '</div>'
            );
        } else {
            html.replaceContent(
                document.getElementById('boot-report'),
                html.errorDiv('No boot reporst available.'));
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
                    field: ['_id', 'board', 'lab_name']
                };
            } else {
                data = {
                    defconfig: results.defconfig,
                    defconfig_full: results.defconfig_full,
                    field: ['_id', 'board', 'lab_name'],
                    job: results.job,
                    kernel: results.kernel
                };
            }

            deferred = r.get('/_ajax/boot', data);
            $.when(deferred)
                .fail(e.error, getBootsFail)
                .done(getBootsDone);
        } else {
            html.replaceContent(
                document.getElementById('boot-report'),
                html.errorDiv('No boot reporst found.'));
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
        html.replaceContent(
            document.getElementById('boot-report'),
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
            configFragments,
            createdOn,
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
            lFileServer,
            metadata,
            modulesDirectory,
            pathURI,
            resLen,
            results,
            sizeNode,
            spanNode,
            textOffset,
            timeNode,
            tooltipNode,
            translatedURI;

        results = response.result;
        resLen = results.length;

        if (resLen === 0) {
            html.removeElement('bisect-div');
            html.replaceContent(
                document.getElementById('boot-report'),
                html.errorDiv('No data available.'));
            html.replaceByClassTxt('loading-content', '?');
        } else {
            lFileServer = fileServer;

            // We only have 1 result!
            results = response.result[0];
            job = results.job;
            kernel = results.kernel;
            gitURL = results.git_url;
            gitCommit = results.git_commit;
            createdOn = new Date(results.created_on.$date);
            arch = results.arch;
            defconfig = results.defconfig;
            lDefconfigFull = results.defconfig_full;
            metadata = results.metadata;
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

            if (fileServerURL !== null && fileServerURL !== undefined) {
                lFileServer = fileServerURL;
            }

            fileServerData = [
                job, kernel, arch + '-' + lDefconfigFull
            ];
            translatedURI = u.translateServerURL(
                fileServerURL,
                lFileServer, fileServerResource, fileServerData);
            fileServerURI = translatedURI[0];
            pathURI = translatedURI[1];

            gitURLs = u.translateCommit(gitURL, gitCommit);

            detailNode = document.getElementById('details');
            detailNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = html.small();
            defconfigNode.appendChild(
                document.createTextNode('(' + defconfig + ')'));

            detailNode.appendChild(defconfigNode);

            spanNode = html.span();

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + job);

            aNode = html.a();
            aNode.setAttribute('href', '/job/' + job + '/');
            aNode.appendChild(document.createTextNode(job));

            tooltipNode.appendChild(aNode);
            spanNode.appendChild(tooltipNode);

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for tree&nbsp;' + job);

            aNode = html.a();
            aNode.setAttribute('href', '/boot/all/job/' + job + '/');
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(document.getElementById('tree'), spanNode);

            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(results.git_branch));

            spanNode = html.span();

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Build details for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = html.a();
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

            aNode = html.a();
            aNode.setAttribute(
                'href', '/boot/all/job/' + job + '/kernel/' + kernel + '/');
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('git-describe'), spanNode);

            if (gitURLs[0] !== null) {
                aNode = html.a();
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
                aNode = html.a();
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

            if (metadata.hasOwnProperty('cross_compile')) {
                html.replaceContent(
                    document.getElementById('build-cross-compile'),
                    document.createTextNode(metadata.cross_compile));
            } else {
                html.replaceContent(
                    document.getElementById('build-cross-compile'),
                    html.nonavail());
            }

            if (metadata.hasOwnProperty('compiler_version')) {
                html.replaceContent(
                    document.getElementById('build-compiler'),
                    document.createTextNode(metadata.compiler_version));
            } else {
                html.replaceContent(
                    document.getElementById('build-compiler'),
                    html.nonavail());
            }

            if (arch !== null) {
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

            spanNode = html.span();

            spanNode.appendChild(document.createTextNode(lDefconfigFull));

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + jobName +
                    '&nbsp;&dash;&nbsp;' + kernelName +
                    '&nbsp;&dash;&nbsp;' + lDefconfigFull
                );

            aNode = html.a();
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

            timeNode = html.time();
            timeNode.setAttribute('datetime', createdOn.toISOString());
            timeNode.appendChild(
                document.createTextNode(createdOn.toCustomISODate()));

            html.replaceContent(
                document.getElementById('build-date'), timeNode);

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
                aNode = html.a();
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
                spanNode = html.span();

                aNode = html.a();
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
                    sizeNode = html.small();
                    sizeNode.appendChild(
                        document.createTextNode(
                            '(' + b.bytesToHuman(buildModulesSize) + ')')
                    );

                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(sizeNode);
                }

                html.replaceContent(
                    document.getElementById('build-modules'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('build-modules'), html.nonavail());
            }

            if (modulesDirectory !== null) {
                aNode = html.a();
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
                spanNode = html.span();

                aNode = html.a();
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
                    sizeNode = html.small();
                    sizeNode.appendChild(
                        document.createTextNode(
                            '(' + b.bytesToHuman(kernelImageSize) + ')')
                    );

                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(sizeNode);
                }

                html.replaceContent(
                    document.getElementById('kernel-image'), spanNode);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-image'), html.nonavail());
            }

            if (kernelConfig !== null) {
                aNode = html.a();
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + kernelConfig)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(kernelConfig));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('kernel-config'), aNode);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-config'), html.nonavail());
            }

            if (buildLog !== null) {
                aNode = html.a();
                aNode.setAttribute(
                    'href',
                    fileServerURI
                        .path(pathURI + '/' + buildLog)
                        .normalizePath().href()
                );
                aNode.appendChild(document.createTextNode(buildLog));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('build-log'), aNode);
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
                divNode = html.div();
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
             id: buildId
            };
        } else {
            data = {
                job: jobName,
                kernel: kernelName,
                defconfig_full: defconfigFull
            };
        }

        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone, getBoots, getBisect);
    }

    init();

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
});
