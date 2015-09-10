/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/urls',
    'charts/passpie'
], function($, b, e, i, r, t, u, chart) {
    'use strict';
    var compareId = null,
        comparedTable,
        nonAvail,
        tableDom;

    nonAvail = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>';

    tableDom = '<"row"' +
        '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>';

    function createHeadCellContent(job, kernel) {
        var str;

        str = job + ' - ' + kernel;
        if (str.length > 21) {
            str = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="' + str + '">' +
                '<div class="rotate">' + str.slice(0, 21) + '&hellip;' +
                '</div></span>';
        } else {
            str = '<div class="rotate">' + str + '</div>';
        }
        return str;
    }

    function createBuildsChart(total, otherCounts) {
        chart.buildpie(
            'build-chart', [total, otherCounts], function(response) {
            return response;
        });
    }

    function createDiffTable(tableId, baseline, compared, deltas) {
        var baseJob,
            baseKernel,
            comparedLen,
            deltaLen,
            tHead,
            tBody,
            buildS,
            tableS,
            idx,
            ydx,
            deltaStatus,
            deltaRes,
            deltaResData,
            defconfigFull,
            job,
            kernel,
            arch,
            status,
            buildLink,
            localCompData,
            allData = [],
            dataLen;

        // Hold baseline and all the other comparison jobs.
        allData.push(baseline);
        Array.prototype.push.apply(allData, compared);
        dataLen = allData.length;

        tHead = '<thead><tr><th>&nbsp;</th>';
        tBody = '<tbody>';
        tableS = '';

        comparedLen = compared.length;
        deltaLen = deltas.length;

        baseJob = baseline.job;
        baseKernel = baseline.kernel;

        tHead += '<th><div class="rotate-container">' +
            createHeadCellContent(baseJob, baseKernel) + '</div></th>';

        idx = 0;
        for (idx; idx < comparedLen; idx = idx + 1) {
            tHead += '<th><div class="rotate-container">' +
                createHeadCellContent(
                    compared[idx].job, compared[idx].kernel) +
                '</div></th>';
        }
        tHead += '</thead>';

        idx = 0;
        buildS = '';
        for (idx; idx < deltaLen; idx = idx + 1) {
            deltaRes = deltas[idx];
            deltaResData = deltaRes[0];
            defconfigFull = deltaResData[1];
            arch = deltaResData[2];

            buildS += '<tr class="compare-row">' +
                '<td class="compare-content"><div>' +
                defconfigFull + ' &dash; ' + arch + '</div></td>';

            ydx = 0;
            deltaStatus = deltaRes[1];
            for (ydx; ydx < dataLen; ydx = ydx + 1) {
                localCompData = allData[ydx];
                job = localCompData.job;
                kernel = localCompData.kernel;
                status = deltaStatus[ydx];

                buildS += '<td>';
                if (status !== null) {
                    buildLink = '/build/' + job +
                        '/kernel/' + kernel +
                        '/defconfig/' + defconfigFull + '/' +
                        '?_id=' + status[1].$oid;

                    switch (status[0]) {
                        case 'PASS':
                            buildS += '<span rel="tooltip" ' +
                                'data-toggle="tooltip" title=' +
                                '"Build successful &dash; Click to see build ' +
                                'details">' +
                                '<a href="' + buildLink + '">' +
                                '<span class="label label-success">' +
                                '<i class="fa fa-check"></i></span></a></span>';
                            break;
                        case 'FAIL':
                            buildS += '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Build failed &dash; Click to see ' +
                                'build details">' +
                                '<a href="' + buildLink + '">' +
                                '<span class="label label-danger">' +
                                '<i class="fa fa-exclamation-triangle"></i>' +
                                '</span></a></span>';
                            break;
                        default:
                            buildS += '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Build status unknown &dash; Click ' +
                                'to see build details">' +
                                '<a href="' + buildLink + '">' +
                                '<span class="label label-warning">' +
                                '<li class="fa fa-question">' +
                                '</li></span></a></span>';
                            break;
                    }
                } else {
                    buildS += '<span rel="tooltip" ' +
                        'data-toggle="tooltip" title=' +
                        '"Build not available for &#171;' + job +
                        ' &dash; ' + kernel + '&#187;">' +
                        '<span class="label label-default">' +
                        '<i class="fa fa-ban"></i></span></span>';
                }
                buildS += '</td>';
            }
            buildS += '</tr>';
        }

        tBody += buildS + '</tbody>';
        tableS = tHead + tBody;

        b.replaceById(tableId, tableS);
    }

    // Calculate total diff between the baseline and what is being compared
    // against.
    // Return a string with the total from the compared one and a diff number.
    function calculateTotalDiff(baseline, compared) {
        var totalDiff = 0,
            display;

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

    function parseCompareData(tableId, baseline, comparedData, deltaResult) {
        var baseCreatedOn,
            baseGitCommit,
            baseGitUrl,
            baseJob,
            baseKernel,
            baseTotalBuilds,
            columns,
            translatedGitUrl;

        baseGitCommit = baseline.git_commit;
        baseGitUrl = baseline.git_url;
        baseTotalBuilds = baseline.total_builds;
        baseJob = baseline.job;
        baseKernel = baseline.kernel;

        translatedGitUrl = u.translateCommit(baseGitUrl, baseGitCommit);

        b.replaceById(
            'dd-tree',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for tree ' + baseJob + '">' +
            '<a href="/job/' + baseJob + '/">' + baseJob + '</a>' +
            '</span>&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot reports details for ' + baseJob + '">' +
            '<a href="/boot/all/job/' + baseJob + '/">' +
            '<i class="fa fa-hdd-o"></i>' +
            '</a></span>'
        );
        b.replaceById('dd-branch', baseline.git_branch);
        b.replaceById(
            'dd-kernel',
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build ' + baseJob + '&nbsp;&dash;&nbsp;' +
                baseKernel + '">' +
                '<a href="/build/' + baseJob + '/kernel/' +
                baseKernel + '/">' + baseKernel + '</a>' +
                '</span>&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="All boot reports for ' + baseJob +
                '&nbsp;&dash;&nbsp;' + baseKernel + '">' +
                '<a href="/boot/all/job/' + baseJob + '/kernel/' +
                baseKernel + '/">' + '<i class="fa fa-hdd-o"></i></a></span>'
        );

        if (translatedGitUrl[0] !== null) {
            b.replaceById(
                'dd-url',
                '<a href="' + translatedGitUrl[0] + '">' + baseGitUrl +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (baseGitUrl !== null) {
                b.replaceById('dd-url', baseGitUrl);
            } else {
                b.replaceById('dd-url', nonAvail);
            }
        }

        if (translatedGitUrl[1] !== null) {
            b.replaceById(
                'dd-commit',
                '<a href="' + translatedGitUrl[1] + '">' + baseGitCommit +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (baseGitCommit !== null) {
                b.replaceById('dd-commit', baseGitCommit);
            } else {
                b.replaceById('dd-commit', nonAvail);
            }
        }

        b.replaceById('dd-total', baseTotalBuilds);
        baseCreatedOn = new Date(baseline.created_on.$date);
        b.replaceById('dd-date', baseCreatedOn.getCustomISODate());

        columns = [
            {
                data: 'job',
                title: 'Tree &dash; Branch',
                className: 'tree-column',
                render: function(data, type, object) {
                    var rend;
                    if (type === 'display') {
                            rend = '<a class="table-link" href="/job/' +
                                data + '/">' + data;

                        if (object.git_branch !== null) {
                            rend += '&nbsp;&dash;&nbsp;<small>' +
                                object.git_branch + '</small>';
                        }
                        rend += '</a>';
                    } else {
                        rend = data;
                        if (object.git_branch !== null) {
                            rend += ' ' + object.git_branch;
                        }
                    }
                    return rend;
                }
            },
            {
                data: 'kernel',
                title: 'Kernel',
                type: 'string',
                className: 'kernel-column',
                render: function(data, type) {
                    var rend = data;
                    if (type === 'display') {
                        rend = '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' + data + '</span>';
                    }
                    return rend;
                }
            },
            {
                data: 'git_commit',
                title: 'Commit',
                type: 'string',
                render: function(data, type, object) {
                    var rend = data,
                        cUrl;
                    if (type === 'display') {
                        cUrl = u.translateCommit(object.git_url, data);
                        rend = '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">';
                        if (cUrl[1] !== null) {
                            rend += '<a class="table-link" href="' + cUrl[1] +
                                '">' + data + '</a>';
                        } else {
                            rend += data;
                        }

                        rend += '</span>';
                    }
                    return rend;
                }
            },
            {
                data: 'total_builds',
                title: 'Total Builds',
                className: 'pull-center',
                render: function(data, type) {
                    var rend = data;
                    if (type === 'display' || type === 'filter') {
                        rend = calculateTotalDiff(baseTotalBuilds, data);
                    }
                    return rend;
                }
            },
            {
                data: 'created_on',
                title: 'Date',
                type: 'date',
                className: 'date-column pull-center',
                render: function(data, type) {
                    var created = new Date(data.$date);
                    if (type === 'display' || type === 'filter') {
                        created = created.getCustomISODate();
                    }
                    return created;
                }
            },
            {
                data: 'job',
                title: '',
                orderable: false,
                searchable: false,
                className: 'pull-center',
                render: function(data, type, object) {
                    var rend = '';
                    if (type === 'display') {
                        rend = '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for&nbsp;' + data +
                            '&nbsp;&dash;&nbsp;' + object.kernel + '">' +
                            '<a href="/build/' + data +
                            '/kernel/' + object.kernel + '/">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                    return rend;
                }
            }
        ];

        comparedTable
            .dom(tableDom)
            .tableData(comparedData)
            .columns(columns)
            .order([4, 'desc'])
            .noIDUrl(true)
            .rowURLElements(['job', 'kernel'])
            .draw();

        createBuildsChart(baseTotalBuilds, baseline.build_counts);
        createDiffTable(tableId, baseline, comparedData, deltaResult);
    }

    function getJobCompareFail() {
        b.replaceByClass('loading-content', nonAvail);
        b.replaceByClass(
            'no-data',
            '<div class="pull-center">' +
            '<strong>Error loading data.</strong></div>'
        );
    }

    function getJobCompareDone(response) {
        var result = response.result,
            resLen = result.length,
            baseline,
            comparedData,
            deltaResult;

        if (resLen > 0) {
            baseline = result[0].baseline;
            comparedData = result[0].compare_to;
            deltaResult = result[0].delta_result;

            b.replaceById(
                'body-title',
                'for &#171;' + baseline.job +
                '&#187;&nbsp;&dash;&nbsp;' + baseline.kernel
            );

            parseCompareData(
                'compare-table', baseline, comparedData, deltaResult);
        } else {
            b.replaceByClass('loading-content', nonAvail);
            b.replaceByClass(
                'no-data',
                '<div class="pull-center">' +
                '<strong>No data available.</strong></div>'
            );
        }
    }

    $(document).ready(function() {
        var deferred;

        document.getElementById('li-compare').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        if (document.getElementById('compare-id') !== null) {
            compareId = document.getElementById('compare-id').value;
        }

        if (compareId !== null) {
            comparedTable = t(['compared-against']);
            deferred = r.get('/_ajax/job/compare/' + compareId, {});
            $.when(deferred)
                .fail(e.error, getJobCompareFail)
                .done(getJobCompareDone);
        } else {
            b.replaceByClass('loading-content', nonAvail);
            b.replaceByClass(
                'no-data',
                '<div class="pull-center">' +
                '<strong>No data available.</strong></div>'
            );
            e.customError(
                400, 'Missing job comparison ID value: please specify one');
        }
    });
});
