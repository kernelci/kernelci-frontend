/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/html'
], function($, init, format, e, r, urls, html) {
    'use strict';
    var gBuildId,
        gDefconfigFull,
        gFileServer,
        gJobName,
        gKernelName;

    document.getElementById('li-build').setAttribute('class', 'active');

    function getBuildLogsFail() {
        html.removeElement(document.getElementById('build-logs-loading'));
        html.replaceContent(
            document.getElementById('build-logs'),
            html.errorDiv('Error loading build logs'));
    }

    function getBuildLogsDone(response) {
        var divNode,
            errorsCount,
            hNode,
            localResult,
            logsNode,
            mismatchesCount,
            results,
            textArea,
            warningsCount;

        /**
         * Create the div and textarea to contain the log strings.
        **/
        function _parseLogStrings(title, strings) {
            divNode = document.createElement('div');
            divNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

            hNode = document.createElement('h5');
            hNode.appendChild(document.createTextNode(title));

            divNode.appendChild(hNode);

            textArea = document.createElement('textarea');
            textArea.className = 'build-logs form-control';
            textArea.setAttribute('readonly', true);
            textArea.setAttribute('cols', 100);
            textArea.setAttribute('rows', 15);

            divNode.appendChild(textArea);
            logsNode.appendChild(divNode);

            strings.forEach(function(value) {
                textArea.appendChild(
                    document.createTextNode(value.trimRight()));
                textArea.appendChild(document.createTextNode('\n'));
            });
        }

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('build-logs-loading'));
            html.replaceContent(
                document.getElementById('build-logs'),
                html.errorDiv('No build logs available'));
            html.replaceByClassTxt('logs-loading-content', '0');
        } else {
            logsNode = document.getElementById('build-logs');

            localResult = results[0];
            errorsCount = parseInt(localResult.errors_count, 10);
            warningsCount = parseInt(localResult.warnings_count, 10);
            mismatchesCount = parseInt(localResult.mismatches_count, 10);

            html.replaceContent(
                document.getElementById('build-errors'),
                document.createTextNode(errorsCount));

            html.replaceContent(
                document.getElementById('build-warnings'),
                document.createTextNode(warningsCount));

            html.replaceContent(
                document.getElementById('build-mismatches'),
                document.createTextNode(mismatchesCount));

            if (errorsCount > 0) {
                _parseLogStrings('Errors', localResult.errors);
            }

            if (warningsCount > 0) {
                _parseLogStrings('Warnings', localResult.warnings);
            }

            if (mismatchesCount > 0) {
                _parseLogStrings('Mismatched', localResult.mismatches);
            }

            html.removeElement(document.getElementById('build-logs-loading'));
        }
    }

    function getBuildLogs(response) {
        var deferred,
            results;

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('build-logs-loading'));
            html.replaceContent(
                document.getElementById('build-logs'),
                html.errorDiv('No data available.'));
        } else {
            if (gBuildId && gBuildId !== 'None' && gBuildId !== null) {
                deferred = r.get(
                    '/_ajax/build/' + gBuildId + '/logs', {});
            } else {
                deferred = r.get(
                    '/_ajax/build/logs',
                    {
                        job: gJobName,
                        kernel: gKernelName,
                        defconfig_full: gDefconfigFull
                    }
                );
            }

            $.when(deferred)
                .fail(e.error, getBuildLogsFail)
                .done(getBuildLogsDone);
            }
    }

    function getBuildDone(response) {
        var aNode,
            arch,
            buildLog,
            buildTime,
            defconfig,
            defconfigNode,
            detailNode,
            gitCommit,
            gitURL,
            gitURLs,
            job,
            kernel,
            results,
            serverResource,
            serverURL,
            spanNode,
            tooltipNode,
            translatedURI;

        function _createSizeNode(size) {
            var sizeNode;
            sizeNode = document.createElement('small');

            sizeNode.appendChild(document.createTextNode('('));
            sizeNode.appendChild(document.createTextNode(format.bytes(size)));
            sizeNode.appendChild(document.createTextNode(')'));

            return sizeNode;
        }

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('loading-content', '?');
        } else {
            // We only have 1 result!
            results = response.result[0];
            job = results.job;
            kernel = results.kernel;
            gitURL = results.git_url;
            gitCommit = results.git_commit;
            arch = results.arch;
            defconfig = results.defconfig_full;
            buildTime = results.build_time;
            buildLog = results.build_log;
            serverURL = results.file_server_url;
            serverResource = results.file_server_resource;

            if (serverURL === null || serverURL === undefined) {
                serverURL = gFileServer;
            }

            translatedURI = urls.translateServerURL(
                serverURL,
                serverResource, [job, kernel, arch + '-' + defconfig]);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // Details.
            detailNode = document.getElementById('details');
            detailNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = document.createElement('small');
            defconfigNode.appendChild(
                document.createTextNode('(' + results.defconfig + ')'));

            detailNode.appendChild(defconfigNode);

            // Tree.
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

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(results.git_branch));

            // Kernel.
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

            // Defconfig.
            spanNode = document.createElement('span');

            spanNode.appendChild(document.createTextNode(defconfig));

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + gJobName +
                    '&nbsp;&dash;&nbsp;' + gKernelName +
                    '&nbsp;&dash;&nbsp;' + defconfig
                );

            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                '/boot/all/job/' + gJobName + '/kernel/' +
                gKernelName + '/defconfig/' + defconfig + '/'
            );
            aNode.appendChild(html.boot());

            tooltipNode.appendChild(aNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            spanNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('build-defconfig'), spanNode);

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

            // Date.
            html.replaceContent(
                document.getElementById('build-date'),
                html.time(results.created_on));

            // Status.
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

            // Arch.
            if (arch) {
                html.replaceContent(
                    document.getElementById('build-arch'),
                    document.createTextNode(arch));
            } else {
                html.replaceContent(
                    document.getElementById('build-arch'), html.nonavail());
            }

            // Build time.
            if (buildTime !== null) {
                html.replaceContent(
                    document.getElementById('build-time'),
                    document.createTextNode(buildTime + 'sec.'));
            } else {
                html.replaceContent(
                    document.getElementById('build-time'), html.nonavail());
            }

            // Build log.
            if (buildLog) {
                spanNode = document.createElement('span');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    translatedURI[0]
                        .path(translatedURI[1] + '/' + buildLog)
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
        }
    }

    function getBuildFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function getBuild() {
        var deferred;

        if (gBuildId && gBuildId !== 'None' && gBuildId !== null) {
            deferred = r.get('/_ajax/build', {id: gBuildId});
        } else {
            deferred = r.get(
                '/_ajax/build',
                {
                    job: gJobName,
                    kernel: gKernelName,
                    defconfig_full: gDefconfigFull
                }
            );
        }

        $.when(deferred)
            .fail(e.error, getBuildFail)
            .done(getBuildDone, getBuildLogs);
    }

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('defconfig-full') !== null) {
        gDefconfigFull = document.getElementById('defconfig-full').value;
    }
    if (document.getElementById('build-id') !== null) {
        gBuildId = document.getElementById('build-id').value;
    }

    getBuild();

    init.hotkeys();
    init.tooltip();
});
