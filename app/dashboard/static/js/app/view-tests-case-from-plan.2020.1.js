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
    var gJob;
    var gPlan;
    var gKernel;
    var gLogMessage;
    var gResultFilter;
    var gSessionStorage;
    var gStorageName;

    gLogMessage = 'Shown log messages have been limited. ';
    gLogMessage += 'Please refer to each single build for more info.';

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 15);

    function getTestCasesFail() {
        html.replaceContent(
            document.getElementById('accordion-container'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassHTML('loading-content', '&infin;');
    }

    function getTestCasesDone(response) {
        
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

    function getTestCases(job, branch, kernel) {
        var data;
        
        data = {
            aggregate: 'name',
            job: gJob,
            plan: gPlan,
            git_branch: gBranch,
            kernel: gKernel,
            parent_id: 'null',
            sort: 'name',
        };

        $.when(r.get('/_ajax/test/case', data))
            .fail(e.error, getTestCasesFail)
            .done(getTestCasesDone);
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
    if (document.getElementById('job-name') !== null) {
        gJob = document.getElementById('job-name').value;
    }
    if (document.getElementById('branch-name') !== null) {
        gBranch = document.getElementById('branch-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernel = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('plan-name') !== null) {
        gPlan = document.getElementById('plan-name').value;
    }

    gStorageName = 'build-';
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

    setTimeout(getTestCases.bind(null, gPlan, gBranch, gKernel), 10);
    setTimeout(registerEvents, 25);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
