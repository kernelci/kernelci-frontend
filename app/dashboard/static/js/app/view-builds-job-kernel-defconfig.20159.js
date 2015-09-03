/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/show-hide-btns'
], function($, b, e, i, r, u, bisect, btns) {
    'use strict';
    var fileServer,
        jobName,
        defconfigFull,
        kernelName,
        buildId,
        nonAvail,
        failLabel,
        successLabel,
        unknownLabel;

    nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i></span>';
    successLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Build completed"><span class="label ' +
        'label-success"><i class="fa fa-check"></i></span></span>';
    unknownLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Unknown status"><span class="label ' +
        'label-warning"><i class="fa fa-question"></i></span></span>';
    failLabel = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Build failed"><span class="label label-danger">' +
        '<i class="fa fa-exclamation-triangle"></i></span></span>';

    function bindBisectMoreLessBtns() {
        $('.bisect-pm-btn-less').each(function() {
            $(this).off().on('click', btns.showLessBisectRowsBtn);
        });
        $('.bisect-pm-btn-more').each(function() {
            $(this).off().on('click', btns.showMoreBisectRowsBtn);
        });
    }

    function bindBisectButtons() {
        $('.bisect-click-btn').each(function() {
            $(this).off().on('click', btns.showHideBisect);
        });
    }

    function getBisectFail() {
        b.removeElement('bisect-loading-div');
        b.replaceById(
            'bisect-content',
            '<div class="pull-center"><strong>' +
            'Error loading bisect data from server.</strong></div>');
        b.removeClass('bisect-content', 'hidden');
    }

    function getBisectToMainlineFail() {
        b.removeElement('bisect-compare-loading-div');
        b.replaceById(
            'bisect-compare-content',
            '<div class="pull-center"><strong>' +
            'Error loading bisect data from server.</strong></div>');
        b.removeClass('bisect-compare-content', 'hidden');
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
        var result = response.result,
            resLen = result.length,
            bisectData = null,
            lBuildId = null;

        if (resLen > 0) {
            bisectData = result[0];
            lBuildId = bisectData.build_id.$oid;
            if (bisectData.job !== 'mainline') {
                b.removeClass('bisect-compare-div', 'hidden');
                getBisectToMainline(bisectData, lBuildId);
            } else {
                b.removeElement('bisect-compare-div');
            }
        } else {
            b.removeElement('bisect-compare-div');
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
        var results = response.result,
            resLen = results.length,
            deferred;

        if (resLen > 0) {
            results = response.result[0];
            if (results.status === 'FAIL') {
                b.removeClass('bisect', 'hidden');
                b.removeClass('bisect-div', 'hidden');

                deferred = r.get(
                    '/_ajax/bisect?collection=build&build_id=' +
                    results._id.$oid,
                    {}
                );

                $.when(deferred)
                    .fail(e.error, getBisectFail)
                    .done(getBisectDone, getBisectCompareTo);
            } else {
                b.removeElement('bisect-div');
            }
        } else {
            b.removeElement('bisect-div');
        }
    }

    function getBootsFail() {
        b.replaceById(
            'boot-report',
            '<div class="pull-center">' +
            '<strong>Error loading boot reports data.</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            colData,
            idx = 0,
            totalColumns = 3,
            columnIndex = 1,
            columns;

        columns = {
            'col1': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">',
            'col2': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4">' + '<ul class="list-unstyled">',
            'col3': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">'
        };

        if (resLen > 0) {
            for (idx; idx < resLen; idx = idx + 1) {
                columnIndex = (idx % totalColumns) + 1;
                colData = results[idx];

                columns['col' + columnIndex] += '<li>' +
                    '<a href="/boot/' + colData.board + '/job/' +
                    jobName + '/kernel/' + kernelName + '/defconfig/' +
                    defconfigFull + '/lab/' + colData.lab_name + '?_id=' +
                    colData._id.$oid + '">' + colData.board +
                    '&nbsp;<i class="fa fa-search"></i></a></li>';
            }

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
            b.replaceById(
                'boot-report',
                '<div class="pull-center">' +
                '<strong>No boot reports available.</strong></div>'
            );
        }
    }

    function getBoots(response) {
        var results = response.result,
            resLen = results.length,
            deferred,
            data = {
                'field': [
                    '_id', 'board', 'lab_name'
                ]
            };

        if (resLen > 0) {
            results = response.result[0];
            if (results._id !== null) {
                data.build_id = results._id.$oid;
            } else {
                data.defconfig = results.defconfig;
                data.defconfig_full = results.defconfig_full;
                data.job = results.job;
                data.kernel = results.kernel;
            }
            deferred = r.get('/_ajax/boot', data);
            $.when(deferred)
                .fail(e.error, getBootsFail)
                .done(getBootsDone);
        } else {
            b.replaceById(
                'boot-report',
                '<div class="pull-center">' +
                '<strong>No boot reports available.</strong></div>'
            );
        }
    }

    function getBuildsFail() {
        b.removeElement('bisect-div');
        b.replaceById(
            'boot-report',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
        b.replaceByClass(
            'loading-content',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>'
        );
    }

    function getBuildsDone(response) {
        var results = response.result,
            resLen = results.length,
            job,
            kernel,
            arch,
            defconfig,
            lDefconfigFull,
            metadata,
            buildTime,
            dtb,
            buildModules,
            modulesDirectory,
            textOffset,
            configFragments,
            kernelImage,
            kernelConfig,
            buildLog,
            buildPlatform,
            fileServerURL,
            fileServerResource,
            fileServerURI,
            fileServerData,
            translatedURI,
            lFileServer = fileServer,
            pathURI,
            gitURL,
            gitURLs,
            gitCommit,
            createdOn,
            buildModulesLink,
            buildModulesSize,
            kernelImageLink,
            kernelImageSize,
            statusDisplay = '';

        if (resLen === 0) {
            b.removeElement('bisect-div');
            b.replaceById(
                'boot-report',
                '<div class="pull-center"><strong>' +
                'No data available.</strong></div>'
            );
            b.replaceByClass('loading-content', '?');
        } else {
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

            b.addContent('details', '&nbsp<small>(' + defconfig + ')</small>');

            b.replaceById(
                'tree',
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Details for tree ' + job + '">' +
                '<a href="/job/' + job + '/">' + job + '</a>' +
                '</span>&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Boot reports details for ' + job + '">' +
                '<a href="/boot/all/job/' + job + '/">' +
                '<i class="fa fa-hdd-o"></i>' +
                '</a></span>'
            );
            b.replaceById('git-branch', results.git_branch);
            b.replaceById(
                'git-describe',
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build ' + job + '&nbsp;&dash;&nbsp;' +
                kernel + '">' +
                '<a href="/build/' + job + '/kernel/' +
                kernel + '/">' + kernel + '</a>' +
                '</span>&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="All boot reports for ' + job + '&nbsp;&dash;&nbsp;' +
                kernel + '">' +
                '<a href="/boot/all/job/' + job + '/kernel/' + kernel + '/">' +
                '<i class="fa fa-hdd-o"></i></a></span>'
            );

            if (gitURLs[0] !== null) {
                b.replaceById(
                    'git-url',
                    '<a href="' + gitURLs[0] + '">' + gitURL +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                if (gitURL !== null) {
                    b.replaceById('git-url', gitURL);
                } else {
                    b.replaceById('git-url', nonAvail);
                }
            }

            if (gitURLs[1] !== null) {
                b.replaceById(
                    'git-commit',
                    '<a href="' + gitURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                if (gitCommit !== null) {
                    b.replaceById('git-commit', gitCommit);
                } else {
                    b.replaceById('git-commit', nonAvail);
                }
            }

            if (metadata.hasOwnProperty('cross_compile')) {
                b.replaceById(
                    'build-cross-compile', metadata.cross_compile);
            } else {
                b.replaceById('build-cross-compile', nonAvail);
            }

            if (metadata.hasOwnProperty('compiler_version')) {
                b.replaceById(
                    'build-compiler', metadata.compiler_version);
            } else {
                b.replaceById('build-compiler', nonAvail);
            }

            if (arch !== null) {
                b.replaceById('build-arch', arch);
            } else {
                b.replaceById('build-arch', nonAvail);
            }

            b.replaceById('build-errors', results.errors);
            b.replaceById('build-warnings', results.warnings);

            if (buildTime !== null) {
                b.replaceById('build-time', buildTime + '&nbsp;sec.');
            } else {
                b.replaceById('build-time', nonAvail);
            }

            b.replaceById(
                'build-defconfig',
                lDefconfigFull +
                '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Boot reports for&nbsp;' + jobName +
                '&nbsp;&dash;&nbsp;' + kernelName +
                '&nbsp;&dash;&nbsp;' + lDefconfigFull + '">' +
                '<a href="/boot/all/job/' + jobName + '/kernel/' +
                kernelName + '/defconfig/' + lDefconfigFull + '">' +
                '<i class="fa fa-hdd-o"></i></a></span>'
            );

            b.replaceById('build-date', createdOn.getCustomISODate());

            switch (results.status) {
                case 'PASS':
                    statusDisplay = successLabel;
                    break;
                case 'FAIL':
                    statusDisplay = failLabel;
                    break;
                default:
                    statusDisplay = unknownLabel;
                    break;
            }

            b.replaceById('build-status', statusDisplay);

            if (dtb !== null) {
                b.replaceById(
                    'dtb-dir',
                    '<a href="' +
                    fileServerURI.path(pathURI + '/' + dtb + '/')
                        .normalizePath().href() +
                    '">' + dtb +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                b.replaceById('dtb-dir', nonAvail);
            }

            if (buildModules !== null) {
                buildModulesLink = '<a href="' +
                    fileServerURI.path(pathURI + '/' + buildModules)
                        .normalizePath().href() + '">' + buildModules +
                    '&nbsp;<i class="fa fa-external-link"></i></a>';

                if (buildModulesSize !== null &&
                        buildModulesSize !== undefined) {
                    buildModulesLink += '&nbsp;<small>(' +
                        b.bytesToHuman(buildModulesSize, 2) + ')</small>';
                }

                b.replaceById('build-modules', buildModulesLink);
            } else {
                b.replaceById('build-modules', nonAvail);
            }

            if (modulesDirectory !== null) {
                b.replaceById(
                    'modules-directory',
                    '<a href="' +
                    fileServerURI.path(pathURI + '/' + modulesDirectory + '/')
                        .normalizePath().href() +
                    '">' + modulesDirectory +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                b.replaceById('modules-directory', nonAvail);
            }

            if (textOffset !== null) {
                b.replaceById('text-offset', textOffset);
            } else {
                b.replaceById('text-offset', nonAvail);
            }

            if (configFragments !== null) {
                if (configFragments.length > 40) {
                    configFragments = '<span rel="tooltip" ' +
                        'data-toggle="tooltip" ' +
                        'title="' + configFragments + '">' +
                        configFragments.slice(0, 39) + '&hellip;</span>';
                }
                b.replaceById('config-fragments', configFragments);
            } else {
                b.replaceById('config-fragments', nonAvail);
            }

            if (kernelImage !== null) {
                kernelImageLink = '<a href="' +
                    fileServerURI.path(pathURI + '/' + kernelImage)
                        .normalizePath().href() + '">' + kernelImage +
                    '&nbsp;<i class="fa fa-external-link"></i></a>';

                if (kernelImageSize !== null &&
                        kernelImageSize !== undefined) {
                    kernelImageLink += '&nbsp;<small>(' +
                        b.bytesToHuman(kernelImageSize, 2) + ')</small>';
                }

                b.replaceById('kernel-image', kernelImageLink);
            } else {
                b.replaceById('kernel-image', nonAvail);
            }

            if (kernelConfig !== null) {
                b.replaceById('kernel-config',
                    '<a href="' +
                    fileServerURI.path(pathURI + '/' + kernelConfig)
                        .normalizePath().href() +
                    '">' + kernelConfig +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                b.replaceById('kernel-config', nonAvail);
            }

            if (buildLog !== null) {
                b.replaceById('build-log',
                    '<a href="' +
                    fileServerURI.path(pathURI + '/' + buildLog)
                        .normalizePath().href() +
                    '">' + buildLog +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                b.replaceById('build-log', nonAvail);
            }

            if (buildPlatform !== null && buildPlatform.length === 6) {
                b.replaceById('platform-system', buildPlatform[0]);
                b.replaceById('platform-node', buildPlatform[1]);
                b.replaceById('platform-release', buildPlatform[2]);
                b.replaceById('platform-full-release', buildPlatform[3]);
                b.replaceById('platform-machine', buildPlatform[4]);
                b.replaceById('platform-cpu', buildPlatform[5]);
            } else {
                b.replaceById('build-platform',
                    '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                    '<div class="pull-center">' +
                    '<strong>No data available.</strong>' +
                    '</div></div>'
                );
            }
        }
    }

    function getBuilds() {
        var deferred,
            data = {};
        if (buildId !== 'None') {
            data.id = buildId;
        } else {
            data.job = jobName;
            data.kernel = kernelName;
            data.defconfig_full = defconfigFull;
        }
        deferred = r.get('/_ajax/build', data);
        $.when(deferred)
            .fail(e.error, getBuildsFail)
            .done(getBuildsDone, getBoots, getBisect);
    }

    $(document).ready(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

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
});
