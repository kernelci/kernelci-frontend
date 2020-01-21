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
define([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/html',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/storage',
    'utils/session',
    'charts/passpie',
    'components/boot/unique',
    'utils/filter',
    'components/boot/view',
    'utils/date',
    'sprintf'
], function(
        $,
        init,
        format,
        html,
        error,
        request,
        urls,
        storage, session, chart, unique, filter, bootView) {
    'use strict';
    var gFileServer,
        gJob,
        gKernel,
        gResultFilter,
        gSearchFilter,
        gSessionStorage,
        gSoc;

    document.getElementById('li-soc').setAttribute('class', 'active');

    function loadSavedSession() {
        var isLoaded;

        isLoaded = false;
        gSessionStorage.load();

        if (gSessionStorage.objects) {
            isLoaded = session.load(gSessionStorage.objects);
        }

        return isLoaded;
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
            document.createTextNode(format.number(total)));
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'green-font';
        spanNode.appendChild(document.createTextNode(format.number(pass)));

        smallNode.appendChild(spanNode);
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'red-font';
        spanNode.appendChild(document.createTextNode(format.number(fail)));

        smallNode.appendChild(spanNode);
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'yellow-font';
        spanNode.appendChild(
            document.createTextNode(format.number(unknown)));

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
                        format.number(uniqueTotal.totals.board)));
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
                        format.number(uniqueTotal.totals.soc)));
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
                                format.number(
                                    uniqueTotal.totals.defconfig),
                                format.number(totalBuilds)))
                    );
                } else {
                    tooltipNode.appendChild(
                        document.createTextNode(
                            format.number(uniqueTotal.totals.defconfig)));
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

            $.when(deferred, unique.countD(response))
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
        var bootPanel,
            failButton,
            results;

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('accordion-container'),
                html.errorDiv('No data found.'));
        } else {
            bootPanel = bootView(results, gFileServer).draw();

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
                if (bootPanel.hasFail) {
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

                    failButton = document.getElementById('fail-btn');
                    Array.prototype.forEach.call(
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
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
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
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());
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
        chart.bootpie({
            element: 'boot-chart',
            response: response,
            legend: true
        });
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
                document.querySelectorAll('[id^="panel-boot-"]'),
                _saveElementState);

            Array.prototype.forEach.call(
                document.querySelectorAll('[id^="collapse-boot-"]'),
                _saveElementState);

            gSessionStorage.addObjects(pageState).save();
        });
    }

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
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

    gSessionStorage = storage('soc-' + gSoc + '-' + gJob + '-' + gKernel);
    gResultFilter = filter('data-filter');
    getBoots();
    registerEvents();

    init.hotkeys();
    init.tooltip();
});
