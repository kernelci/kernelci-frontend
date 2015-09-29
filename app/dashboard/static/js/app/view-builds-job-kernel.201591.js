/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls',
    'utils/web-storage',
    'utils/show-hide-btns',
    'charts/passpie',
    'utils/html'
], function($, b, e, init, r, u, ws, btns, chart, html) {
    'use strict';
    var fileServer,
        jobName,
        kernelName;

    function createErrorDiv(txt) {
        var div,
            text;

        div = html.div();
        div.className = 'pull-center';
        text = html.strong();
        text.appendChild(document.createTextNode(txt));
        div.appendChild(text);

        return div;
    }

    function bindDetailButtons() {
        [].forEach
            .call(
                document.getElementsByClassName('click-btn'),
                function(value) {
                    value
                        .addEventListener(
                            'click', btns.showHideElements, true);
            });
        [].forEach
            .call(
                document.getElementsByClassName('warn-err-btn'),
                function(value) {
                    value
                        .addEventListener(
                            'click', btns.showHideWarnErr, true);
            });
    }

    function getBuildsFail() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            createErrorDiv('Error loading data.'));
    }

    function getBuildsDone(response) {
        var aNode,
            accordionElement,
            arch,
            archLabelNode,
            buildLogURI,
            cls,
            colNode,
            collapseBodyNode,
            collapseId,
            collapseNode,
            ddNode,
            defconfigFull,
            dlNode,
            docId,
            dtNode,
            errNode,
            errorString,
            errorsCount,
            failBtn,
            fileServerData,
            fileServerResource,
            fileServerURI,
            fileServerURL,
            hNode,
            hasFailed,
            hasSuccess,
            hasUnknown,
            headingNode,
            iNode,
            infoNode,
            job,
            kernel,
            lFileServer,
            metadata,
            panelNode,
            pathURI,
            resLen,
            results,
            rowNode,
            sizeNode,
            smallNode,
            statusNode,
            tooltipNode,
            translatedURI,
            warnErrCount,
            warnErrString,
            warnErrTooltip,
            warningString,
            warningsCount;

        hasFailed = false;
        hasSuccess = false;
        hasUnknown = false;
        lFileServer = fileServer;
        results = response.result;
        resLen = results.length;

        if (resLen === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                createErrorDiv('No data available'));
        } else {
            accordionElement = document.getElementById('accordion');
            html.removeChildren(accordionElement);

            results.forEach(function(value, idx) {
                docId = value._id.$oid;
                defconfigFull = value.defconfig_full;
                job = value.job;
                kernel = value.kernel;
                arch = value.arch;
                fileServerURL = value.file_server_url;
                fileServerResource = value.file_server_resource;
                errorsCount = value.errors;
                warningsCount = value.warnings;
                metadata = value.metadata;

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

                switch (value.status) {
                    case 'FAIL':
                        hasFailed = true;
                        statusNode = html.fail();
                        cls = 'df-failed';
                        break;
                    case 'PASS':
                        hasSuccess = true;
                        statusNode = html.success();
                        cls = 'df-success';
                        break;
                    default:
                        hasUnknown = true;
                        statusNode = html.unknown();
                        cls = 'df-unknown';
                        break;
                }
                statusNode.className = statusNode.className + ' pull-right';

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

                errNode = html.span();
                errNode.className = 'build-warnings';
                smallNode = html.small();
                tooltipNode = html.tooltip();

                if (warningsCount === 0 && errorsCount === 0) {
                    if (value.build_log !== null) {
                        buildLogURI = fileServerURI.path(pathURI +
                            '/' + value.build_log).normalizePath().href();
                        warnErrTooltip = warnErrString + '&nbsp;&mdash;&nbsp;' +
                            'Click to view the build log';

                        tooltipNode.setAttribute('title', warnErrTooltip);
                        aNode = html.a();
                        aNode.setAttribute('href', buildLogURI);
                        aNode.innerHTML = aNode.innerHTML + warnErrCount;

                        tooltipNode.appendChild(aNode);
                        smallNode.appendChild(tooltipNode);
                        errNode.appendChild(smallNode);
                    } else {
                        tooltipNode.setAttribute('title', warnErrString);
                        tooltipNode.innerHTML = tooltipNode.innerHTML +
                            warnErrCount;

                        smallNode.appendChild(tooltipNode);
                        errNode.appendChild(smallNode);
                    }
                } else {
                    warnErrTooltip = warnErrString + '&nbsp;&mdash;&nbsp;' +
                        'Click to view detailed build log information';

                    tooltipNode.setAttribute('title', warnErrTooltip);
                    aNode = html.a();
                    aNode.setAttribute(
                        'href',
                        '/build/' + job + '/kernel/' + kernel +
                        '/defconfig/' + defconfigFull + '/logs/?_id=' + docId);
                    aNode.innerHTML = aNode.innerHTML + warnErrCount;

                    tooltipNode.appendChild(aNode);
                    smallNode.appendChild(tooltipNode);
                    errNode.appendChild(smallNode);
                }

                collapseId = 'collapse-defconf' + idx;
                panelNode = html.div();
                panelNode.className = 'panel panel-default' + ' ' + cls;

                headingNode = html.div();
                headingNode.className = 'panel-heading collapsed';
                headingNode.id = 'panel-defconf' + idx;
                headingNode.setAttribute('aria-expanded', false);
                headingNode.setAttribute('data-parent', '#accordion');
                headingNode.setAttribute('data-toggle', 'collapse');
                headingNode.setAttribute(
                    'data-target', '#' + collapseId);
                headingNode.setAttribute(
                    'aria-controls', '#' + collapseId);

                hNode = html.h4();
                hNode.className = 'panel-title';

                aNode = html.a();
                aNode.setAttribute('data-parent', '#accordion');
                aNode.setAttribute('data-toggle', 'collapse');
                aNode.setAttribute('href', '#' + collapseId);
                aNode.setAttribute('aria-controls', '#' + collapseId);
                aNode.appendChild(document.createTextNode(defconfigFull));

                hNode.appendChild(aNode);

                if (arch !== null) {
                    hNode.innerHTML = hNode.innerHTML + '&nbsp;&dash;&nbsp;';
                    archLabelNode = html.span();
                    archLabelNode.setAttribute('class', 'arch-label');
                    archLabelNode.appendChild(document.createTextNode(arch));
                    hNode.appendChild(archLabelNode);
                }

                hNode.appendChild(statusNode);
                hNode.appendChild(errNode);
                headingNode.appendChild(hNode);
                panelNode.appendChild(headingNode);

                collapseNode = html.div();
                collapseNode.id = collapseId;
                collapseNode.className = 'panel-collapse collapse';
                collapseNode.setAttribute('aria-expanded', false);
                collapseBodyNode = html.div();
                collapseBodyNode.className = 'panel-body';

                rowNode = html.div();
                rowNode.className = 'row';

                colNode = html.div();
                colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

                dlNode = html.dl();
                dlNode.className = 'dl-horizontal';

                if (value.dtb_dir !== null) {
                    dtNode = html.dt();
                    ddNode = html.dd();
                    aNode = html.a();
                    iNode = html.i();

                    dtNode.appendChild(
                        document.createTextNode('Dtb directory'));

                    aNode.setAttribute(
                        'href',
                        fileServerURI
                            .path(
                                pathURI + '/' + value.dtb_dir + '/')
                            .normalizePath().href()
                    );
                    aNode.appendChild(document.createTextNode(value.dtb_dir));
                    aNode.innerHTML = aNode.innerHTML + '&nbsp;';

                    iNode.className = 'fa fa-external-link';

                    aNode.appendChild(iNode);
                    ddNode.appendChild(aNode);
                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                if (value.modules !== null && value.modules !== undefined) {
                    dtNode = html.dt();
                    ddNode = html.dd();
                    aNode = html.a();
                    iNode = html.i();

                    dtNode.appendChild(document.createTextNode('Modules'));
                    aNode.setAttribute(
                        'href',
                         fileServerURI.path(pathURI + '/' + value.modules)
                            .normalizePath().href());
                    aNode.appendChild(document.createTextNode(value.modules));
                    aNode.innerHTML = aNode.innerHTML + '&nbsp;';
                    iNode.className = 'fa fa-external-link';

                    aNode.appendChild(iNode);
                    ddNode.appendChild(aNode);

                    if (value.modules_size !== null &&
                            value.modules_size !== undefined) {
                        sizeNode = html.small();
                        ddNode.innerHTML = ddNode.innerHTML + '&nbsp;';
                        sizeNode.appendChild(
                            document.createTextNode(
                                b.bytesToHuman(value.modules_size)));
                    }

                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                if (value.text_offset !== null) {
                    dtNode = html.dt();
                    ddNode = html.dd();

                    dtNode.appendChild(
                        document.createTextNode('Text offset'));
                    ddNode.appendChild(
                        document.createTextNode(value.text_offset));

                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                if (value.kernel_image !== null) {
                    dtNode = html.dt();
                    ddNode = html.dd();
                    aNode = html.a();
                    iNode = html.i();
                    sizeNode = html.small();

                    dtNode.appendChild(document.createTextNode('Kernel image'));
                    aNode.setAttribute(
                        'href',
                        fileServerURI
                            .path(pathURI + '/' + value.kernel_image)
                            .normalizePath().href()
                    );
                    aNode.appendChild(
                        document.createTextNode(value.kernel_image));
                    aNode.innerHTML = aNode.innerHTML + '&nbsp;';
                    iNode.className = 'fa fa-external-link';
                    aNode.appendChild(iNode);

                    ddNode.appendChild(aNode);
                    if (value.kernel_image_size !== null &&
                            value.kernel_image_size !== undefined) {
                        ddNode.innerHTML = ddNode.innerHTML + '&nbsp;';
                        sizeNode.appendChild(
                            document.createTextNode(
                                b.bytesToHuman(value.kernel_image_size)));
                        ddNode.appendChild(sizeNode);
                    }

                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                if (value.kernel_config !== null) {
                    dtNode = html.dt();
                    ddNode = html.dd();
                    aNode = html.a();
                    iNode = html.i();

                    dtNode.appendChild(
                        document.createTextNode('Kernel config'));
                    aNode.setAttribute('href',
                        fileServerURI
                            .path(pathURI + '/' + value.kernel_config)
                            .normalizePath().href()
                    );
                    aNode.appendChild(
                        document.createTextNode(value.kernel_config));
                    aNode.innerHTML = aNode.innerHTML + '&nbsp;';
                    iNode.className = 'fa fa-external-link';
                    aNode.appendChild(iNode);
                    ddNode.appendChild(aNode);

                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                if (value.build_log !== null) {
                    dtNode = html.dt();
                    ddNode = html.dd();
                    aNode = html.a();
                    iNode = html.i();
                    iNode.className = 'fa fa-external-link';

                    dtNode.appendChild(document.createTextNode('Build log'));
                    aNode.setAttribute('href', buildLogURI);
                    aNode.appendChild(
                        document.createTextNode(value.build_log));
                    aNode.innerHTML = aNode.innerHTML + '&nbsp;';
                    aNode.appendChild(iNode);
                    ddNode.appendChild(aNode);
                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                colNode.appendChild(dlNode);
                rowNode.appendChild(colNode);

                colNode = html.div();
                colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

                dlNode = html.dl();
                dlNode.className = 'dl-horizontal';

                dtNode = html.dt();
                dtNode.appendChild(document.createTextNode('Build errors'));
                ddNode = html.dd();
                ddNode.appendChild(document.createTextNode(errorsCount));

                dlNode.appendChild(dtNode);
                dlNode.appendChild(ddNode);

                dtNode = html.dt();
                dtNode.appendChild(document.createTextNode('Build warnings'));
                ddNode = html.dd();
                ddNode.appendChild(document.createTextNode(warningsCount));

                dlNode.appendChild(dtNode);
                dlNode.appendChild(ddNode);

                if (value.build_time !== null) {
                    dtNode = html.dt();
                    dtNode.appendChild(document.createTextNode('Build time'));
                    ddNode = html.dd();
                    ddNode.appendChild(
                        document.createTextNode(value.build_time));
                    ddNode.innerHTML = ddNode.innerHTML + '&nbsp;sec.';
                    dlNode.appendChild(dtNode);
                    dlNode.appendChild(ddNode);
                }

                colNode.appendChild(dlNode);
                rowNode.appendChild(colNode);

                if (metadata !== undefined && metadata !== null) {
                    colNode = html.div();
                    colNode.className = 'col-xs-12 col-sm-12 ' +
                        'col-md-12 col-lg-12';
                    dlNode = html.dl();
                    dlNode.className = 'dl-horizontal';

                    if (metadata.hasOwnProperty('cross_compile')) {
                        dtNode = html.dt();
                        dtNode.appendChild(
                            document.createTextNode('Cross-compile'));
                        ddNode = html.dd();
                        ddNode.appendChild(
                            document.createTextNode(metadata.cross_compile));
                        dlNode.appendChild(dtNode);
                        dlNode.appendChild(ddNode);
                    }

                    if (metadata.hasOwnProperty('compiler_version')) {
                        dtNode = html.dt();
                        dtNode.appendChild(
                            document.createTextNode('Compiler'));
                        ddNode = html.dd();
                        ddNode.appendChild(
                            document.createTextNode(
                                metadata.compiler_version));
                        dlNode.appendChild(dtNode);
                        dlNode.appendChild(ddNode);
                    }

                    colNode.appendChild(dlNode);
                    rowNode.appendChild(colNode);
                }

                colNode = html.div();
                colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
                infoNode = html.div();
                infoNode.className = 'pull-center';
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'Details for this build');
                iNode = html.i();
                iNode.className = 'fa fa-search';
                aNode = html.a();
                aNode.setAttribute(
                    'href',
                    '/build/' + job + '/kernel/' + kernel +
                    '/defconfig/' + defconfigFull + '/?_id=' + value._id.$oid);
                aNode.innerHTML = 'More info&nbsp;';
                aNode.appendChild(iNode);
                tooltipNode.appendChild(aNode);
                infoNode.appendChild(tooltipNode);
                colNode.appendChild(infoNode);

                rowNode.appendChild(colNode);
                collapseBodyNode.appendChild(rowNode);
                collapseNode.appendChild(collapseBodyNode);
                panelNode.appendChild(collapseNode);

                accordionElement.appendChild(panelNode);
            });

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

            // Bind buttons to the correct function.
            bindDetailButtons();

            if (!ws.load('build-' + jobName + '-' + kernelName)) {
                if (hasFailed) {
                    // If there is no saved session, show only the failed ones.
                    [].forEach.call(
                        document.getElementsByClassName('df-failed'),
                        function(element) {
                            element.style.setProperty('display', 'block');
                        }
                    );
                    [].forEach.call(
                        document.getElementsByClassName('df-success'),
                        function(element) {
                            element.style.setProperty('display', 'none');
                        }
                    );
                    [].forEach.call(
                        document.getElementsByClassName('df-unknown'),
                        function(element) {
                            element.style.setProperty('display', 'none');
                        }
                    );

                    failBtn = document.getElementById('fail-btn');
                    [].forEach.call(
                        failBtn.parentElement.children, function(element) {
                            if (element === failBtn) {
                                html.addClass(element, 'active');
                            } else {
                                html.removeClass(element, 'active');
                            }
                        }
                    );
                } else {
                    html.addClass(
                        document.getElementById('all-btn'), 'active');
                }
            }
        }
    }

    function getBuildsDoneChart(response) {
        chart.buildpie('build-chart', response);
    }

    function getBuilds(response) {
        var data,
            deferred,
            resLen,
            results;

        results = response.result;
        resLen = results.length;
        if (resLen === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                createErrorDiv('No data available.'));
        } else {
            data = {
                job_id: results[0]._id.$oid,
                job: jobName,
                kernel: kernelName,
                sort: ['defconfig_full', 'arch'],
                sort_order: 1
            };
            deferred = r.get('/_ajax/build', data);
            $.when(deferred)
                .fail(e.error, getBuildsFail)
                .done(getBuildsDone, getBuildsDoneChart);
        }
    }

    function getJobFail() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            createErrorDiv('Error loading data.'));
        html.replaceByClass('loading-content', '&infin;');
    }

    function getJobDone(response) {
        var aNode,
            createdOn,
            gitCommit,
            gitURL,
            iNode,
            localResult,
            resLen,
            results,
            spanNode,
            tNode,
            tURLs,
            updateElement;

        results = response.result;
        resLen = results.length;
        if (resLen === 0) {
            html.replaceByClass('loading-content', '?');
        } else {
            localResult = results[0];
            gitURL = localResult.git_url;
            gitCommit = localResult.git_commit;
            tURLs = u.translateCommit(gitURL, gitCommit);
            createdOn = new Date(localResult.created_on.$date);

            spanNode = html.tooltip();
            spanNode.setAttribute('title', 'Details for tree ' + jobName);

            aNode = html.a();
            aNode.setAttribute('href', '/job/' + jobName + '/');
            aNode.appendChild(document.createTextNode(jobName));

            spanNode.appendChild(aNode);

            updateElement = document.getElementById('tree');
            html.removeChildren(updateElement);

            updateElement.appendChild(spanNode);
            updateElement.innerHTML = updateElement.innerHTML +
                '&nbsp;&mdash;&nbsp;';

            spanNode = html.tooltip();
            spanNode.setAttribute(
                'title', 'Boot reports details for ' + jobName);

            aNode = html.a();
            aNode.setAttribute('href', '/boot/all/job/' + jobName + '/');

            iNode = html.i();
            iNode.className = 'fa fa-hdd-o';

            aNode.appendChild(iNode);
            spanNode.appendChild(aNode);

            updateElement.appendChild(spanNode);

            updateElement = document.getElementById('git-branch');
            html.removeChildren(updateElement);
            updateElement.appendChild(
                document.createTextNode(localResult.git_branch));

            updateElement = document.getElementById('git-describe');
            html.removeChildren(updateElement);

            updateElement.appendChild(document.createTextNode(kernelName));
            updateElement.innerHTML = updateElement.innerHTML +
                '&nbsp;&mdash;&nbsp;';

            spanNode = html.tooltip();
            spanNode.setAttribute(
                'title',
                'All boot reports for ' + jobName + '&nbsp;&dash;&nbsp;' +
                kernelName
            );
            aNode = html.a();
            aNode.setAttribute(
                'href',
                '/boo/all/job/' + jobName + '/kernel/' + kernelName + '/');
            iNode = html.i();
            iNode.className = 'fa fa-hdd-o';

            aNode.appendChild(iNode);
            spanNode.appendChild(aNode);
            updateElement.appendChild(spanNode);

            updateElement = document.getElementById('git-url');
            html.removeChildren(updateElement);

            if (tURLs[0] !== null) {
                aNode = html.a();
                aNode.setAttribute('href', tURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
                aNode.innerHTML = aNode.innerHTML + '&nbsp;';

                iNode = html.i();
                iNode.className = 'fa fa-external-link';

                aNode.appendChild(iNode);
                updateElement.appendChild(aNode);
            } else {
                if (gitURL !== null) {
                    updateElement.appendChild(document.createTextNode(gitURL));
                } else {
                    updateElement.appendChild(html.unavailable());
                }
            }

            updateElement = document.getElementById('git-commit');
            html.removeChildren(updateElement);
            if (tURLs[1] !== null) {
                aNode = html.a();
                aNode.setAttribute('href', tURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.innerHTML = aNode.innerHTML + '&nbsp;';

                iNode = html.i();
                iNode.className = 'fa fa-external-link';

                aNode.appendChild(iNode);
                updateElement.appendChild(aNode);
            } else {
                if (gitCommit !== null) {
                    updateElement.appendChild(
                        document.createTextNode(gitCommit));
                } else {
                    updateElement.appendChild(html.unavailable());
                }
            }

            tNode = html.time();
            tNode.appendChild(
                document.createTextNode(createdOn.getCustomISODate()));
            html.replaceContent(document.getElementById('build-date'), tNode);
        }
    }

    function getLogsFail() {
        html.replaceContent(
            document.getElementById('logs-summary'),
            createErrorDiv('Error loading logs summary data.'));
    }

    function getLogsDone(response) {
        var errors,
            mismatches,
            resLen,
            result,
            sectionDiv,
            sectionDivTitle,
            sectionTable,
            sectionTitle,
            summaryDiv,
            tableCell,
            tableRow,
            warnings;

        result = response.result;
        resLen = result.length;

        if (resLen > 0) {
            summaryDiv = document.getElementById('logs-summary');
            html.removeChildren(summaryDiv);

            errors = result[0].errors;
            warnings = result[0].warnings;
            mismatches = result[0].mismatches;

            if (errors.length > 0) {
                sectionDiv = document.createElement('div');
                sectionDivTitle = document.createElement('div');
                sectionTitle = document.createElement('h5');

                sectionTitle.appendChild(
                    document.createTextNode('Errors Summary'));
                sectionDivTitle.appendChild(sectionTitle);
                sectionDiv.appendChild(sectionDivTitle);

                sectionTable = document.createElement('table');
                sectionTable.className = 'table table-condensed summary-table';

                errors.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                sectionDiv.appendChild(sectionTable);
                summaryDiv.appendChild(sectionDiv);
            }

            if (warnings.length > 0) {
                sectionDiv = html.div();
                sectionDivTitle = html.div();
                sectionTitle = html.h5();

                sectionTitle.appendChild(
                    document.createTextNode('Warnings Summary'));
                sectionDivTitle.appendChild(sectionTitle);
                sectionDiv.appendChild(sectionDivTitle);

                sectionTable = html.table();
                sectionTable.className = 'table table-condensed summary-table';

                warnings.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                sectionDiv.appendChild(sectionTable);
                summaryDiv.appendChild(sectionDiv);
            }

            if (mismatches.length > 0) {
                sectionDiv = html.div();
                sectionDivTitle = html.div();
                sectionTitle = html.h5();

                sectionTitle.appendChild(
                    document.createTextNode('Mismatches Summary'));
                sectionDivTitle.appendChild(sectionTitle);
                sectionDiv.appendChild(sectionDivTitle);

                sectionTable = html.table();
                sectionTable.className = 'table table-condensed summary-table';

                mismatches.forEach(function(value) {
                    tableRow = sectionTable.insertRow();
                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[0]));

                    tableCell = tableRow.insertCell();
                    tableCell.appendChild(document.createTextNode(value[1]));
                });

                sectionDiv.appendChild(sectionTable);
                summaryDiv.appendChild(sectionDiv);
            }
        } else {
            html.replaceContent(
                document.getElementById('logs-summary'),
                createErrorDiv('No logs summary data.'));
        }
    }

    function getLogs() {
        var deferred,
            data;
        data = {
            job: jobName,
            kernel: kernelName
        };
        deferred = r.get('/_ajax/job/logs', data);
        $.when(deferred)
            .fail(e.error, getLogsFail)
            .done(getLogsDone);
    }

    function getJob() {
        var deferred,
            data;
        data = {
            job: jobName,
            kernel: kernelName
        };
        deferred = r.get('/_ajax/job', data);
        $.when(deferred)
            .fail(e.error, getJobFail)
            .done(getJobDone, getBuilds);
    }

    function registerEvents() {
        window.addEventListener('beforeunload', function() {
            var pageState,
                panelState,
                session;

            panelState = {};
            session = new ws.Session('build-' + jobName + '-' + kernelName);

            [].forEach
                .call(
                    document.querySelectorAll('[id^="panel-defconf"]'),
                    function(element) {
                        panelState['#' + element.id] = [
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
                });

            [].forEach
                .call(
                    document.querySelectorAll('[id^="collapse-defconf"]'),
                    function(element) {
                        panelState['#' + element.id] = [
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
                });

            pageState = {
                '.df-success': {
                    type: 'attr',
                    name: 'style',
                    value: html.attrBySelector('.df-success', 'style')
                },
                '.df-failed': {
                    type: 'attr',
                    name: 'style',
                    value: html.attrBySelector('.df-failed', 'style')
                },
                '.df-unknown': {
                    type: 'attr',
                    name: 'style',
                    value: html.attrBySelector('.df-unknown', 'style')
                },
                '#all-btn': {
                    type: 'class',
                    name: 'class',
                    value: html.attrById('all-btn', 'class')
                },
                '#success-btn': {
                    type: 'class',
                    name: 'class',
                    value: html.attrById('success-btn', 'class')
                },
                '#fail-btn': {
                    type: 'class',
                    name: 'class',
                    value: html.attrById('fail-btn', 'class')
                },
                '#unknown-btn': {
                    type: 'class',
                    name: 'class',
                    value: html.attrById('unknown-btn', 'class')
                }
            };

            session.objects = b.collectObjects([panelState, pageState]);
            ws.save(session);
        });
    }

    document.getElementById('li-build').setAttribute('class', 'active');
    init();

    [].forEach
        .call(
            document.querySelectorAll('.btn-group > .btn'), function(btn) {
                btn.addEventListener('click', function() {
                    [].forEach
                        .call(btn.parentElement.children, function(element) {
                            if (element === btn) {
                                html.addClass(element, 'active');
                            } else {
                                html.removeClass(element, 'active');
                            }
                        });
                });
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

    getJob();
    getLogs();
    registerEvents();
});
