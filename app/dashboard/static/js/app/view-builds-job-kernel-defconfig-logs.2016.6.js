/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/html',
    'utils/date'
], function($, init, format, e, r, urls, html) {
    'use strict';
    var gBuildId;
    var gFileServer;

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 0);

    function getBuildLogsFail() {
        html.removeElement(document.getElementById('build-logs-loading'));
        html.replaceContent(
            document.getElementById('build-logs'),
            html.errorDiv('Error loading build logs data.'));
        html.replaceByClassNode('logs-loading-content', html.nonavail());
    }

    function getBuildLogsDone(response) {
        var divNode;
        var errorsCount;
        var hNode;
        var localResult;
        var logsNode;
        var mismatchesCount;
        var results;
        var textArea;
        var warningsCount;

        function _splicedLogsParse(spliced, nodeId) {
            var domNode;

            domNode = logsNode.querySelector('#' + nodeId);
            spliced.forEach(function(str) {
                setTimeout(function() {
                    domNode.appendChild(document.createTextNode(str + '\n'));
                }, 0);
            });
        }

        /**
         * Create the div and textarea to contain the log strings.
        **/
        function _parseLogStrings(title, strings) {
            var docFrag;
            var len;
            var parts;

            docFrag = document.createDocumentFragment();
            divNode = docFrag.appendChild(document.createElement('div'));
            divNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

            hNode = divNode.appendChild(document.createElement('h5'));
            hNode.appendChild(document.createTextNode(title));

            textArea = divNode.appendChild(document.createElement('textarea'));
            textArea.id = title.toLowerCase();
            textArea.className = 'build-logs form-control';
            textArea.setAttribute('readonly', true);
            textArea.setAttribute('cols', 100);
            textArea.setAttribute('rows', 15);

            len = strings.length;
            if (len > 1024) {
                parts = Math.ceil(len / 1024);
                logsNode.appendChild(docFrag);

                while (parts > 0) {
                    setTimeout(
                        _splicedLogsParse.bind(
                            null, strings.splice(0, 1024), textArea.id), 0);
                    parts = parts - 1;
                }
            } else {
                strings.forEach(function(str) {
                    textArea.appendChild(document.createTextNode(str + '\n'));
                });

                logsNode.appendChild(docFrag);
            }
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
                setTimeout(function() {
                    _parseLogStrings('Errors', localResult.errors);
                }, 1);
            }

            if (warningsCount > 0) {
                setTimeout(function() {
                    _parseLogStrings('Warnings', localResult.warnings);
                }, 1);
            }

            if (mismatchesCount > 0) {
                setTimeout(function() {
                    _parseLogStrings('Mismatched', localResult.mismatches);
                }, 1);
            }

            html.removeElement(document.getElementById('build-logs-loading'));
        }
    }

    function getBuildLogs(response) {
        if (response.result.length === 0) {
            html.removeElement(document.getElementById('build-logs-loading'));
            html.replaceContent(
                document.getElementById('build-logs'),
                html.errorDiv('No data available.'));
            html.replaceByClassTxt('logs-loading-content', '?');
        } else {
            $.when(r.get('/_ajax/build/' + gBuildId + '/logs', {}))
                .fail(e.error, getBuildLogsFail)
                .done(getBuildLogsDone);
            }
    }

    function getBuildDone(response) {
        var aNode;
        var arch;
        var buildLog;
        var buildTime;
        var createdOn;
        var defconfigFull;
        var defconfigNode;
        var docFrag;
        var gitCommit;
        var gitURL;
        var gitURLs;
        var job;
        var kernel;
        var results;
        var serverResource;
        var serverURL;
        var spanNode;
        var tooltipNode;
        var translatedURI;

        function _createSizeNode(size) {
            var frag;
            var sizeNode;

            frag = document.createDocumentFragment();
            sizeNode = frag.appendChild(document.createElement('small'));

            sizeNode.appendChild(document.createTextNode('('));
            sizeNode.appendChild(document.createTextNode(format.bytes(size)));
            sizeNode.appendChild(document.createTextNode(')'));

            return frag;
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
            defconfigFull = results.defconfig_full;
            buildTime = results.build_time;
            buildLog = results.build_log;
            serverURL = results.file_server_url;
            serverResource = results.file_server_resource;
            createdOn = new Date(results.created_on.$date);

            if (serverURL === null || serverURL === undefined) {
                serverURL = gFileServer;
            }

            translatedURI = urls.translateServerURL(
                serverURL,
                serverResource, [job, kernel, arch + '-' + defconfigFull]);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // The body title.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            spanNode.insertAdjacentHTML('beforeend', '&#171;');
            spanNode.appendChild(document.createTextNode(job));
            spanNode.insertAdjacentHTML('beforeend', '&#187;');
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
            spanNode.insertAdjacentHTML('beforeend', '&#171;');
            spanNode.appendChild(document.createTextNode(kernel));
            spanNode.insertAdjacentHTML('beforeend', '&#187;');
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = spanNode.appendChild(
                document.createElement('small'));
            defconfigNode.appendChild(
                document.createTextNode('(' + results.defconfig + ')'));

            document.getElementById('body-title').appendChild(docFrag);

            // Tree.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', '/job/' + job + '/');
            aNode.appendChild(document.createTextNode(job));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'Boot reports for tree&nbsp;' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', '/boot/all/job/' + job + '/');
            aNode.appendChild(html.boot());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(results.git_branch));

            // Kernel.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title',
                'Build details for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', '/build/' + job + '/kernel/' + kernel + '/');
            aNode.appendChild(document.createTextNode(kernel));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel
            );

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', '/boot/all/job/' + job + '/kernel/' + kernel + '/');
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

            // Defconfig.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(document.createTextNode(defconfigFull));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title',
                'Boot reports for&nbsp;' + job +
                    '&nbsp;&dash;&nbsp;' + kernel +
                    '&nbsp;&dash;&nbsp;' + defconfigFull
                );

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href',
                '/boot/all/job/' + job + '/kernel/' +
                kernel + '/defconfig/' + defconfigFull + '/'
            );
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('build-defconfig'), docFrag);

            // Git URL/commit.
            if (gitURLs[0] !== null) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', gitURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-url'), docFrag);
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
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', gitURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-commit'), docFrag);
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
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('time'));
            spanNode.setAttribute('datetime', createdOn.toISOString());
            spanNode.appendChild(
                document.createTextNode(createdOn.toCustomISODateTime()));

            html.replaceContent(
                document.getElementById('build-date'), docFrag);

            // Status.
            docFrag = document.createDocumentFragment();
            tooltipNode = docFrag.appendChild(html.tooltip());
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
                document.getElementById('build-status'), docFrag);

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
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));

                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    translatedURI[0]
                        .path(translatedURI[1] + '/' + buildLog)
                        .normalizePath().href()
                );

                aNode.appendChild(document.createTextNode(buildLog));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (results.build_log_size !== null &&
                        results.build_log_size !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(
                        _createSizeNode(results.build_log_size));
                }

                html.replaceContent(
                    document.getElementById('build-log'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('build-log'), html.nonavail());
            }
        }
    }

    function getBuildFail() {
        html.removeElement(document.getElementById('build-logs-loading'));
        html.replaceContent(
            document.getElementById('build-logs'),
            html.errorDiv('Error loading data'));
        html.replaceByClassNode('loading-content', html.nonavail());
        html.replaceByClassNode('logs-loading-content', html.nonavail());
    }

    function getBuild() {
        $.when(r.get('/_ajax/build', {id: gBuildId}))
            .fail(e.error, getBuildFail)
            .done(getBuildDone, getBuildLogs);
    }

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('build-id') !== null) {
        gBuildId = document.getElementById('build-id').value;
    }

    setTimeout(getBuild, 0);

    init.hotkeys();
    init.tooltip();
});
