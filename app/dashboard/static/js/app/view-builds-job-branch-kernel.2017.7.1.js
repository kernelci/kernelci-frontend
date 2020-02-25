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
    'buttons/common',
    'buttons/build',
    'charts/passpie',
    'utils/html',
    'utils/storage',
    'utils/session',
    'utils/filter',
    'utils/date'
], function(
        $,
        init,
        format,
        e,
        r, u, commonBtns, buildBtns, chart, html, storage, session, filter) {
    'use strict';
    var gBranch;
    var gFileServer;
    var gKernel;
    var gLogMessage;
    var gResultFilter;
    var gSessionStorage;
    var gStorageName;
    var gTree;

    gLogMessage = 'Shown log messages have been limited. ';
    gLogMessage += 'Please refer to each single build for more info.';

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 15);

    function bindDetailButtons() {
        Array.prototype.forEach.call(
            document.getElementsByClassName('click-btn'),
            function(value) {
                value.addEventListener(
                    'click', commonBtns.showHideElements, true);
        });
        Array.prototype.forEach.call(
            document.getElementsByClassName('warn-err-btn'),
            function(value) {
                value.addEventListener(
                    'click', buildBtns.showHideWarnErr, true);
        });
    }

    function loadSavedSession() {
        var isLoaded;

        isLoaded = false;
        gSessionStorage.load();

        if (gSessionStorage.objects) {
            isLoaded = session.load(gSessionStorage.objects);
        }

        return isLoaded;
    }

    function showFailedOnly() {
        var failBtn;
        // If there is no saved session, show only the failed ones.
        Array.prototype.forEach.call(
            document.getElementsByClassName('df-failed'),
            function(element) {
                element.style.setProperty('display', 'block');
            }
        );
        Array.prototype.forEach.call(
            document.getElementsByClassName('df-success'),
            function(element) {
                element.style.setProperty('display', 'none');
            }
        );
        Array.prototype.forEach.call(
            document.getElementsByClassName('df-unknown'),
            function(element) {
                element.style.setProperty('display', 'none');
            }
        );

        failBtn = document.getElementById('fail-btn');
        Array.prototype.forEach.call(
            failBtn.parentElement.children, function(element) {
                if (element === failBtn) {
                    html.addClass(element, 'active');
                } else {
                    html.removeClass(element, 'active');
                }
            }
        );
    }

    function getCompilersDone(message) {
        var cell;
        var compilers;
        var docFrag;
        var row;
        var table;

        if (message.data) {
            docFrag = document.createDocumentFragment();

            Object.keys(message.data).forEach(function(key) {
                compilers = message.data[key];

                row = docFrag.appendChild(document.createElement('tr'));
                cell = row.appendChild(document.createElement('td'));

                cell.appendChild(document.createTextNode(key));
                cell.setAttribute('rowspan', compilers.length);

                cell = row.appendChild(document.createElement('td'));
                if (compilers[0]) {
                    cell.appendChild(document.createTextNode(compilers[0]));
                } else {
                    cell.appendChild(html.nonavail());
                }

                if (compilers.length > 1) {
                    compilers.slice(1).forEach(function(comp) {
                        row = docFrag.appendChild(document.createElement('tr'));
                        cell = row.appendChild(document.createElement('td'));
                        if (comp) {
                            cell.appendChild(document.createTextNode(comp));
                        } else {
                            cell.appendChild(html.nonavail());
                        }
                    });
                }
            });

            table = document.getElementById('compiler-table');
            html.replaceContent(
                table.tBodies[0],
                docFrag
            );
        }
    }

    function getCompilers(response) {
        var result;
        var worker;

        result = response.result;
        if (result.length > 0) {
            if (window.Worker) {
                worker = new Worker('/static/js/worker/compiler-version.js');

                worker.onmessage = getCompilersDone;
                worker.postMessage(result);
            }
        }
    }

    function getBuildsFail() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            html.errorDiv('Error loading data.'));
    }

    function getBuildsDone(response) {
        var aNode;
        var arch;
        var archLabelNode;
        var compiler;
        var compilerLabelNode;
        var branch;
        var cls;
        var colNode;
        var collapseBodyNode;
        var collapseId;
        var collapseNode;
        var ddNode;
        var defconfigFull;
        var dlNode;
        var docId;
        var dtNode;
        var errNode;
        var errorString;
        var errorsCount;
        var fileServerResource;
        var fileServerURL;
        var hNode;
        var hasFailed;
        var hasSuccess;
        var hasUnknown;
        var headingNode;
        var infoNode;
        var job;
        var kernel;
        var panelNode;
        var results;
        var rowNode;
        var smallNode;
        var status;
        var statusNode;
        var tooltipNode;
        var translatedURI;
        var warnErrCount;
        var warnErrString;
        var warnErrTooltip;
        var warningString;
        var warningsCount;
        var docFrag;

        hasFailed = false;
        hasSuccess = false;
        hasUnknown = false;
        results = response.result;

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

        function _createDataIndex(result) {
            var dataIndex;

            dataIndex = '';
            dataIndex += result.defconfig_full.toLowerCase();
            dataIndex += result.job.toLowerCase();
            dataIndex += result.kernel.toLowerCase();

            if (result.arch) {
                dataIndex += result.arch.toLowerCase();
            }
            if (result.status) {
                dataIndex += result.status.toLowerCase();
            }

            if (result.cross_compile) {
                dataIndex +=
                    result.cross_compile.toLowerCase();
            }

            if (result.compiler_version_full) {
                dataIndex += result.compiler_version_full.toLowerCase();
            }

            return dataIndex;
        }

        function _parseResult(result, idx) {
            docId = result._id.$oid;
            branch = result.git_branch;
            defconfigFull = result.defconfig_full;
            job = result.job;
            kernel = result.kernel;
            arch = result.arch;
            compiler = result.build_environment;
            fileServerURL = result.file_server_url;
            fileServerResource = result.file_server_resource;
            errorsCount = result.errors;
            warningsCount = result.warnings;
            status = result.status;
            collapseId = 'collapse-defconf' + idx;

            if (fileServerURL === null || fileServerURL === undefined) {
                fileServerURL = gFileServer;
            }

            translatedURI = u.createFileServerURL(fileServerURL, result);

            panelNode = docFrag.appendChild(document.createElement('div'));

            // Set the data-index attribute to filter the results.
            panelNode.setAttribute('data-index', _createDataIndex(result));

            headingNode = panelNode.appendChild(document.createElement('div'));
            headingNode.className = 'panel-heading collapsed';
            headingNode.id = 'panel-defconf' + idx;
            headingNode.setAttribute('aria-expanded', false);
            headingNode.setAttribute('data-parent', '#accordion');
            headingNode.setAttribute('data-toggle', 'collapse');
            headingNode.setAttribute('data-target', '#' + collapseId);
            headingNode.setAttribute('aria-controls', '#' + collapseId);

            hNode = headingNode.appendChild(document.createElement('h4'));
            hNode.className = 'panel-title';

            aNode = hNode.appendChild(document.createElement('a'));
            aNode.setAttribute('data-parent', '#accordion');
            aNode.setAttribute('data-toggle', 'collapse');
            aNode.setAttribute('href', '#' + collapseId);
            aNode.setAttribute('aria-controls', '#' + collapseId);
            aNode.appendChild(document.createTextNode(defconfigFull));

            if (arch !== null) {
                hNode.insertAdjacentHTML(
                    'beforeend', '&nbsp;&dash;&nbsp;');
                archLabelNode = hNode.appendChild(
                    document.createElement('span'));
                archLabelNode.setAttribute('class', 'arch-label');
                archLabelNode.appendChild(document.createTextNode(arch));
            }

            hNode.insertAdjacentHTML(
                'beforeend', '&nbsp;&dash;&nbsp;');
            compilerLabelNode = hNode.appendChild(
                document.createElement('span'));
            compilerLabelNode.setAttribute('class', 'build-env-label');
            compilerLabelNode.appendChild(document.createTextNode(compiler));
            
            switch (status) {
                case 'FAIL':
                    hasFailed = true;
                    statusNode = hNode.appendChild(html.fail('pull-right'));
                    cls = 'df-failed';
                    break;
                case 'PASS':
                    hasSuccess = true;
                    statusNode = hNode.appendChild(html.success('pull-right'));
                    cls = 'df-success';
                    break;
                default:
                    hasUnknown = true;
                    statusNode = hNode.appendChild(html.unknown('pull-right'));
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

            // Set the class of the panel node now, since we need the filter
            // class.
            panelNode.className = 'panel panel-default searchable ' + cls;

            errNode = hNode.appendChild(document.createElement('span'));
            errNode.className = 'build-warnings';
            smallNode = errNode.appendChild(document.createElement('small'));
            tooltipNode = smallNode.appendChild(html.tooltip());

            if (warningsCount === 0 && errorsCount === 0) {
                if (result.build_log !== null) {
                    warnErrTooltip = warnErrString + '&nbsp;&mdash;&nbsp;' +
                        'Click to view the build log';

                    tooltipNode.setAttribute('title', warnErrTooltip);
                    aNode = tooltipNode.appendChild(
                        document.createElement('a'));
                    aNode.setAttribute(
                        'href',
                        u.getHref(
                            translatedURI[0],
                            [translatedURI[1], result.build_log])
                    );
                    aNode.insertAdjacentHTML('beforeend', warnErrCount);
                } else {
                    tooltipNode.setAttribute('title', warnErrString);
                    tooltipNode.insertAdjacentHTML(
                        'beforeend', warnErrCount);
                }
            } else {
                warnErrTooltip = warnErrString + '&nbsp;&mdash;&nbsp;' +
                    'Click to view detailed build log information';

                tooltipNode.setAttribute('title', warnErrTooltip);
                aNode = tooltipNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    u.createPathHref(['/build/id/', docId, 'logs', '/']));
                aNode.insertAdjacentHTML('beforeend', warnErrCount);
            }

            collapseNode = panelNode.appendChild(
                document.createElement('div'));
            collapseNode.id = collapseId;
            collapseNode.className = 'panel-collapse collapse';
            collapseNode.setAttribute('aria-expanded', false);

            collapseBodyNode = collapseNode.appendChild(
                document.createElement('div'));
            collapseBodyNode.className = 'panel-body';

            rowNode = collapseBodyNode.appendChild(
                document.createElement('div'));
            rowNode.className = 'row';

            colNode = rowNode.appendChild(document.createElement('div'));
            colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

            dlNode = colNode.appendChild(document.createElement('dl'));
            dlNode.className = 'dl-horizontal';

            if (result.dtb_dir !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(
                    document.createTextNode('Dtb directory'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                aNode = ddNode.appendChild(document.createElement('a'));

                aNode.setAttribute(
                    'href',
                    u.getHref(
                        translatedURI[0], [translatedURI[1], result.dtb_dir])
                );
                aNode.appendChild(document.createTextNode(result.dtb_dir));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');

                aNode.appendChild(html.external());
            }

            if (result.modules !== null && result.modules !== undefined) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(document.createTextNode('Modules'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                aNode = ddNode.appendChild(document.createElement('a'));

                aNode.setAttribute(
                    'href',
                    u.getHref(
                        translatedURI[0], [translatedURI[1], result.modules])
                );
                aNode.appendChild(document.createTextNode(result.modules));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (result.modules_size !== null &&
                        result.modules_size !== undefined) {
                    ddNode.insertAdjacentHTML('beforeend', '&nbsp');
                    ddNode.appendChild(_createSizeNode(result.modules_size));
                }
            }

            if (result.text_offset !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(
                    document.createTextNode('Text offset'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                ddNode.appendChild(
                    document.createTextNode(result.text_offset));
            }

            if (result.kernel_image !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(document.createTextNode('Kernel image'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                aNode = ddNode.appendChild(document.createElement('a'));

                aNode.setAttribute(
                    'href',
                    u.getHref(
                        translatedURI[0],
                        [translatedURI[1], result.kernel_image])
                );
                aNode.appendChild(
                    document.createTextNode(result.kernel_image));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (result.kernel_image_size !== null &&
                        result.kernel_image_size !== undefined) {
                    ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    ddNode.appendChild(
                        _createSizeNode(result.kernel_image_size));
                }
            }

            if (result.kernel_config !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(
                    document.createTextNode('Kernel config'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                aNode = ddNode.appendChild(document.createElement('a'));

                aNode.setAttribute(
                    'href',
                    u.getHref(
                        translatedURI[0],
                        [translatedURI[1], result.kernel_config])
                );
                aNode.appendChild(
                    document.createTextNode(result.kernel_config));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (result.kernel_config_size !== null &&
                        result.kernel_config_size !== undefined) {
                    ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    ddNode.appendChild(
                        _createSizeNode(result.kernel_config_size));
                }
            }

            if (result.build_log !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(document.createTextNode('Build log'));

                ddNode = dlNode.appendChild(document.createElement('dd'));
                aNode = ddNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    u.getHref(
                        translatedURI[0],
                        [translatedURI[1], result.build_log])
                );
                aNode.appendChild(
                    document.createTextNode(result.build_log));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (result.build_log_size !== null &&
                        result.build_log_size !== undefined) {
                    ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    ddNode.appendChild(
                        _createSizeNode(result.build_log_size));
                }
            }

            // New col group.
            colNode = rowNode.appendChild(document.createElement('div'));
            colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

            dlNode = colNode.appendChild(document.createElement('dl'));
            dlNode.className = 'dl-horizontal';

            dtNode = dlNode.appendChild(document.createElement('dt'));
            dtNode.appendChild(document.createTextNode('Build errors'));
            ddNode = dlNode.appendChild(document.createElement('dd'));
            ddNode.appendChild(document.createTextNode(errorsCount));

            dtNode = dlNode.appendChild(document.createElement('dt'));
            dtNode.appendChild(document.createTextNode('Build warnings'));
            ddNode = dlNode.appendChild(document.createElement('dd'));
            ddNode.appendChild(document.createTextNode(warningsCount));

            if (result.build_time !== null) {
                dtNode = dlNode.appendChild(document.createElement('dt'));
                dtNode.appendChild(document.createTextNode('Build time'));
                ddNode = dlNode.appendChild(document.createElement('dd'));
                ddNode.appendChild(
                    document.createTextNode(result.build_time));
                ddNode.insertAdjacentHTML('beforeend', '&nbsp;sec.');
            }

            if (result.compiler || result.compiler_version_full ||
                    result.cross_compile) {

                colNode = rowNode.appendChild(document.createElement('div'));
                colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
                dlNode = colNode.appendChild(document.createElement('dl'));
                dlNode.className = 'dl-horizontal';

                if (result.compiler) {
                    dtNode = dlNode.appendChild(document.createElement('dt'));
                    dtNode.appendChild(
                        document.createTextNode('Compiler'));
                    ddNode = dlNode.appendChild(document.createElement('dd'));
                    ddNode.appendChild(
                        document.createTextNode(result.compiler));
                }

                if (result.compiler_version) {
                    dtNode = dlNode.appendChild(document.createElement('dt'));
                    dtNode.appendChild(
                        document.createTextNode('Compiler version'));
                    ddNode = dlNode.appendChild(document.createElement('dd'));
                    ddNode.appendChild(
                        document.createTextNode(result.compiler_version));
                }

                if (result.compiler_version_full) {
                    dtNode = dlNode.appendChild(document.createElement('dt'));
                    dtNode.appendChild(
                        document.createTextNode('Compiler string'));
                    ddNode = dlNode.appendChild(document.createElement('dd'));
                    ddNode.appendChild(
                        document.createTextNode(
                            result.compiler_version_full));
                }

                if (result.cross_compile) {
                    dtNode = dlNode.appendChild(document.createElement('dt'));
                    dtNode.appendChild(
                        document.createTextNode('Cross-compile'));
                    ddNode = dlNode.appendChild(document.createElement('dd'));
                    ddNode.appendChild(
                        document.createTextNode(result.cross_compile));
                }
            }

            colNode = rowNode.appendChild(document.createElement('div'));
            colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
            infoNode = colNode.appendChild(document.createElement('div'));
            infoNode.className = 'pull-center';
            tooltipNode = infoNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Details for this build');
            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href',
                u.createPathHref(['/build/id/', result._id.$oid, '/']));
            aNode.insertAdjacentHTML('beforeend', 'More info&nbsp;');
            aNode.appendChild(html.search());
        }

        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                html.errorDiv('No data available'));
        } else {
            docFrag = document.createDocumentFragment();
            results.forEach(_parseResult);
            // Append everything at the end.
            html.replaceContent(document.getElementById('accordion'), docFrag);

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

            setTimeout(function() {
                if (!loadSavedSession()) {
                    if (hasFailed) {
                        showFailedOnly();
                    } else {
                        html.addClass(
                            document.getElementById('all-btn'), 'active');
                    }
                }
            }, 0);

            // Bind buttons to the correct function.
            setTimeout(bindDetailButtons, 0);
        }
    }

    function getBuildsDoneChart(response) {
        chart.buildpie({
            element: 'build-chart',
            response: response,
            legend: true
        });
    }

    function getBuilds(response) {
        var deferred;
        var results;

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                html.errorDiv('No data available.'));
        } else {
            results = results[0];
            deferred = r.get(
                '/_ajax/build',
                {
                    job: results.job,
                    job_id: results._id.$oid,
                    kernel: results.kernel,
                    git_branch: results.git_branch,
                    sort: ['defconfig_full', 'arch'],
                    sort_order: 1,
                    nfield: ['dtb_dir_data']
                }
            );

            $.when(deferred)
                .fail(e.error, getBuildsFail)
                .done(getBuildsDone, getBuildsDoneChart, getCompilers);
        }
    }

    function getJobFail() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassHTML('loading-content', '&infin;');
    }

    function getJobDone(response) {
        var aNode;
        var branch;
        var createdOn;
        var docFrag;
        var gitCommit;
        var gitURL;
        var job;
        var kernel;
        var results;
        var smallNode;
        var spanNode;
        var tURLs;
        var tooltipNode;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClass('loading-content', '?');
        } else {
            results = results[0];
            createdOn = new Date(results.created_on.$date);
            gitCommit = results.git_commit;
            gitURL = results.git_url;
            job = results.job;
            kernel = results.kernel;
            branch = results.git_branch;
            tURLs = u.translateCommit(gitURL, gitCommit);

            // The kernel name in the title.
            spanNode = document.createElement('span');
            spanNode.appendChild(document.createTextNode(kernel));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
            smallNode = spanNode.appendChild(document.createElement('small'));
            smallNode.appendChild(document.createTextNode('(' + branch + ')'));

            html.replaceContent(
                document.getElementById('kernel-title'), spanNode);

            // Tree.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Details for tree ' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', u.createPathHref(['/job/', job, '/']));
            aNode.appendChild(document.createTextNode(job));

            spanNode.insertAdjacentHTML(
                'beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'Boot reports for ' + job);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', u.createPathHref(['/boot/all/job/', job, '/']));
            aNode.appendChild(html.boot());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(branch));

            // Git describe.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            spanNode.appendChild(document.createTextNode(kernel));

            spanNode.insertAdjacentHTML(
                'beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title',
                'Boot reports for ' + job + '&nbsp;&ndash;&nbsp;' +
                kernel +
                '&nbsp;(' + branch + ')'
            );
            aNode = tooltipNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href',
                u.createPathHref([
                    '/boot/all/job/',
                    job,
                    'branch',
                    branch,
                    'kernel',
                    kernel,
                    '/'
                ]));
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

            // Git URL.
            if (tURLs[0] !== null) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', tURLs[0]);
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
                        document.getElementById('git-url'),
                        html.nonavail());
                }
            }

            // Git commit.
            if (tURLs[1] !== null) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', tURLs[1]);
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
                document.createTextNode(createdOn.toCustomISODate()));

            html.replaceContent(
                document.getElementById('build-date'), docFrag);
        }
    }

    function getLogsFail() {
        html.replaceContent(
            document.getElementById('logs-summary'),
            html.errorDiv('Error loading logs data.'));
    }

    function getLogsDone(response) {
        var docFrag;
        var errors;
        var len;
        var mismatches;
        var result;
        var sectionDiv;
        var sectionDivTitle;
        var sectionTable;
        var sectionTitle;
        var tFoot;
        var tableCell;
        var tableRow;
        var warnings;

        result = response.result;
        if (result.length > 0) {
            errors = result[0].errors;
            warnings = result[0].warnings;
            mismatches = result[0].mismatches;

            docFrag = document.createDocumentFragment();

            len = errors.length;
            if (len > 0) {
                sectionDiv = docFrag.appendChild(
                    document.createElement('div'));
                sectionDivTitle = sectionDiv.appendChild(
                    document.createElement('div'));

                sectionTitle = sectionDivTitle.appendChild(
                    document.createElement('h5'));
                sectionTitle.appendChild(
                    document.createTextNode('Errors Summary'));

                sectionTable = sectionDiv.appendChild(
                    document.createElement('table'));
                sectionTable.className = 'table table-condensed logs-table';

                if (len > 128) {
                    errors = errors.splice(0, 128);
                }

                errors.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                if (len > 128) {
                    tFoot = sectionTable.createTFoot();
                    tableRow = tFoot.insertRow();
                    tableCell = tableRow.insertCell();

                    tableCell.setAttribute('colspan', 2);
                    tableCell.appendChild(document.createTextNode(gLogMessage));
                }
            }

            len = warnings.length;
            if (len > 0) {
                sectionDiv = docFrag.appendChild(
                    document.createElement('div'));
                sectionDivTitle = sectionDiv.appendChild(
                    document.createElement('div'));

                sectionTitle = sectionDivTitle.appendChild(
                    document.createElement('h5'));
                sectionTitle.appendChild(
                    document.createTextNode('Warnings Summary'));

                sectionTable = sectionDiv.appendChild(
                    document.createElement('table'));
                sectionTable.className = 'table table-condensed logs-table';

                if (len > 128) {
                    warnings = warnings.splice(0, 128);
                }

                warnings.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                if (len > 128) {
                    tFoot = sectionTable.createTFoot();
                    tableRow = tFoot.insertRow();
                    tableCell = tableRow.insertCell();

                    tableCell.setAttribute('colspan', 2);
                    tableCell.appendChild(document.createTextNode(gLogMessage));
                }
            }

            len = mismatches.length;
            if (len > 0) {
                sectionDiv = docFrag.appendChild(
                    document.createElement('div'));
                sectionDivTitle = sectionDiv.appendChild(
                    document.createElement('div'));

                sectionTitle = sectionDivTitle.appendChild(
                    document.createElement('h5'));
                sectionTitle.appendChild(
                    document.createTextNode('Mismatches Summary'));

                sectionTable = sectionDiv.appendChild(
                    document.createElement('table'));
                sectionTable.className = 'table table-condensed logs-table';

                if (len > 128) {
                    mismatches = mismatches.splice(0, 128);
                }

                mismatches.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                if (len > 128) {
                    tFoot = sectionTable.createTFoot();
                    tableRow = tFoot.insertRow();
                    tableCell = tableRow.insertCell();

                    tableCell.setAttribute('colspan', 2);
                    tableCell.appendChild(document.createTextNode(gLogMessage));
                }
            }

            html.replaceContent(
                document.getElementById('logs-summary'), docFrag);
        } else {
            html.replaceContent(
                document.getElementById('logs-summary'),
                html.errorDiv('No logs data available.'));
        }
    }

    function getLogs(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            results = results[0];
            $.when(r.get(
                '/_ajax/job/logs',
                {
                    job: results.job,
                    kernel: results.kernel,
                    git_branch: results.git_branch
                }))
            .fail(e.error, getLogsFail)
            .done(getLogsDone);
        } else {
            html.replaceContent(
                document.getElementById('logs-summary'),
                html.errorDiv('No logs data available.'));
        }
    }

    function getJob(job, branch, kernel) {
        var data;

        data = {
            job: job,
            git_branch: branch
        };

        if (kernel) {
            data.kernel = kernel;
        } else {
            data.sort = 'created_on';
            data.sort_order = -1;
            data.limit = 1;
        }

        $.when(r.get('/_ajax/job', data))
            .fail(e.error, getJobFail)
            .done(getJobDone, getLogs, getBuilds);
    }

    function registerEvents() {
        window.addEventListener('beforeunload', function() {
            var pageState;

            pageState = {};

            function _saveElementState(element) {
                pageState['#' + element.id] = [
                    {
                        type: 'class',
                        name: 'class',
                        value: element.getAttribute('class')
                    },
                    {
                        type: 'attr',
                        name: 'aria-expanded',
                        value: element.getAttribute('aria-expanded')
                    }
                ];
            }

            // Unload the filters applied through the input box.
            gResultFilter.unload();

            pageState['.df-success'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-success', 'style')
            };
            pageState['.df-failed'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-failed', 'style')
            };
            pageState['.df-unknown'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-unknown', 'style')
            };
            pageState['#all-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('all-btn', 'class')
            };
            pageState['#success-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('success-btn', 'class')
            };
            pageState['#fail-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('fail-btn', 'class')
            };
            pageState['#unknown-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('unknown-btn', 'class')
            };

            Array.prototype.forEach.call(
                document.querySelectorAll('[id^="panel-defconf"]'),
                _saveElementState);

            Array.prototype.forEach.call(
                document.querySelectorAll('[id^="collapse-defconf"]'),
                _saveElementState);

            gSessionStorage.addObjects(pageState).save();
        });
    }

    Array.prototype.forEach.call(
        document.querySelectorAll('.btn-group > .btn'),
        function(btn) {
            btn.addEventListener('click', function() {
                Array.prototype.forEach.call(
                    btn.parentElement.children, function(element) {
                    if (element === btn) {
                        html.addClass(element, 'active');
                    } else {
                        html.removeClass(element, 'active');
                    }
                });
            });
    });

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('tree-name') !== null) {
        gTree = document.getElementById('tree-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
        if (gKernel === 'None' || gKernel === 'null') {
            gKernel = null;
        }
    }

    gStorageName = 'build-';
    gStorageName += gTree;
    gStorageName += '-';
    gStorageName += gBranch;
    gStorageName += '-';

    if (gKernel) {
        gStorageName += gKernel;
    } else {
        gStorageName += 'latest';
    }

    gSessionStorage = storage(gStorageName);
    gResultFilter = filter('data-filter');

    setTimeout(getJob.bind(null, gTree, gBranch, gKernel), 10);
    setTimeout(registerEvents, 25);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
