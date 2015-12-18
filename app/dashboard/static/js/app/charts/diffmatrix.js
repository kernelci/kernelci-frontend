/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'd3',
    'charts/base',
    'utils/html',
    'charts/matrix'
], function($, d3, k, html) {
    'use strict';
    var diffmatrix,
        htmlColors,
        htmlIcons,
        legendSquare;

    diffmatrix = {};
    htmlColors = {
        fail: '#d9534f',
        pass: '#5cb85c',
        unavail: '#7f7e7e',
        unknown: '#f0ad4e'
    };
    htmlIcons = {
        fail: '\uf071',
        pass: '\uf00c',
        unknown: '?',
        default: '\uf05e'
    };
    legendSquare = {
        width: 17.5,
        height: 17.5,
        rx: 1
    };

    function buildMouseInOut(element, chart, style) {
        var arch,
            defconfig,
            job,
            kernel;

        arch = element.getAttribute('data-arch');
        defconfig = element.getAttribute('data-defconfig');
        job = element.getAttribute('data-job');
        kernel = element.getAttribute('data-kernel');

        chart.yTextGroup()
            .select(
                'text' +
                '[data-defconfig="' + defconfig + '"]' +
                '[data-arch="' + arch + '"]'
            )
            .style('font-weight', style);

        chart.xTextGroup()
            .select(
                'text' +
                '[data-job="' + job + '"]' +
                '[data-kernel="' + kernel + '"]'
            )
            .style('font-weight', style);
    }

    function createBuildUrl(element) {
        var destUrl,
            elId,
            defconfig,
            job,
            kernel;
        destUrl = '/build/';

        if (element.hasAttribute('data-status')) {
            defconfig = element.getAttribute('data-defconfig');
            job = element.getAttribute('data-job');
            kernel = element.getAttribute('data-kernel');
            elId = element.getAttribute('data-id') || null;

            destUrl += job + '/kernel/' + kernel + '/defconfig/' +
                defconfig + '/';
            if (elId !== null) {
                destUrl += '?_id=' + elId;
            }
            window.location = destUrl;
        }
    }

    function setupBuildTooltips(element) {
        $(element + ' .matrix-cell-group').tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: function() {
                var el,
                    job,
                    kernel,
                    status,
                    titleTxt;

                el = $(this);
                job = el.data('job') || null;
                kernel = el.data('kernel') || null;
                status = el.data('status') || null;

                if (status === null) {
                    titleTxt = 'Build not available for &#171;' + job +
                        ' &dash; ' + kernel + '&#187;';
                } else {
                    switch (status) {
                        case 'pass':
                            titleTxt = 'Build successful &dash; ' +
                                'Click to see build details';
                            break;
                        case 'fail':
                            titleTxt = 'Build failed &dash; ' +
                                'Click to see build details';
                            break;
                        default:
                            titleTxt = 'Build status unknown &dash; ' +
                                'Click to see build details';
                            break;
                    }
                }
                return titleTxt;
            }
        });
    }

    function completeBuildDiffMatrix(chart, data) {
        chart.xTextGroup()
            .selectAll('text')
            .data(data.xdata)
            .enter()
            .append('text')
            .attr('y', function(ignore, idx) {
                // Use xScale here since everything is rotated by 90˚.
                return chart.xScale(idx);
            })
            .text(function(datum) {
                return html.sliceText(
                    datum.job + ' - ' + datum.kernel, 25);
            })
            .attr('data-job', function(datum) {
                return datum.job;
            })
            .attr('data-kernel', function(datum) {
                return datum.kernel;
            })
            .attr('transform', 'rotate(-90) translate(3)')
            .attr('dominant-baseline', 'middle');

        chart.yTextGroup()
            .selectAll('text')
            .data(data.ydata)
            .enter()
            .append('text')
            .attr('y', function(ignore, idx) {
                var yDx = chart.yScale(idx);
                if (isNaN(yDx)) {
                    yDx = chart.square().height / 2;
                }
                return yDx;
            })
            .text(function(datum) {
                var localData = datum[0];
                return html.sliceText(
                    localData[1] + ' - ' + localData[2], 40);
            })
            .attr('dominant-baseline', 'middle')
            .attr('data-defconfig', function(datum) {
                return datum[0][1];
            })
            .attr('data-arch', function(datum) {
                return datum[0][2];
            });

        chart.matrixLines()
            .attr('data-defconfig', function(datum) {
                return datum[0][1];
            })
            .attr('data-arch', function(datum) {
                return datum[0][2];
            });

        chart.matrixCells()
            .classed('unclickable', function(datum) {
                var classed = false;
                if (datum === null) {
                    classed = true;
                }
                return classed;
            })
            .attr('data-id', function(datum) {
                var datumId = null;
                if (datum !== null) {
                    datumId = datum[1].$oid;
                }
                return datumId;
            })
            .attr('data-status', function(datum) {
                var status = null;
                if (datum !== null) {
                    status = datum[0].toLowerCase();
                }
                return status;
            })
            .attr('data-job', function(ignore, idx) {
                return data.xdata[idx].job;
            })
            .attr('data-kernel', function(ignore, idx) {
                return data.xdata[idx].kernel;
            })
            .attr('data-defconfig', function() {
                var parent = this.parentElement,
                    defconfig = null;
                if (parent.hasAttribute('data-defconfig')) {
                    defconfig = parent.getAttribute('data-defconfig');
                }
                return defconfig;
            })
            .attr('data-arch', function() {
                var parent = this.parentElement,
                    arch = null;
                if (parent.hasAttribute('data-arch')) {
                    arch = parent.getAttribute('data-arch');
                }
                return arch;
            })
            .on('click', function() {
                createBuildUrl(this);
            })
            .on('mouseover', function() {
                buildMouseInOut(this, chart, 'bold');
            })
            .on('mouseout', function() {
                buildMouseInOut(this, chart, 'normal');
            });

        chart.matrixCells()
            .selectAll('rect')
            .style('fill', function(datum) {
                var status,
                    fillColor;
                fillColor = htmlColors.unavail;
                if (datum !== null && datum.length > 0) {
                    status = datum[0].toLowerCase();

                    if (htmlColors.hasOwnProperty(status)) {
                        fillColor = htmlColors[status];
                    }
                }
                return fillColor;
            });

        chart.legendGroup()
            .attr('transform', 'translate(0,25)');

        chart.legendGroup()
            .append('g')
                .attr('class', 'legend-title')
            .append('text')
                .text('Legend');

        chart.legendGroup()
            .append('g')
                .attr('class', 'legend-para')
                .attr('transform', 'translate(0,10)')
            .append('text')
                .text('Click on a cell to view build details.');

        chart.legendGroup()
            .append('g')
                .attr('class', 'legend-descriptions')
                .attr('transform', 'translate(7,28)');

        chart.legendGroup()
            .select('g.legend-descriptions')
            .selectAll('g')
            .data(Object.keys(htmlColors))
            .enter()
            .append('g')
                .attr('class', 'legend-line')
                .attr('transform', function(ignore, idx) {
                    return 'translate(5,' +
                        (legendSquare.height + 2) * idx + ')';
                })
                .attr('data-status', function(datum) {
                    return datum;
                });

        chart.legendGroup()
            .selectAll('g.legend-line')
            .append('rect')
                .attr('data-status', function(datum) {
                    return datum;
                })
                .attr('width', legendSquare.width)
                .attr('height', legendSquare.height)
                .attr('rx', legendSquare.rx)
                .style('fill', function(datum) {
                    return htmlColors[datum];
                });

        chart.legendGroup()
            .selectAll('g.legend-line')
            .append('text')
                .attr('x', legendSquare.width + 5)
                .attr('y', legendSquare.height / 2)
                .text(function(datum) {
                    var descTxt;
                    switch (datum) {
                        case 'fail':
                            descTxt = 'Build failed';
                            break;
                        case 'pass':
                            descTxt = 'Build successful';
                            break;
                        case 'unknown':
                            descTxt = 'Build status unknown';
                            break;
                        default:
                            descTxt = 'Build not available';
                            break;
                    }
                    return descTxt;
                });
    }

    function createMatrix(element, data, type) {
        var chart;

        chart = k.charts.matrix();
        // Inject the chart.
        data.chart = chart;
        // Set the cell data function: mapping between the data and element.
        chart.cellData(function(ignore, idx) {
            return data.ydata[idx][1];
        });

        html.removeChildren(document.getElementById(element));

        d3.select('#' + element)
            .data([data])
            .each(function(datum) {
                d3.select(this).call(datum.chart);
            });

        if (type === 'build') {
            completeBuildDiffMatrix(chart, data);
        }
    }

    diffmatrix.builds = function(element, data) {
        createMatrix(element, data, 'build');
    };

    return diffmatrix;
});
