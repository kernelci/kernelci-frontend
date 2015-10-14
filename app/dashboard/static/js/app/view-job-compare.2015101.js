/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/tables',
    'utils/urls',
    'charts/passpie',
    'charts/diffmatrix',
    'utils/date'
], function($, b, e, i, r, t, u, pie, matrix) {
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

    function setupCompareToTable(comparedData, baseline) {
        var columns;
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
                        rend = calculateTotalDiff(baseline.total_builds, data);
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
                        created = created.toCustomISODate();
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
    }

    function setupBaselineData(baseline) {
        var baseCreatedOn,
            baseGitCommit,
            baseGitUrl,
            baseJob,
            baseKernel,
            baseTotalBuilds,
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
        b.replaceById('dd-date', baseCreatedOn.toCustomISODate());
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
            matrixData,
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

            setupBaselineData(baseline);
            setupCompareToTable(comparedData, baseline);

            pie.buildpie(
                'build-chart',
                [baseline.total_builds, baseline.build_counts],
                function(response) {
                    return response;
                }
            );

            if (deltaResult.length > 0) {
                matrixData = {
                    xdata: [baseline],
                    ydata: deltaResult
                };

                Array.prototype.push.apply(matrixData.xdata, comparedData);
                matrix.builds('builds-matrix', matrixData);
            } else {
                b.replaceById(
                    'builds-matrix',
                    '<div class="pull-center">' +
                    '<strong>No differences to show.</strong></div>'
                );
            }
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
                400, 'Missing job comparison ID value: please specify one.');
        }
    });
});
