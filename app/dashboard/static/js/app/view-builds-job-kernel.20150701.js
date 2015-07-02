/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls',
    'utils/web-storage',
    'utils/show-hide-btns',
    'charts/passpie'
], function($, b, e, i, r, u, ws, btns, chart) {
    'use strict';
    var jobName,
        kernelName,
        tRules,
        nonAvail,
        failLabel,
        successLabel,
        unknownLabel,
        fileServer;

    nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i></span>';
    failLabel = '<span class="pull-right label label-danger">' +
        '<li class="fa fa-exclamation-triangle"></li></span>';
    successLabel = '<span class="pull-right label label-success">' +
        '<li class="fa fa-check"></li></span>';
    unknownLabel = '<span class="pull-right label label-warning">' +
        '<li class="fa fa-question"></li></span>';

    function bindDetailButtons() {
        $('.click-btn').each(function() {
            $(this).on('click', btns.showHideElements);
        });
        $('.warn-err-btn').each(function() {
            $(this).on('click', btns.showHideWarnErr);
        });
    }

    function getBuildsFail() {
        b.replaceById(
            'accordion-container',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
    }

    function getBuildsDone(response) {
        var results = response.result,
            resLen = results.length,
            idx = 0,
            hasFailed = false,
            hasSuccess = false,
            hasUnknown = false,
            cls,
            label,
            localResult,
            defconfigFull,
            job,
            kernel,
            arch,
            lFileServer = fileServer,
            fileServerData,
            translatedURI,
            fileServerURI,
            pathURI,
            fileServerURL,
            fileServerResource,
            errorsCount,
            warningsCount,
            metadata,
            warningString,
            errorString,
            warnErrString,
            warnErrCount,
            buildLogURI,
            warnErrTooltip,
            warnErrLabel,
            panel = '',
            archLabel;

        if (resLen === 0) {
            b.replaceById(
                'accordion-container',
                '<div class="pull-center"><strong>' +
                'No data avaialable.</strong></div>'
            );
        } else {
            for (idx; idx < resLen; idx = idx + 1) {
                localResult = results[idx];

                defconfigFull = localResult.defconfig_full;
                job = localResult.job;
                kernel = localResult.kernel;
                arch = localResult.arch;
                fileServerURL = localResult.file_server_url;
                fileServerResource = localResult.file_server_resource;
                errorsCount = localResult.errors;
                warningsCount = localResult.warnings;
                metadata = localResult.metadata;

                if (fileServerURL !== null && fileServerURL !== undefined) {
                    lFileServer = fileServerURL;
                }

                fileServerData = [
                    job, kernel, arch + '-' + defconfigFull
                ];
                translatedURI = u.translateServerURL(
                    fileServerURL,
                    lFileServer, fileServerResource, fileServerData);
                fileServerURI = translatedURI[0];
                pathURI = translatedURI[1];

                switch (localResult.status) {
                    case 'FAIL':
                        hasFailed = true;
                        label = failLabel;
                        cls = 'df-failed';
                        break;
                    case 'PASS':
                        hasSuccess = true;
                        label = successLabel;
                        cls = 'df-success';
                        break;
                    default:
                        hasUnknown = true;
                        label = unknownLabel;
                        cls = 'df-unknown';
                        break;
                }

                if (errorsCount === undefined) {
                    errorsCount = 0;
                }
                if (warningsCount === undefined) {
                    warningsCount = 0;
                }

                if (warningsCount > 0 && errorsCount > 0) {
                    cls += ' df-w-e';
                } else if (warningsCount > 0 && errorsCount === 0) {
                    cls += ' df-w';
                } else if (warningsCount === 0 && errorsCount > 0) {
                    cls += ' df-e';
                } else if (warningsCount === 0 && errorsCount === 0) {
                    cls += ' df-no-w-no-e';
                }

                if (warningsCount === 1) {
                    warningString = warningsCount + '&nbsp;warning';
                } else {
                    warningString = warningsCount + '&nbsp;warnings';
                }

                if (errorsCount === 1) {
                    errorString = errorsCount + '&nbsp;error';
                } else {
                    errorString = errorsCount + '&nbsp;errors';
                }

                warnErrString = 'Build warnings and errors';
                warnErrCount = warningString +
                    '&nbsp;&mdash;&nbsp;' + errorString;

                if (localResult.build_log !== null) {
                    buildLogURI = fileServerURI.path(pathURI +
                        '/' + localResult.build_log).normalizePath().href();
                    warnErrTooltip = warnErrString + '&nbsp;&mdash;&nbsp;' +
                        'Click to view the build log';
                    warnErrLabel = '<small>' +
                        '<span class="build-warnings">' +
                        '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="' + warnErrTooltip + '">' +
                        '<a href="' + buildLogURI + '">' +
                        warnErrCount + '</a></span><span></small>';
                } else {
                    warnErrLabel = '<small>' +
                        '<span class="build-warnings">' +
                        '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="' + warnErrString + '">' + warnErrCount +
                        '</span><span></small>';
                }

                if (arch !== null) {
                    archLabel = '&nbsp;&dash;&nbsp;' +
                        '<span class="arch-label">' + arch + '</span>';
                }

                panel += '<div class="panel panel-default ' + cls + '">' +
                    '<div class="panel-heading" data-toggle="collapse" ' +
                    'id="panel-defconf' + idx + '"' +
                    'data-parent="accordion" data-target="#collapse-defconf' +
                    idx + '">' +
                    '<h4 class="panel-title">' +
                    '<a data-toggle="collapse" data-parent="#accordion" ' +
                    'href="#collapse-defconf' + idx + '">' + defconfigFull +
                    '</a>' + archLabel + label +
                     warnErrLabel + '</h4></div>' +
                     '<div id="collapse-defconf' + idx +
                     '" class="panel-collapse collapse">' +
                    '<div class="panel-body">';

                panel += '<div class="row">';
                panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
                panel += '<dl class="dl-horizontal">';

                if (localResult.dtb_dir !== null) {
                    panel += '<dt>Dtb directory</dt>' +
                        '<dd><a href="' +
                        fileServerURI.path(
                            pathURI + '/' + localResult.dtb_dir + '/')
                            .normalizePath()
                            .href() + '">' + localResult.dtb_dir +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></dd>';
                }

                if (localResult.modules !== null) {
                    panel += '<dt>Modules</dt>' +
                        '<dd><a href="' +
                        fileServerURI.path(pathURI + '/' + localResult.moduels)
                            .normalizePath().href() +
                        '">' +
                        localResult.modules +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></dd>';
                }

                if (localResult.text_offset !== null) {
                    panel += '<dt>Text offset</dt>' +
                        '<dd>' + localResult.text_offset + '</dd>';
                }

                if (localResult.kernel_image !== null) {
                    panel += '<dt>Kernel image</dt>' +
                        '<dd><a href="' +
                        fileServerURI.path(
                                pathURI + '/' + localResult.kernel_image)
                            .normalizePath().href() +
                        '">' + localResult.kernel_image +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></dd>';
                }

                if (localResult.kernel_config !== null) {
                    panel += '<dt>Kernel config</dt>' +
                        '<dd><a href="' +
                        fileServerURI.path(
                                pathURI + '/' + localResult.kernel_config)
                            .normalizePath().href() +
                        '">' + localResult.kernel_config +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></dd>';
                }

                if (localResult.build_log !== null) {
                    panel += '<dt>Build log</dt>' +
                        '<dd><a href="' + buildLogURI + '">' +
                        localResult.build_log +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></dd>';
                }

                panel += '</dl></div>';

                panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
                panel += '<dl class="dl-horizontal">';

                panel += '<dt>Build errors</dt>';
                panel += '<dd>' + errorsCount + '</dd>';

                panel += '<dt>Build warnings</dt>';
                panel += '<dd>' + warningsCount + '</dd>';

                if (localResult.build_time !== null) {
                    panel += '<dt>Build time</dt><dd>' +
                        localResult.build_time + '&nbsp;sec.</dd>';
                }

                panel += '</dl></div>';

                if (metadata !== undefined && metadata !== null) {
                    panel += '<div class="col-xs-12 col-sm-12 ' +
                        'col-md-12 col-lg-12">';
                    panel += '<dl class="dl-horizontal">';
                    if (metadata.hasOwnProperty('cross_compile')) {
                        panel += '<dt>Cross-compile</dt>';
                        panel += '<dd>' + metadata.cross_compile + '</dd>';
                        panel += '</dt>';
                    }
                    if (metadata.hasOwnProperty('compiler_version')) {
                        panel += '<dt>Compiler</dt>';
                        panel += '<dd>' + metadata.compiler_version + '</dd>';
                        panel += '</dt>';
                    }
                    panel += '</dl></div>';
                }

                panel += '<div class="col-xs-12 col-sm-12 ' +
                    'col-md-12 col-lg-12">';
                panel += '<div class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for build with defconfig&nbsp;' +
                    defconfigFull + '">' + '<a href="/build/' + job +
                    '/kernel/' + kernel + '/defconfig/' + defconfigFull + '/' +
                    '?_id=' + localResult._id.$oid +
                    '">More info&nbsp;<i class="fa fa-search"></i>' +
                    '</a></span>';
                panel += '</div></div>';

                panel += '</div>';
                panel += '</div></div></div>\n';
            }

            document
                .getElementById('all-btn').removeAttribute('disabled');
            document
                .getElementById('warn-err-btn').removeAttribute('disabled');
            if (hasFailed) {
                document
                    .getElementById('fail-btn').removeAttribute('disabled');
            }
            if (hasSuccess) {
                document
                    .getElementById('success-btn').removeAttribute('disabled');
            }
            if (hasUnknown) {
                document
                    .getElementById('unknown-btn').removeAttribute('disabled');
            }

            b.replaceById('accordion', panel);
            // Bind buttons to the correct function.
            bindDetailButtons();

            if (!ws.load('build-' + jobName + '-' + kernelName)) {
                if (hasFailed) {
                    // If there is no saved session, show only the failed ones.
                    $('.df-failed').show();
                    $('.df-success').hide();
                    $('.df-unknown').hide();
                    $('#fail-btn')
                        .addClass('active')
                        .siblings()
                            .removeClass('active');
                } else {
                    $('#all-btn').addClass('active');
                }
            }
        }
    }

    function getBuildsDoneChart(response) {
        chart.buildpie('build-chart', response);
    }

    function getBuilds(response) {
        var results = response.result,
            resLen = results.length,
            deferred,
            data;

        if (resLen === 0) {
            b.replaceById(
                'accordion-container',
                '<div class="pull-center"><strong>' +
                'No data avaialable.</strong></div>'
            );
        } else {
            data = {
                'job_id': results[0]._id.$oid,
                'job': jobName,
                'kernel': kernelName,
                'sort': ['defconfig_full', 'arch'],
                'sort_order': 1
            };
            deferred = r.get('/_ajax/defconf', data);
            $.when(deferred)
                .fail(e.error, getBuildsFail)
                .done(getBuildsDone, getBuildsDoneChart);
        }
    }

    function getJobFail() {
        b.replaceById(
            'accordion-container',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
        b.replaceByClass('loading-content', '&infin;');
    }

    function getJobDone(response) {
        var results = response.result,
            resLen = results.length,
            localResult,
            gitCommit,
            gitURL,
            tURLs;

        if (resLen === 0) {
            b.replaceByClass('loading-content', '?');
        } else {
            localResult = results[0];
            gitURL = localResult.git_url;
            gitCommit = localResult.git_commit;
            tURLs = u.translateCommit(gitURL, gitCommit, tRules);

            b.replaceById(
                'tree',
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Details for tree ' + jobName + '">' +
                '<a href="/job/' + jobName + '/">' + jobName + '</a>' +
                '</span>&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Boot reports details for ' + jobName + '">' +
                '<a href="/boot/all/job/' + jobName + '/">' +
                '<i class="fa fa-hdd-o"></i>' +
                '</a></span>'
            );
            b.replaceById('git-branch', localResult.git_branch);
            b.replaceById(
                'git-describe',
                kernelName +
                '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="All boot reports for ' +
                jobName + '&nbsp;&dash;&nbsp;' + kernelName + '">' +
                '<a href="/boot/all/job/' + jobName +
                '/kernel/' + kernelName + '/">' +
                '<i class="fa fa-hdd-o"></i></a></span>'
            );

            if (tURLs[0] !== null) {
                b.replaceById(
                    'git-url',
                    '<a href="' + tURLs[0] + '">' + gitURL +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                if (gitURL !== null) {
                    b.replaceById('git-url', gitURL);
                } else {
                    b.replaceById('git-url', nonAvail);
                }
            }

            if (tURLs[1] !== null) {
                b.replaceById(
                    'git-commit',
                    '<a href="' + tURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a>'
                );
            } else {
                if (gitCommit !== null) {
                    b.replaceById('git-commit', gitCommit);
                } else {
                    b.replaceById('git-commit', nonAvail);
                }
            }
        }
    }

    function getJob() {
        var deferred,
            data;
        data = {
            'job': jobName,
            'kernel': kernelName
        };
        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobFail)
            .done(getJobDone, getBuilds);
    }

    function registerEvents() {
        window.addEventListener('beforeunload', function() {
            var session,
                panelState = {},
                pageState;

            session = new ws.Session('build-' + jobName + '-' + kernelName);

            $('[id^="panel-defconf"]').each(function(id) {
                panelState['#panel-defconf' + id] = {
                    'type': 'class',
                    'name': 'class',
                    'value': $('#panel-defconf' + id).attr('class')
                };
            });

            $('[id^="collapse-defconf"]').each(function(id) {
                panelState['#collapse-defconf' + id] = {
                    'type': 'class',
                    'name': 'class',
                    'value': $('#collapse-defconf' + id).attr('class')
                };
            });

            pageState = {
                '.df-success': {
                    'type': 'attr',
                    'name': 'style',
                    'value': b.getAttrBySelector('.df-success', 'style')
                },
                '.df-failed': {
                    'type': 'attr',
                    'name': 'style',
                    'value': b.getAttrBySelector('.df-failed', 'style')
                },
                '.df-unknown': {
                    'type': 'attr',
                    'name': 'style',
                    'value:': b.getAttrBySelector('.df-unknown', 'style')
                },
                '#all-btn': {
                    'type': 'class',
                    'name': 'class',
                    'value:': b.getAttrById('all-btn', 'class')
                },
                '#success-btn': {
                    'type': 'class',
                    'name': 'class',
                    'value:': b.getAttrById('success-btn', 'class')
                },
                '#fail-btn': {
                    'type': 'class',
                    'name': 'class',
                    'value:': b.getAttrById('fail-btn', 'class')
                },
                '#unknown-btn': {
                    'type': 'class',
                    'name': 'class',
                    'value:': b.getAttrById('unknown-btn', 'class')
                }
            };

            session.objects = b.collectObjects(panelState, pageState);
            ws.save(session);
        });
    }

    $(document).ready(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        $('.btn-group > .btn').click(function() {
            $(this).addClass('active').siblings().removeClass('active');
        });

        if (document.getElementById('file-server') !== null) {
            fileServer = document.getElementById('file-server').value;
        }
        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }
        if (document.getElementById('kernel-name') !== null) {
            kernelName = document.getElementById('kernel-name').value;
        }
        if (document.getElementById('url-translation') !== null) {
            tRules = document.getElementById('url-translation').value;
        }

        getJob();
        registerEvents();
    });
});
