/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/html',
    'utils/boot',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/show-hide-btns',
    'utils/storage',
    'utils/session',
    'charts/passpie',
    'utils/unique-count',
    'utils/date',
    'sprintf'
], function(
        $,
        init,
        base,
        html,
        boot, error, request, urls, buttons, storage, session, chart, unique) {
    'use strict';
    var gFileServer,
        gJob,
        gKernel,
        gSearchFilter,
        gSessionStorage,
        gSoc;

    document.getElementById('li-soc').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    function loadSavedSession() {
        var isLoaded;

        isLoaded = false;
        gSessionStorage.load();

        if (gSessionStorage.objects) {
            isLoaded = session.load(gSessionStorage.objects);
        }

        return isLoaded;
    }

    function showHideBind(element) {
        element.addEventListener('click', buttons.showHideElements, true);
    }

    function labBind(element) {
        element.addEventListener('click', buttons.showHideLab, true);
    }

    function bindDetailButtons() {
        [].forEach.call(
            document.getElementsByClassName('click-btn'), showHideBind);
    }

    function bindLabButtons() {
        [].forEach.call(
            document.getElementsByClassName('lab-click-btn'), labBind);
    }

    function uniqueCountFail() {
        html.replaceByClassHTML('unique-values', '&infin;');
    }

    function createOtherCount(totals) {
        var archStr,
            boardStr,
            defconfigStr,
            smallNode,
            socStr,
            tooltipNode;

        tooltipNode = html.tooltip();
        html.addClass(tooltipNode, 'default-cursor');
        tooltipNode.setAttribute(
            'title', 'Total unique architectures, boards, SoCs and defconfigs');

        smallNode = document.createElement('small');
        smallNode.appendChild(document.createTextNode('('));

        if (totals.hasOwnProperty('arch')) {
            if (totals.arch === 1) {
                archStr = sprintf(
                    '%s architecture', totals.arch);
            } else {
                archStr = sprintf(
                    '%s architectures', totals.arch);
            }

            smallNode.appendChild(document.createTextNode(archStr));
            smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');
        }

        if (totals.hasOwnProperty('board')) {
            if (totals.board === 1) {
                boardStr = sprintf(
                    '%s board', totals.board);
            } else {
                boardStr = sprintf(
                    '%s boards', totals.board);
            }

            smallNode.appendChild(document.createTextNode(boardStr));
            smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');
        }

        if (totals.hasOwnProperty('soc')) {
            if (totals.soc === 1) {
                socStr = sprintf('%s SoC', totals.soc);
            } else {
                socStr = sprintf('%s SoCs', totals.soc);
            }

            smallNode.appendChild(document.createTextNode(socStr));
            smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');
        }

        if (totals.hasOwnProperty('defconfig')) {
            if (totals.defconfig === 1) {
                defconfigStr = sprintf(
                    '%s defconfig', totals.defconfig);
            } else {
                defconfigStr = sprintf(
                    '%s defconfigs', totals.defconfig);
            }

            smallNode.appendChild(document.createTextNode(defconfigStr));
        }

        smallNode.appendChild(document.createTextNode(')'));
        tooltipNode.appendChild(smallNode);

        return tooltipNode;
    }

    function createLabBootCount(total, pass, fail, unknown) {
        var smallNode,
            spanNode,
            tooltipNode;

        tooltipNode = html.tooltip();
        html.addClass(tooltipNode, 'default-cursor');
        tooltipNode.setAttribute(
            'title',
            'Total, passed, failed and unknown boot reports count ' +
            'for this lab'
        );

        smallNode = document.createElement('small');
        smallNode.appendChild(document.createTextNode('('));
        smallNode.appendChild(
            document.createTextNode(base.formatNumber(total)));
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'green-font';
        spanNode.appendChild(document.createTextNode(base.formatNumber(pass)));

        smallNode.appendChild(spanNode);
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'red-font';
        spanNode.appendChild(document.createTextNode(base.formatNumber(fail)));

        smallNode.appendChild(spanNode);
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'yellow-font';
        spanNode.appendChild(
            document.createTextNode(base.formatNumber(unknown)));

        smallNode.appendChild(spanNode);
        smallNode.appendChild(document.createTextNode(')'));

        tooltipNode.appendChild(smallNode);

        return tooltipNode;
    }

    function uniqueCountDone(builds, distincts) {
        var failCount,
            lab,
            labStatus,
            localLab,
            passCount,
            tooltipNode,
            totalBuilds,
            totalCount,
            uniqueLab,
            uniqueTotal,
            unknownCount;

        totalBuilds = builds[0].result[0].count;
        uniqueTotal = distincts[0];
        uniqueLab = distincts[1];

        if (Object.getOwnPropertyNames(uniqueTotal.totals).length > 0) {
            if (uniqueTotal.totals.board > 0) {
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', 'Total number of unique boards tested');
                tooltipNode.appendChild(
                    document.createTextNode(
                        base.formatNumber(uniqueTotal.totals.board)));
                html.replaceContent(
                    document.getElementById('unique-boards'), tooltipNode);
            } else {
                html.replaceContent(
                    document.getElementById('unique-boards'), html.nonavail());
            }

            if (uniqueTotal.totals.soc > 0) {
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', 'Total number of unique SoC families tested');
                tooltipNode.appendChild(
                    document.createTextNode(
                        base.formatNumber(uniqueTotal.totals.soc)));
                html.replaceContent(
                    document.getElementById('unique-socs'), tooltipNode);
            } else {
                html.replaceContent(
                    document.getElementById('unique-socs'), html.nonavail());
            }

            if (uniqueTotal.totals.defconfig > 0) {
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', 'Total number of unique defconfigs tested');

                if (totalBuilds > 0) {
                    tooltipNode.appendChild(
                        document.createTextNode(
                            sprintf(
                                '%s out of %s',
                                base.formatNumber(
                                    uniqueTotal.totals.defconfig),
                                base.formatNumber(totalBuilds)))
                    );
                } else {
                    tooltipNode.appendChild(
                        document.createTextNode(
                            base.formatNumber(uniqueTotal.totals.defconfig)));
                }

                html.replaceContent(
                    document.getElementById('unique-defconfigs'), tooltipNode);
            } else {
                html.replaceContent(
                    document.getElementById('unique-defconfigs'),
                    html.nonavail());
            }
        } else {
            html.replaceByClassNode('unique-values', html.nonavail());
        }

        if (Object.getOwnPropertyNames(uniqueLab).length > 0) {
            for (lab in uniqueLab) {
                if (uniqueLab.hasOwnProperty(lab)) {
                    localLab = uniqueLab[lab];
                    labStatus = localLab.status;

                    if (labStatus.hasOwnProperty('fail')) {
                        failCount = labStatus.fail;
                    } else {
                        failCount = 0;
                    }

                    if (labStatus.hasOwnProperty('pass')) {
                        passCount = labStatus.pass;
                    } else {
                        passCount = 0;
                    }

                    if (labStatus.hasOwnProperty('unknown')) {
                        unknownCount = labStatus.unknown;
                    } else {
                        unknownCount = 0;
                    }

                    totalCount = passCount + failCount + unknownCount;

                    html.replaceContent(
                        document.getElementById('boot-count-' + lab),
                        createLabBootCount(
                            totalCount, passCount, failCount, unknownCount)
                    );

                    html.replaceContent(
                        document.getElementById('unique-count-' + lab),
                        createOtherCount(localLab.totals));
                }
            }
        }
    }

    function getBootDoneUnique(response) {
        var deferred;

        if (response.count > 0) {
            deferred = request.get(
                '/_ajax/count/build', {
                    job: gJob,
                    kernel: gKernel
                });

            $.when(deferred, unique.countUniqueBootD(response))
                .fail(error.error, uniqueCountFail)
                .done(uniqueCountDone);
        } else {
            html.replaceByClassTxt('unique-values', '?');
        }
    }

    function getBootsFailed() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassHTML('loading-content', '&infin;');
    }

    function getBootsDone(response) {
        var aNode,
            accordionElement,
            allLabs,
            arch,
            board,
            bootTime,
            colNode,
            collapseBodyNode,
            collapseId,
            collapseNode,
            ddNode,
            defconfigFull,
            divNode,
            dlNode,
            docId,
            dtNode,
            failButton,
            filterClass,
            hNode,
            hasFail,
            hasSuccess,
            hasUnknown,
            headingNode,
            htmlLog,
            kernelImage,
            kernelImageSize,
            labName,
            otherDivNode,
            panelNode,
            pathURI,
            results,
            rowNode,
            ruleNode,
            serverResource,
            serverURI,
            serverURL,
            smallNode,
            spanNode,
            statusNode,
            tooltipNode,
            translatedURI,
            txtLog,
            warnings;

        allLabs = {};
        hasFail = false;
        hasSuccess = false;
        hasUnknown = false;
        accordionElement = document.getElementById('accordion-container');

        results = response.result;

        // Internal function to parse the results and create the DOM elements.
        function _parseBootResult(result, index) {
            docId = result._id.$oid;
            serverURL = result.file_server_url;
            serverResource = result.file_server_resource;
            defconfigFull = result.defconfig_full;
            arch = result.arch;
            labName = result.lab_name;
            board = result.board;
            warnings = result.warnings;
            txtLog = result.boot_log;
            htmlLog = result.boot_log_html;
            kernelImage = result.kernel_image;
            kernelImageSize = result.kernel_image_size;

            if (!serverURL) {
                serverURL = gFileServer;
            }

            translatedURI = urls.translateServerURL(
                serverURL,
                serverResource, [gJob, gKernel, arch + '-' + defconfigFull]);

            serverURI = translatedURI[0];
            pathURI = translatedURI[1];

            switch (result.status) {
                case 'FAIL':
                    hasFail = true;
                    statusNode = html.fail();
                    filterClass = 'df-failed';
                    break;
                case 'PASS':
                    hasSuccess = true;
                    statusNode = html.success();
                    filterClass = 'df-success';
                    break;
                default:
                    hasUnknown = true;
                    statusNode = html.unknown();
                    filterClass = 'df-unknown';
                    break;
            }
            html.addClass(statusNode, 'pull-right');

            panelNode = document.createElement('div');
            panelNode.className = 'panel panel-default ' + filterClass;

            collapseId = 'collapse-boot-' + index;

            headingNode = document.createElement('div');
            headingNode.className = 'panel-heading collapsed';
            headingNode.id = 'panel-boot-' + index;
            headingNode.setAttribute('aria-expanded', false);
            headingNode.setAttribute('data-parent', '#accordion-' + labName);
            headingNode.setAttribute('data-toggle', 'collapse');
            headingNode.setAttribute('data-target', '#' + collapseId);
            headingNode.setAttribute('aria-controls', '#' + collapseId);

            hNode = document.createElement('h4');
            hNode.className = 'panel-title';

            aNode = document.createElement('a');
            aNode.setAttribute('data-parent', '#accordion-' + labName);
            aNode.setAttribute('data-toggle', 'collapse');
            aNode.setAttribute('href', '#' + collapseId);
            aNode.setAttribute('aria-controls', '#' + collapseId);
            aNode.appendChild(document.createTextNode(board));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');

            smallNode = document.createElement('small');
            smallNode.appendChild(document.createTextNode(defconfigFull));

            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(smallNode);
            hNode.appendChild(aNode);

            if (arch) {
                spanNode = document.createElement('span');
                spanNode.className = 'arch-label';
                spanNode.appendChild(document.createTextNode(arch));
                hNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
                hNode.appendChild(spanNode);
            }

            hNode.appendChild(statusNode);
            headingNode.appendChild(hNode);
            panelNode.appendChild(headingNode);

            collapseNode = document.createElement('div');
            collapseNode.id = collapseId;
            collapseNode.className = 'panel-collapse collapse';
            collapseNode.setAttribute('aria-expanded', false);

            collapseBodyNode = document.createElement('div');
            collapseBodyNode.className = 'panel-body';

            rowNode = document.createElement('div');
            rowNode.className = 'row';

            colNode = document.createElement('div');
            colNode.className = 'col-xs-6 col-sm-6 col-md-6 col-lg-6';

            dlNode = document.createElement('dl');
            dlNode.className = 'dl-horizontal';

            // Endianness.
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Endianness'));
            ddNode = document.createElement('dd');
            if (result.endian) {
                ddNode.appendChild(document.createTextNode(result.endian));
            } else {
                ddNode.appendChild(html.nonavail());
            }

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);

            // Kernel image.
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Kernel image'));
            ddNode = document.createElement('dd');
            if (kernelImage) {
                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href',
                    serverURI
                        .path(pathURI + '/' + kernelImage)
                        .normalizePath().href()
                );
                aNode.appendChild(
                    document.createTextNode(kernelImage));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
                ddNode.appendChild(aNode);

                if (kernelImageSize) {
                    ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    smallNode = document.createElement('small');
                    smallNode.appendChild(
                        document.createTextNode(
                            base.bytesToHuman(kernelImageSize)));
                    ddNode.appendChild(smallNode);
                }
            } else {
                ddNode.appendChild(html.nonavail());
            }

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);

            colNode.appendChild(dlNode);
            rowNode.appendChild(colNode);

            colNode = document.createElement('div');
            colNode.className = 'col-xs-6 col-sm-6 col-md-6 col-lg-6';

            dlNode = document.createElement('dl');
            dlNode.className = 'dl-horizontal';

            // Warnings.
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Warnings'));
            ddNode = document.createElement('dd');
            if (warnings !== null && warnings !== undefined) {
                ddNode.appendChild(
                    document.createTextNode(
                        base.formatNumber(parseInt(warnings, 10))));
            } else {
                ddNode.appendChild(document.createTextNode('0'));
            }

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);

            // Boot time.
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Boot time'));
            ddNode = document.createElement('dd');

            if (result.time !== null || result.time !== undefined) {
                bootTime = new Date(result.time.$date);
                ddNode.appendChild(
                    document.createTextNode(bootTime.toCustomTime()));
            } else {
                ddNode.appendChild(html.nonavail());
            }

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);

            // Boot logs.
            if (txtLog || htmlLog) {
                dtNode = document.createElement('dt');
                dtNode.appendChild(document.createTextNode('Boot log'));

                ddNode = document.createElement('dd');
                ddNode.appendChild(
                    boot.createBootLog(
                        txtLog, htmlLog, labName, serverURI, pathURI));

                dlNode.appendChild(dtNode);
                dlNode.appendChild(ddNode);
            }

            colNode.appendChild(dlNode);
            rowNode.appendChild(colNode);

            // More info link.
            colNode = document.createElement('div');
            colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

            divNode = document.createElement('div');
            divNode.className = 'pull-center';

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Boot report details');
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                '/boot/' + board + '/job/' + gJob + '/kernel/' + gKernel +
                '/defconfig/' + defconfigFull + '/lab/' + labName +
                '/?_id=' + docId
            );
            aNode.appendChild(document.createTextNode('More info'));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);
            divNode.appendChild(tooltipNode);

            colNode.appendChild(divNode);
            rowNode.appendChild(colNode);

            collapseBodyNode.appendChild(rowNode);
            collapseNode.appendChild(collapseBodyNode);
            panelNode.appendChild(collapseNode);

            if (allLabs.hasOwnProperty(labName)) {
                allLabs[labName].push(panelNode);
            } else {
                allLabs[labName] = [];
                allLabs[labName].push(panelNode);
            }
        } // End _parseBootResult.

        function _createLabSection(lab) {
            divNode = document.createElement('div');
            divNode.id = lab;

            otherDivNode = document.createElement('div');
            otherDivNode.className = 'other-header';

            hNode = document.createElement('h4');
            hNode.insertAdjacentHTML(
                'beforeend', sprintf('Lab &#171;%s&#187;', lab));

            otherDivNode.appendChild(hNode);
            otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

            spanNode = document.createElement('span');
            spanNode.id = 'boot-count-' + lab;

            otherDivNode.appendChild(spanNode);
            otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

            spanNode = document.createElement('span');
            spanNode.id = 'unique-count-' + lab;

            otherDivNode.appendChild(spanNode);
            otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

            spanNode = document.createElement('span');
            spanNode.className = 'pull-right';
            spanNode.id = 'view-eye-' + lab;
            spanNode.insertAdjacentHTML(
                'beforeend', buttons.createShowHideLabBtn(lab, 'hide'));

            otherDivNode.appendChild(spanNode);

            ruleNode = document.createElement('hr');
            ruleNode.className = 'blurred subheader';

            otherDivNode.appendChild(ruleNode);
            divNode.appendChild(otherDivNode);

            otherDivNode = document.createElement('div');
            otherDivNode.className = 'pull-center';
            otherDivNode.id = 'view-' + lab;

            divNode.appendChild(otherDivNode);

            otherDivNode = document.createElement('div');
            otherDivNode.className = 'panel-group';
            otherDivNode.id = 'accordion-' + lab;

            allLabs[lab].forEach(function(node) {
                otherDivNode.appendChild(node);
            });

            divNode.appendChild(otherDivNode);
            accordionElement.appendChild(divNode);
        } // End _createLabSection.

        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                html.errorDiv('No data found.'));
        } else {
            // Parse the results.
            results.forEach(_parseBootResult);
            // Clean up all elements.
            html.removeChildren(accordionElement);
            // Then add the new ones.
            Object.keys(allLabs).sort().forEach(_createLabSection);

            if (hasFail) {
                document
                    .getElementById('fail-btn')
                    .removeAttribute('disabled');
            }

            if (hasSuccess) {
                document
                    .getElementById('success-btn')
                    .removeAttribute('disabled');
            }

            if (hasUnknown) {
                document
                    .getElementById('unknown-btn')
                    .removeAttribute('disabled');
            }

            document.getElementById('all-btn').removeAttribute('disabled');

            // Bind buttons to the correct functions.
            bindDetailButtons();
            bindLabButtons();

            if (gSearchFilter && gSearchFilter.length > 0) {
                switch (gSearchFilter) {
                    case 'fail':
                        document.getElementById('#fail-cell').click();
                        break;
                    case 'success':
                        document.getElementById('#success-cell').click();
                        break;
                    case 'unknown':
                        document.getElementById('#unknown-cell').click();
                        break;
                }
            } else if (!loadSavedSession()) {
                if (hasFail) {
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

                    failButton = document.getElementById('fail-btn');
                    [].forEach.call(
                        failButton.parentElement.children, function(element) {
                            if (element === failButton) {
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

    function updateDetails(response) {
        var aNode,
            createdOn,
            domNode,
            gitBranch,
            gitCommit,
            gitURL,
            gitURLs,
            results,
            tooltipNode;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('loading-content', '?');
        } else {
            results = results[0];

            gitBranch = results.git_branch;
            gitCommit = results.git_commit;
            gitURL = results.git_url;
            createdOn = new Date(results.created_on.$date);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // SoC.
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', 'Details for SoC ' + gSoc);
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + gSoc + '/');
            aNode.appendChild(document.createTextNode(gSoc));
            tooltipNode.appendChild(aNode);

            html.replaceContent(document.getElementById('soc'), tooltipNode);

            // Tree.
            domNode = document.createElement('div');
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Details for SoC &#171;' + gSoc + '&#187; with tree ' + gJob);
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + gSoc + '/job/' + gJob + '/');
            aNode.appendChild(document.createTextNode(gJob));
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for tree &#171;' + gJob + '&#187;');
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/boot/all/job/' + gJob + '/');
            aNode.appendChild(html.boot());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Details for tree &#171;' + gJob + '&#187;');
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/job/' + gJob + '/');
            aNode.appendChild(html.tree());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(document.getElementById('tree'), domNode);

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(gitBranch));

            // Git describe.
            domNode = document.createElement('div');
            domNode.appendChild(document.createTextNode(gKernel));
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Boot reports for &#171;' + gJob + '&#187; - ' + gKernel);
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/boot/all/job/' + gJob + '/kernel/' + gKernel + '/');
            aNode.appendChild(html.boot());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title',
                'Build reports for &#171;' + gJob + '&#187; - ' + gKernel);
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href', '/build/' + gJob + '/kernel/' + gKernel);
            aNode.appendChild(html.build());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('git-describe'), domNode);

            // Git URL.
            if (gitURLs[0]) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
            } else {
                if (gitURL && gitURL !== undefined) {
                    aNode = document.createTextNode(gitURL);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-url'), aNode);

            // Git commit.
            if (gitURLs[1]) {
                aNode = document.createElement('a');
                aNode.setAttribute('href', gitURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
            } else {
                if (gitCommit && gitCommit !== null) {
                    aNode = document.createTextNode(gitCommit);
                } else {
                    aNode = html.nonavail();
                }
            }
            html.replaceContent(document.getElementById('git-commit'), aNode);

            // Date.
            domNode = document.createElement('time');
            domNode.setAttribute('datetime', createdOn.toISOString());
            domNode.appendChild(
                document.createTextNode(createdOn.toCustomISODate()));
            html.replaceContent(
                document.getElementById('job-date'), domNode);
        }
    }

    function getBootDoneChart(response) {
        chart.bootpie('boot-chart', response);
    }

    function getBoots() {
        var deferred;

        deferred = request.get(
            '/_ajax/boot',
            {
                field: [
                    '_id',
                    'arch',
                    'board',
                    'boot_log',
                    'boot_log_html',
                    'created_on',
                    'defconfig_full',
                    'endian',
                    'file_server_resource',
                    'file_server_url',
                    'git_branch',
                    'git_commit',
                    'git_url',
                    'job',
                    'kernel',
                    'kernel_image',
                    'lab_name',
                    'mach',
                    'time',
                    'status',
                    'warnings'
                ],
                mach: gSoc,
                job: gJob,
                kernel: gKernel
            }
        );

        $.when(deferred)
            .fail(error.error, getBootsFailed)
            .done(
                getBootsDone,
                getBootDoneChart,
                updateDetails,
                getBootDoneUnique
            );
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


            [].forEach.call(
                document.querySelectorAll('[id^="panel-boot-"]'),
                _saveElementState);

            [].forEach.call(
                document.querySelectorAll('[id^="collapse-boot-"]'),
                _saveElementState);

            gSessionStorage.addObjects(pageState).save();
        });
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('soc-name') !== null) {
        gSoc = document.getElementById('soc-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gSessionStorage = storage('soc-' + gSoc + '-' + gJob + '-' + gKernel);
    getBoots();
    registerEvents();

    [].forEach.call(
        document.querySelectorAll('.btn-group > .btn'),
        function(btn) {
            btn.addEventListener('click', function() {
                [].forEach.call(btn.parentElement.children, function(element) {
                    if (element === btn) {
                        html.addClass(element, 'active');
                    } else {
                        html.removeClass(element, 'active');
                    }
                });
            });
    });
});
