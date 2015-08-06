/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls'
], function($, b, e, i, r, u) {
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

    function calculateRowCount(number) {
        var rowCount = 10;
        if (number > 10 && number <= 25) {
            rowCount = 20;
        } else if (number > 25 && number <= 50) {
            rowCount = 35;
        } else if (number > 50) {
            rowCount = 60;
        }
        return rowCount;
    }

    function getBuildLogsFail() {
        b.removeElement('build-logs-loading');
        b.replaceById(
            'build-logs',
            '<div class="pull-center"><strong>' +
            'Error loading build logs.</strong></div>'
        );
    }

    function getBuildLogsDone(response) {
        var results = response.result,
            resLen = results.length,
            localResult,
            errors,
            warnings,
            mismatches,
            errorsCount,
            warningsCount,
            mismatchesCount,
            idx,
            rows,
            logsContent = '';

        if (resLen === 0) {
            b.removeElement('build-logs-loading');
            b.replaceById(
                'build-logs',
                '<div class="pull-center"><strong>' +
                'No build logs available.</strong></div>'
            );
            b.replaceByClass('logs-loading-content', '0');
        } else {
            localResult = results[0];
            errors = localResult.errors;
            warnings = localResult.warnings;
            mismatches = localResult.mismatches;
            errorsCount = localResult.errors_count;
            warningsCount = localResult.warnings_count;
            mismatchesCount = localResult.mismatches_count;

            b.replaceById('build-errors', errorsCount);
            b.replaceById('build-warnings', warningsCount);
            b.replaceById('build-mismatches', mismatchesCount);

            if (errorsCount > 0) {
                rows = calculateRowCount(warningsCount);
                logsContent +=
                    '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                    '<h5>Errors</h5>';
                logsContent += '<textarea class="build-logs form-control" ' +
                    'readonly="true" cols="105" rows="' + 5 + '">';

                for (idx = 0; idx < errorsCount; idx = idx + 1) {
                    logsContent += errors[idx] + '\n';
                }
                logsContent.trimRight();
                logsContent += '</textarea></div>';
            }

            if (warningsCount > 0) {
                rows = calculateRowCount(warningsCount);
                logsContent +=
                    '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                    '<h5>Warnings</h5>';
                logsContent += '<textarea class="build-logs form-control" ' +
                    'readonly="true" cols="105" rows="' + rows + '">';

                for (idx = 0; idx < warningsCount; idx = idx + 1) {
                    logsContent += warnings[idx] + '\n';
                }
                logsContent.trimRight();
                logsContent += '</textarea></div>';
            }

            if (mismatchesCount > 0) {
                rows = calculateRowCount(warningsCount);
                logsContent +=
                    '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                    '<h5>Mismatched sections</h5>';
                logsContent += '<textarea class="build-logs form-control" ' +
                    'readonly="true" cols="105" rows="' + rows + '">';

                for (idx = 0; idx < mismatchesCount; idx = idx + 1) {
                    logsContent += mismatches[idx] + '\n';
                }
                logsContent.trimRight();
                logsContent += '</textarea></div>';
            }

            b.removeElement('build-logs-loading');
            b.replaceById('build-logs', logsContent);
        }
    }

    function getBuildLogs(response) {
        var results = response.result,
            resLen = results.length,
            deferred,
            data = {};

        if (resLen === 0) {
            b.removeElement('build-logs-loading');
            b.replaceById(
                'build-logs',
                '<div class="pull-center"><strong>' +
                'No data available.</strong></div>'
            );
        } else {
            if (buildId !== 'None') {
                deferred = r.get(
                    '/_ajax/build/' + buildId + '/logs', data);
            } else {
                data.job = jobName;
                data.kernel = kernelName;
                data.defconfig_full = defconfigFull;
                deferred = r.get('/_ajax/build/logs', data);
            }
            $.when(deferred)
                .fail(e.error, getBuildLogsFail)
                .done(getBuildLogsDone);
            }
    }

    function getBuildDone(response) {
        var results = response.result,
            resLen = results.length,
            job,
            kernel,
            arch,
            defconfig,
            lDefconfigFull,
            buildTime,
            buildLog,
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
            statusDisplay = '';

        if (resLen === 0) {
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
            buildTime = results.build_time;
            buildLog = results.build_log;
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

            b.replaceById(
                'build-date',
                '<time>' + createdOn.getCustomISODate() + '</time>');

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

            if (arch !== null) {
                b.replaceById('build-arch', arch);
            } else {
                b.replaceById('build-arch', nonAvail);
            }

            b.replaceById('build-status', statusDisplay);

            if (buildTime !== null) {
                b.replaceById('build-time', buildTime + '&nbsp;sec.');
            } else {
                b.replaceById('build-time', nonAvail);
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
        }
    }

    function getBuildFail() {
        b.replaceByClass('loading-content', nonAvail);
    }

    function getBuild() {
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
            .fail(e.error, getBuildFail)
            .done(getBuildDone, getBuildLogs);
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

        getBuild();
    });
});
