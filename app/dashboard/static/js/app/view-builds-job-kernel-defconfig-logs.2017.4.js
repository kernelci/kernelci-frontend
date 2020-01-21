/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
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
    }, 15);

    function getBuildLogsFail() {
        html.removeElement(document.getElementById('build-logs-loading'));
        html.replaceContent(
            document.getElementById('build-logs'),
            html.errorDiv('Error loading build logs data.'));
        html.replaceByClassNode('logs-loading-content', html.nonavail());
    }

    function getBuildLogsDone(response) {
        var aNode;
        var customLog;
        var divNode;
        var errorsCount;
        var hNode;
        var logsNode;
        var messageNode;
        var mismatchesCount;
        var results;
        var serverURL;
        var textArea;
        var translatedURI;
        var warningsCount;

        /**
         * Create the div and textarea to contain the log strings.
        **/
        function _parseLogStrings(title, strings, type) {
            var docFrag;
            var len;

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
            if (len > 128) {
                strings = strings.splice(0, 128);

                messageNode = divNode
                    .appendChild(document.createElement('div'));
                divNode.appendChild(
                    document.createTextNode(
                        'Shown log messages have been limited. ' +
                        'For more info, please refer to the'));
                divNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode = divNode.appendChild(document.createElement('a'));

                switch (type) {
                    case 'errors':
                        customLog = 'build-errors.log';
                        break;
                    case 'warnings':
                        customLog = 'build-warnings.log';
                        break;
                    default:
                        customLog = 'build-mismatches.log';
                        break;
                }

                aNode.setAttribute(
                    'href',
                    urls.getHref(
                        translatedURI[0], [translatedURI[1], customLog])
                );
                aNode.appendChild(document.createTextNode('build logs.'));
            }

            strings.forEach(function(str) {
                textArea.appendChild(document.createTextNode(str + '\n'));
            });

            logsNode.appendChild(docFrag);
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

            results = results[0];

            serverURL = results.file_server_url;
            if (!serverURL) {
                serverURL = gFileServer;
            }

            translatedURI = urls.createFileServerURL(serverURL, results);

            errorsCount = parseInt(results.errors_count, 10);
            warningsCount = parseInt(results.warnings_count, 10);
            mismatchesCount = parseInt(results.mismatches_count, 10);

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
                    _parseLogStrings('Errors', results.errors, 'errors');
                }, 75);
            }

            if (warningsCount > 0) {
                setTimeout(function() {
                    _parseLogStrings('Warnings', results.warnings, 'warnings');
                }, 75);
            }

            if (mismatchesCount > 0) {
                setTimeout(function() {
                    _parseLogStrings('Mismatched', results.mismatches, 'mism');
                }, 75);
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
            setTimeout(function() {
                $.when(r.get('/_ajax/build/' + gBuildId + '/logs', {}))
                    .fail(e.error, getBuildLogsFail)
                    .done(getBuildLogsDone);
            }, 25);
        }
    }

    function getBuildDone(response) {
        var aNode;
        var arch;
        var branch;
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
        var serverURL;
        var spanNode;
        var str;
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
            branch = results.git_branch;
            gitURL = results.git_url;
            gitCommit = results.git_commit;
            arch = results.arch;
            defconfigFull = results.defconfig_full;
            buildTime = results.build_time;
            buildLog = results.build_log;
            serverURL = results.file_server_url;
            createdOn = new Date(results.created_on.$date);

            if (!serverURL) {
                serverURL = gFileServer;
            }

            translatedURI = urls.createFileServerURL(serverURL, results);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // The body title.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.insertAdjacentHTML('beforeend', '&#171;');
            spanNode.appendChild(document.createTextNode(job));
            spanNode.insertAdjacentHTML('beforeend', '&#187;');
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&ndash;&nbsp;');
            spanNode.insertAdjacentHTML('beforeend', '&#171;');
            spanNode.appendChild(document.createTextNode(kernel));
            spanNode.insertAdjacentHTML('beforeend', '&#187;');
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = spanNode.appendChild(
                document.createElement('small'));
            str = '(';
            str += results.defconfig;
            str += ')';
            defconfigNode.appendChild(document.createTextNode(str));

            document.getElementById('body-title').appendChild(docFrag);

            // Tree.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Details for tree&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(document.createTextNode(job));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Boot reports for tree';
            str += '&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/boot/all/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.boot());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(branch));

            // Kernel.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Build details for';
            str += '&nbsp;';
            str += job;
            str += '&nbsp;&ndash;&nbsp;';
            str += kernel;
            str += '&nbsp;(';
            str += branch;
            str += ')';
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/build/';
            str += job;
            str += '/branch/';
            str += branch;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(document.createTextNode(kernel));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Boot reports for';
            str += '&nbsp;';
            str += job;
            str += '&nbsp;&ndash;&nbsp;';
            str += kernel;
            str += '&nbsp;(';
            str += branch;
            str += ')';
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/boot/all/job/';
            str += job;
            str += '/branch/';
            str += branch;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

            // Defconfig.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(document.createTextNode(defconfigFull));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Boot reports for';
            str += '&nbsp;';
            str += job;
            str += '&nbsp;&ndash;&nbsp;';
            str += kernel;
            str += '&nbsp;(';
            str += branch;
            str += '&nbsp;&ndash;&nbsp';
            str += defconfigFull;
            str += ')';
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/boot/all/job/';
            str += job;
            str += '/branch/';
            str += branch;
            str += '/kernel/';
            str += kernel;
            str += '/defconfig/';
            str += defconfigFull;
            str += '/';
            aNode.setAttribute('href', str);
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
                    urls.getHref(translatedURI[0], [translatedURI[1], buildLog])
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

    setTimeout(getBuild, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
