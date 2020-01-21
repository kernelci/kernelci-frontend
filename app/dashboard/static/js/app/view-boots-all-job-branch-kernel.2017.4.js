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
    'utils/request',
    'utils/error',
    'utils/urls',
    'charts/passpie',
    'components/boot/unique',
    'utils/storage',
    'utils/session',
    'utils/html',
    'utils/filter',
    'components/boot/view',
    'utils/date',
    'sprintf'
], function(
        $,
        init,
        format,
        request,
        e,
        urls,
        chart,
        unique,
        storage, session, html, filter, bootView) {
    'use strict';
    var gFileServer;
    var gJob;
    var gKernel;
    var gResultFilter;
    var gSearchFilter;
    var gSessionStorage;
    var gStorageName;
    var gBranch;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    function uniqueCountFail() {
       html.replaceByClassHTML('unique-values', '&infin;');
    }

    function getRegressions() {
        require(['app/view-boots-regressions'], function(regr) {
            regr.get(gJob, gKernel);
        });

        /* Once clicked, remove the listener since we don't want to reload the
           data each time. */
        document
            .getElementById('regressions-tab')
            .removeEventListener('click', getRegressions);
    }

    function createOtherCount(totals) {
        var archStr;
        var boardStr;
        var defconfigStr;
        var docFrag;
        var smallNode;
        var socStr;
        var tooltipNode;

        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        html.addClass(tooltipNode, 'default-cursor');
        tooltipNode.setAttribute(
            'title', 'Total unique architectures, boards, SoCs and defconfigs');

        smallNode = tooltipNode.appendChild(document.createElement('small'));
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

        return docFrag;
    }

    function createLabBootCount(total, pass, fail, unknown) {
        var docFrag;
        var smallNode;
        var spanNode;
        var str;
        var tooltipNode;

        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        html.addClass(tooltipNode, 'default-cursor');
        str = 'Total, passed, failed and unknown boot reports count&nbsp;';
        str += 'for this lab';
        tooltipNode.setAttribute('title', str);

        smallNode = tooltipNode.appendChild(document.createElement('small'));
        smallNode.appendChild(document.createTextNode('('));
        smallNode.appendChild(
            document.createTextNode(format.number(total)));
        smallNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'green-font';
        spanNode.appendChild(document.createTextNode(format.number(pass)));

        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'red-font';
        spanNode.appendChild(document.createTextNode(format.number(fail)));

        smallNode.insertAdjacentHTML('beforeend', '&nbsp;/&nbsp;');

        spanNode = smallNode.appendChild(document.createElement('span'));
        spanNode.className = 'yellow-font';
        spanNode.appendChild(
            document.createTextNode(format.number(unknown)));

        smallNode.appendChild(document.createTextNode(')'));

        return docFrag;
    }

    function uniqueCountDone(builds, distincts) {
        var failCount;
        var lab;
        var labStatus;
        var localLab;
        var passCount;
        var tooltipNode;
        var totalBuilds;
        var totalCount;
        var uniqueLab;
        var uniqueTotal;
        var unknownCount;

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
        var results;

        if (response.count > 0) {
            results = response.result[0];

            setTimeout(function() {
                deferred = request.get(
                    '/_ajax/count/build',
                    {job: results.job, kernel: results.kernel});

                $.when(deferred, unique.countD(response))
                    .fail(e.error, uniqueCountFail)
                    .done(uniqueCountDone);
            }, 25);
        } else {
            html.replaceByClassTxt('unique-values', '?');
        }
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

    function getBootDoneChart(response) {
        chart.bootpie({
            element: 'boot-chart',
            response: response,
            size: {
                height: 110,
                width: 110
            },
            radius: {inner: -12.5, outer: 0}
        });
    }

    function getBootsFailed() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var bootPanel;
        var failButton;
        var results;

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

    function getBoot(response) {
        var deferred;
        var results;

        results = response.result;
        if (results.length > 0) {
            results = results[0];

            deferred = request.get(
                '/_ajax/boot',
                {
                    job: results.job,
                    git_branch: results.git_branch,
                    kernel: results.kernel,
                    sort: ['board', 'defconfig_full', 'arch'],
                    sort_order: 1
                }
            );

            $.when(deferred)
                .fail(e.error, getBootsFailed)
                .done(getBootsDone, getBootDoneChart, getBootDoneUnique);
        } else {
            getBootsFailed();
        }
    }

    function getJobFailed() {
        html.replaceByClassHTML('loading-content', '&infin;');
    }

    function getJobDone(response) {
        var aNode;
        var createdOn;
        var domNode;
        var gitBranch;
        var gitCommit;
        var gitURL;
        var gitURLs;
        var job;
        var kernel;
        var results;
        var spanNode;
        var node;
        var docFrag;
        var str;
        var tooltipNode;

        results = response.result;
        if (results.length === 0) {
            html.replaceByClassTxt('loading-content', '?');
        } else {
            // Enable the regressions tab now that we have the "kernel" value.
            html.removeClass(
                document.getElementById('regressions-tab'), 'disabled');

            results = results[0];

            // Reset the external kernel variable to the correct value.
            job = results.job;
            gKernel = kernel = results.kernel;
            createdOn = new Date(results.created_on.$date);
            gitBranch = results.git_branch;
            gitCommit = results.git_commit;
            gitURL = results.git_url;

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // The kernel name in the title.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(document.createTextNode(kernel));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
            node = spanNode.appendChild(document.createElement('small'));
            str = '(';
            str += gitBranch;
            str += ')';
            node.appendChild(document.createTextNode(str));
            html.replaceContent(
                document.getElementById('kernel-title'), docFrag);

            // Tree.
            docFrag = document.createDocumentFragment();
            domNode = docFrag.appendChild(document.createElement('div'));
            tooltipNode = html.tooltip();
            str = 'Boot reports for tree&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);
            
            aNode = document.createElement('a');
            str = '/boot/all/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(document.createTextNode(job));
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            str = 'Details for tree&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = document.createElement('a');
            str = '/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.tree());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Git branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(gitBranch));

            // Git describe.
            docFrag = document.createDocumentFragment();
            domNode = docFrag.appendChild(document.createElement('div'));
            domNode.appendChild(document.createTextNode(kernel));
            domNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            str = 'Build reports for&nbsp;';
            str += job;
            str += '&nbsp;&ndash;&nbsp;';
            str += kernel;
            str += '&nbsp;(';
            str += gitBranch;
            str += ')';
            tooltipNode.setAttribute('title', str);

            aNode = document.createElement('a');
            str = '/build/';
            str += job;
            str += '/branch/';
            str += gitBranch;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.build());
            tooltipNode.appendChild(aNode);

            domNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

            // Git URL.
            if (gitURLs[0]) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
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
            html.replaceContent(document.getElementById('git-url'), docFrag);

            // Git commit.
            if (gitURLs[1]) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
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
            html.replaceContent(document.getElementById('git-commit'), docFrag);

            // Date.
            docFrag = document.createDocumentFragment();
            domNode = docFrag.appendChild(document.createElement('time'));
            domNode.setAttribute('datetime', createdOn.toISOString());
            domNode.appendChild(
                document.createTextNode(createdOn.toCustomISODate()));
            html.replaceContent(
                document.getElementById('job-date'), docFrag);
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

        $.when(request.get('/_ajax/job', data))
            .fail(e.error, getJobFailed)
            .done(getJobDone, getBoot);
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
                document.querySelectorAll('[id^="panel-boot"]'),
                _saveElementState);

            Array.prototype.forEach.call(
                document.querySelectorAll('[id^="collapse-boot"]'),
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

    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
        if (gKernel === 'None' || gKernel === 'null') {
            gKernel = null;
        }
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    gStorageName = 'boot-';
    gStorageName += gJob;
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

    setTimeout(registerEvents, 25);
    setTimeout(getJob.bind(null, gJob, gBranch, gKernel), 10);

    // Set the click event on the regressions tab now, so that we have
    // the kernel value.
    document
        .getElementById('regressions-tab')
        .addEventListener('click', getRegressions);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);

    setTimeout(function() {
        var location = document.location.toString();
        if (location.match('#')) {
            location = location.split('#')[1];

            if (location === 'regressions') {
                document.getElementById('regressions-tab').click();
                $(document.getElementById('regressions-a')).tab('show');
                window.scrollTo(0, 0);
            }
        }
    }, 25);
});
