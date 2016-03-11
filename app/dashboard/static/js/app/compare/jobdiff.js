/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'charts/diffmatrix',
    'compare/diffcommon'
], function(html, diffmatrix, common) {
    'use strict';
    var gJobDiff = {};

    function buildMouseInOut(element, chart, style) {
        var arch;
        var defconfig;
        var job;
        var kernel;

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
        var destUrl;
        var elId;
        var defconfig;
        var job;
        var kernel;

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

    function setupMatrix(chart, data) {
        chart.matrixCells()
            .append('rect')
            .attr('x', function(ignore, idx) {
                return chart.xScale(idx) - (chart.square().width / 2);
            })
            .attr('width', chart.square().width)
            .attr('height', chart.square().height)
            .attr('rx', chart.square().rx);

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
                var defconfig = null;
                var parent = this.parentElement;
                if (parent.hasAttribute('data-defconfig')) {
                    defconfig = parent.getAttribute('data-defconfig');
                }
                return defconfig;
            })
            .attr('data-arch', function() {
                var arch = null;
                var parent = this.parentElement;
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
                var fillColor;
                var status;

                fillColor = common.colors.unavail;
                if (datum !== null && datum.length > 0) {
                    status = datum[0].toLowerCase();

                    if (common.colors.hasOwnProperty(status)) {
                        fillColor = common.colors[status];
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
            .data(Object.keys(common.colors))
            .enter()
            .append('g')
                .attr('class', 'legend-line')
                .attr('transform', function(ignore, idx) {
                    return 'translate(5,' +
                        (common.legend.height + 2) * idx + ')';
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
                .attr('width', common.legend.width)
                .attr('height', common.legend.height)
                .attr('rx', common.legend.rx)
                .style('fill', function(datum) {
                    return common.colors[datum];
                });

        chart.legendGroup()
            .selectAll('g.legend-line')
            .append('text')
                .attr('x', common.legend.width + 5)
                .attr('y', common.legend.height / 2)
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

    gJobDiff.create = function(element, data) {
        var args;

        // Mapping between data and element.
        function cellDataFunc(ignore, idx) {
            return data.ydata[idx][1];
        }

        args = {
            element: element,
            data: data,
            setupFunc: setupMatrix,
            cellDataFunc: cellDataFunc
        };

        diffmatrix.create(args);
    };

    return gJobDiff;
});
