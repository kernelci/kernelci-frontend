/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/request',
    'utils/html',
    'utils/urls',
    'utils/table',
    'tables/boot',
    'compare/bootdiff'
], function($, init, request, html, urls, table, tboot, matrix) {
    'use strict';
    var gCompareId;
    var gComparedTable;

    document.getElementById('li-compare').setAttribute('class', 'active');

    function setupComparedTable(comparedData) {
        var columns;
        var dom;

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
            if (type === 'display' && data) {
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

        columns = [
            {
                data: 'board',
                title: 'Board',
                type: 'string',
                className: 'board-column'
            },
            {
                data: 'job',
                title: 'Tree',
                type: 'string',
                className: 'tree-column',
                render: tboot.renderTree
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
                render: tboot.renderKernel
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
                render: tboot.renderDate
            },
            {
                data: '_id',
                title: '',
                type: 'string',
                orderable: false,
                searchable: false,
                className: 'pull-center',
                render: tboot.renderDetails
            }
        ];

        gComparedTable
            .dom(dom)
            .data(comparedData)
            .columns(columns)
            .order([5, 'desc'])
            .rowURL('/boot/id/%(_id)s/')
            .rowURLElements(['_id'])
            .draw();
    }

    function getCompareFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function setupBaselineData(baseline) {
        var aNode;
        var baseBoard;
        var baseBoardInstance;
        var baseDefconfig;
        var baseGitCommit;
        var baseGitUrl;
        var baseJob;
        var baseKernel;
        var baseLab;
        var gitURLs;
        var spanNode;
        var tooltipNode;

        baseDefconfig = baseline.defconfig_full;
        baseGitCommit = baseline.git_commit;
        baseGitUrl = baseline.git_url;
        baseJob = baseline.job;
        baseKernel = baseline.kernel;
        baseBoard = baseline.board;
        baseLab = baseline.lab_name;
        baseBoardInstance = baseline.board_instance;

        gitURLs = urls.translateCommit(baseGitUrl, baseGitCommit);

        // Lab.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Boot reports for lab&nbsp' + baseLab);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/lab/' + baseLab + '/');
        aNode.appendChild(document.createTextNode(baseLab));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        html.replaceContent(
            document.getElementById('dd-lab-name'), tooltipNode);

        // Board.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Boot reports for board&nbsp;' + baseBoard);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/' + baseBoard + '/');
        aNode.appendChild(document.createTextNode(baseBoard));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        html.replaceContent(
            document.getElementById('dd-board'), tooltipNode);

        // Board instance.
        if (baseBoardInstance) {
            html.replaceContent(
                document.getElementById('dd-board-instance'),
                document.createTextNode(baseBoardInstance));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-instance'),
                html.nonavail());
        }

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
        if (baseline.git_branch) {
            html.replaceContent(
                document.getElementById('dd-branch'),
                document.createTextNode(baseline.git_branch));
        } else {
            html.replaceContent(
                document.getElementById('dd-branch'),
                html.nonavail());
        }

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
                '&#171;' + baseline.board + '&#187;' +
                '&nbsp;<small>(' + baseline.lab_name + ')</small>'
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

    function getBootCompare() {
        var deferred;

        deferred = request.get('/_ajax/boot/compare/' + gCompareId + '/', {});
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

    getBootCompare();

    init.hotkeys();
    init.tooltip();
});
