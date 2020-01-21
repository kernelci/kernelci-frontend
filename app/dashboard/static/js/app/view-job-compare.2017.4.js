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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/urls',
    'charts/passpie',
    'compare/jobdiff',
    'utils/html',
    'tables/job'
], function($, init, e, r, table, urls, pie, matrix, html, jobt) {
    'use strict';
    var gCompareId,
        gComparedTable;

    document.getElementById('li-compare').setAttribute('class', 'active');

    // Calculate total diff between the baseline and what is being compared
    // against.
    // Return a string with the total from the compared one and a diff number.
    function calculateTotalDiff(baseline, compared) {
        var display;
        var totalDiff;

        totalDiff = compared - baseline;
        if (totalDiff === 0) {
            display = compared + '&nbsp;(&#177;0)';
        } else if (totalDiff > 0) {
            display = compared + '&nbsp;(+' + totalDiff + ')';
        } else {
            display = compared + '&nbsp;(' + totalDiff + ')';
        }

        return display;
    }

    function setupCompareToTable(comparedData, baseline) {
        var columns;
        var dom;
        var rowURL;

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type, object) {
            return jobt.renderDetails(
                '/build/' + data + '/kernel/' + object.kernel + '/', type);
        }

        function _renderTotal(data, type) {
            var rendered;

            rendered = data;
            if (type === 'display' || type === 'filter') {
                rendered = calculateTotalDiff(baseline.total_builds, data);
            }
            return rendered;
        }

        function _renderCommit(data, type, object) {
            var aNode;
            var rendered;
            var textNode;
            var tooltipNode;
            var gitURL;

            rendered = data;
            if (type === 'display') {
                gitURL = urls.translateCommit(object.git_url, data);
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', data);

                if (gitURL[1] !== null) {
                    aNode = document.createElement('a');
                    aNode.setAttribute('href', gitURL[1]);

                    textNode = document.createTextNode(data);
                    aNode.appendChild(textNode);

                    tooltipNode.appendChild(aNode);
                } else {
                    textNode = document.createTextNode(data);
                    tooltipNode.appendChild(textNode);
                }

                rendered = tooltipNode.outerHTML;
                // Remove the nodes.
                textNode.remove();
                if (aNode) {
                    aNode.remove();
                }
                tooltipNode.remove();
            }

            return rendered;
        }

        function _renderTree(data, type) {
            var href = '/job/';
            href += data;
            href += '/';
            return jobt.renderTree(data, type, href);
        }

        dom = '<"row"' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>';
        rowURL = '/build/%(job)s/kernel/%(kernel)s/';

        columns = [
            {
                data: 'job',
                title: 'Tree',
                type: 'string',
                className: 'tree-column',
                render: _renderTree
            },
            {
                data: 'git_branch',
                title: 'Branch',
                type: 'string',
                className: 'branch-column'
            },
            {
                data: 'kernel',
                title: 'Kernel',
                type: 'string',
                className: 'kernel-column',
                render: jobt.renderKernel
            },
            {
                data: 'git_commit',
                title: 'Commit',
                type: 'string',
                render: _renderCommit
            },
            {
                data: 'total_builds',
                title: 'Total Builds',
                type: 'string',
                className: 'pull-center',
                render: _renderTotal
            },
            {
                data: 'created_on',
                title: 'Date',
                type: 'date',
                className: 'date-column pull-center',
                render: jobt.renderDate
            },
            {
                data: 'job',
                title: '',
                type: 'string',
                orderable: false,
                searchable: false,
                className: 'pull-center',
                render: _renderDetails
            }
        ];

        gComparedTable
            .dom(dom)
            .data(comparedData)
            .columns(columns)
            .order([5, 'desc'])
            .rowURL(rowURL)
            .rowURLElements(['job', 'kernel'])
            .draw();
    }

    function setupBaselineData(baseline) {
        var aNode;
        var baseGitCommit;
        var baseGitUrl;
        var baseJob;
        var baseKernel;
        var baseTotalBuilds;
        var gitURLs;
        var spanNode;
        var tooltipNode;

        baseGitCommit = baseline.git_commit;
        baseGitUrl = baseline.git_url;
        baseTotalBuilds = parseInt(baseline.total_builds, 10);
        baseJob = baseline.job;
        baseKernel = baseline.kernel;

        gitURLs = urls.translateCommit(baseGitUrl, baseGitCommit);

        // Tree.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + baseJob);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + baseJob + '/');
        aNode.appendChild(document.createTextNode(baseJob));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Boot reports for tree&nbsp;' + baseJob);

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/job/' + baseJob + '/');
        aNode.appendChild(html.boot());

        tooltipNode.appendChild(aNode);

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-tree'), spanNode);

        // Git branch.
        html.replaceContent(
            document.getElementById('dd-branch'),
            document.createTextNode(baseline.git_branch));

        // Kernel.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Build details for&nbsp;' + baseJob +
            '&nbsp;&dash;&nbsp;' + baseKernel
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/build/' + baseJob + '/kernel/' + baseKernel + '/');
        aNode.appendChild(document.createTextNode(baseKernel));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + baseJob +
            '&nbsp;&dash;&nbsp;' + baseKernel
        );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + baseJob + '/kernel/' + baseKernel + '/');
        aNode.appendChild(html.boot());

        tooltipNode.appendChild(aNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        spanNode.appendChild(tooltipNode);

        html.replaceContent(document.getElementById('dd-kernel'), spanNode);

        // Git URL/commit.
        if (gitURLs[0] !== null) {
            aNode = document.createElement('a');
            aNode.setAttribute('href', gitURLs[0]);
            aNode.appendChild(document.createTextNode(baseGitUrl));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            html.replaceContent(
                document.getElementById('dd-url'), aNode);
        } else {
            if (baseGitUrl !== null) {
                html.replaceContent(
                    document.getElementById('dd-url'),
                    document.createTextNode(baseGitUrl));
            } else {
                html.replaceContent(
                    document.getElementById('dd-url'), html.nonavail());
            }
        }

        if (gitURLs[1] !== null) {
            aNode = document.createElement('a');
            aNode.setAttribute('href', gitURLs[1]);
            aNode.appendChild(document.createTextNode(baseGitCommit));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            html.replaceContent(
                document.getElementById('dd-commit'), aNode);
        } else {
            if (baseGitCommit !== null) {
                html.replaceContent(
                    document.getElementById('dd-commit'),
                    document.createTextNode(baseGitCommit));
            } else {
                html.replaceContent(
                    document.getElementById('dd-commit'),
                    html.nonavail());
            }
        }

        html.replaceContent(
            document.getElementById('dd-total'),
            document.createTextNode(baseTotalBuilds));

        html.replaceContent(
            document.getElementById('dd-date'),
            html.time(baseline.created_on));
    }

    function getJobCompareFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
        html.replaceContent(
            document.getElementById('summary-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getJobCompareDone(response) {
        var baseline;
        var comparedData;
        var deltaResult;
        var matrixData;
        var results;
        var titleNode;

        results = response.result;
        if (results.length > 0) {
            baseline = results[0].baseline;
            comparedData = results[0].compare_to;
            deltaResult = results[0].delta_result;

            titleNode = document.getElementById('body-title');
            titleNode.insertAdjacentHTML(
                'beforeend',
                'for &#171;' + baseline.job +
                '&#187;&nbsp;&dash;&nbsp;' + baseline.kernel
            );

            setupBaselineData(baseline);
            setupCompareToTable(comparedData, baseline);

            pie.buildpie({
                element: 'build-chart',
                response: [baseline.total_builds, baseline.build_counts],
                legend: true,
                countFunc: function(resp) {
                    return resp;
                }
            });

            if (deltaResult.length > 0) {
                matrixData = {
                    xdata: [baseline],
                    ydata: deltaResult
                };

                Array.prototype.push.apply(matrixData.xdata, comparedData);
                matrix.create('builds-matrix', matrixData);
            } else {
                html.replaceContent(
                    document.getElementById('builds-matrix'),
                    html.errorDiv('No differences to show.'));
            }
        } else {
            html.replaceByClassNode('loading-content', html.nonavail());
            html.replaceContent(
                document.getElementById('summary-table-div'),
                html.errorDiv('No data available.'));
            html.replaceContent(
                document.getElementById('builds-matrix'),
                html.errorDiv('No data available.'));
        }
    }

    function getJobCompare() {
        var deferred;

        if (gCompareId !== null) {
            gComparedTable = table({
                tableId: 'compared-against'
            });

            deferred = r.get('/_ajax/job/compare/' + gCompareId + '/', {});
            $.when(deferred)
                .fail(e.error, getJobCompareFail)
                .done(getJobCompareDone);
        } else {
            html.replaceByClassNode('loading-content', html.nonavail());
            html.replaceContent(
                document.getElementById('summary-table-div'),
                html.errorDiv('Error loading data.'));
            html.replaceContent(
                document.getElementById('builds-matrix'),
                html.errorDiv('Error loading data.'));
            e.customError(
                400, 'Missing job comparison ID value: please specify one.');
        }
    }

    if (document.getElementById('compare-id') !== null) {
        gCompareId = document.getElementById('compare-id').value;
    }

    getJobCompare();

    init.hotkeys();
    init.tooltip();
});
