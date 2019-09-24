/*!
 * Copyright (C) Linaro Limited 2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
    'utils/request',
    'utils/html',
    'utils/urls',
    'utils/table',
    'tables/build',
    'compare/builddiff'
], function($, init, request, html, urls, table, buildt, matrix) {
    'use strict';
    var gCompareId;
    var gComparedTable;

    document.getElementById('li-compare').setAttribute('class', 'active');

    function setupComparedTable(comparedData) {
        var columns;
        var dom;
        var rowURL;

        /**
         * Wrapper to provide the href.
        **/
        function _renderKernel(data, type, object) {
            return buildt.renderKernel(
                data, type, '/job/' + object.job + '/kernel/' + data + '/');
        }

        /**
         * Wrapper to provide the href.
        **/
        function _renderDetails(data, type, object) {
            return buildt.renderDetails(
                '/build/id/' + object._id.$oid + '/', type);
        }

        /**
         * Wrapper to provide the href.
        **/
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

        dom = '<"row"' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>';
        rowURL = '/build/%(job)s/kernel/%(kernel)s/defconfig/%(defconfig_full)s/';

        columns = [
            {
                data: 'job',
                title: 'Tree',
                type: 'string',
                className: 'tree-column',
                render: buildt.renderTree
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
                render: _renderKernel
            },
            {
                data: 'git_commit',
                title: 'Commit',
                type: 'string',
                render: _renderCommit
            },
            {
                data: 'created_on',
                title: 'Date',
                type: 'date',
                className: 'date-column pull-center',
                render: buildt.renderDate
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
            .rowURLElements(['job', 'kernel', 'defconfig_full'])
            .draw();
    }

    function getCompareFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function setupBaselineData(baseline) {
        var aNode;
        var baseDefconfig;
        var baseGitCommit;
        var baseGitUrl;
        var baseJob;
        var baseKernel;
        var gitURLs;
        var spanNode;
        var tooltipNode;

        baseDefconfig = baseline.defconfig_full;
        baseGitCommit = baseline.git_commit;
        baseGitUrl = baseline.git_url;
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

        // Defconfig.
        spanNode = document.createElement('span');

        aNode = document.createElement('a');
        aNode.setAttribute('href', '/build/id/' + baseline._id.$oid + '/');
        aNode.appendChild(document.createTextNode(baseDefconfig));

        spanNode.appendChild(aNode);

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + baseJob +
                '&nbsp;&dash;&nbsp;' + baseKernel +
                '&nbsp;&dash;&nbsp;' + baseDefconfig
            );

        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/all/job/' + baseJob + '/kernel/' +
            baseKernel + '/defconfig/' + baseDefconfig + '/'
        );
        aNode.appendChild(html.boot());

        tooltipNode.appendChild(aNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-defconfig'), spanNode);

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

        // Date.
        html.replaceContent(
            document.getElementById('dd-date'),
            html.time(baseline.created_on));
    }

    function getCompareDone(response) {
        var baseline;
        var comparedData;
        var matrixData;
        var results;
        var titleNode;

        results = response.result;
        if (results.length > 0) {
            results = results[0];
            baseline = results.baseline;
            comparedData = results.compare_to;

            titleNode = document.getElementById('body-title');
            titleNode.insertAdjacentHTML(
                'beforeend',
                'for &#171;' + baseline.job +
                '&#187;&nbsp;&dash;&nbsp;' + baseline.kernel +
                '&nbsp;<small>(' + baseline.defconfig + ')</small>'
            );

            setupBaselineData(baseline);
            setupComparedTable(comparedData);

            matrixData = {xdata: [baseline]};
            Array.prototype.push.apply(matrixData.xdata, comparedData);
            matrix.create('diff-matrix', matrixData);
        } else {
            html.replaceByClassNode('loading-content', html.nonavail());
        }
    }

    function getBuildCompare() {
        var deferred;

        deferred = request.get('/_ajax/build/compare/' + gCompareId + '/', {});
        $.when(deferred)
            .fail(getCompareFail)
            .done(getCompareDone);
    }

    if (document.getElementById('compare-id') !== null) {
        gCompareId = document.getElementById('compare-id').value;
    }

    gComparedTable = table({
        tableId: 'compared-against'
    });

    getBuildCompare();

    init.hotkeys();
    init.tooltip();
});
