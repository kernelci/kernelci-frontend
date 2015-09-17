/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'charts/base'
], function(d3, k) {
    'use strict';
    var matrixchart;

    k.charts.matrix = function() {
        var div,
            groupPosition,
            height,
            margin,
            matrixGroup,
            matrixCells,
            square,
            svg,
            width,
            xData,
            xDataLen,
            xScale,
            xTextGroup,
            yData,
            yDataLen,
            yScale,
            yTextGroup,
            matrixLines,
            legendGroup,
            cellData;

        // Size in pixels of the rect element that will be drawn in the matrix.
        // By default is a square.
        square = {width: 38, height: 38, rx: 4.5};

        // Margins of the SVG element.
        margin = {top: 0, right: 0, bottom: 0, left: 0};
        width = 1140;

        groupPosition = {top: 180, right: 0, bottom: 0, left: 304};

        cellData = function(datum, idx) {
            return datum[idx];
        };

        matrixchart = function(selection) {
            selection.each(function(data) {
                var sHeight,
                    sWidth,
                    sRx;

                sHeight = matrixchart.square().height;
                sWidth = matrixchart.square().width;
                sRx = matrixchart.square().rx;

                xData = data.xdata;
                xDataLen = xData.length;

                yData = data.ydata;
                yDataLen = yData.length;

                height = (sHeight * yDataLen) +
                    groupPosition.top + groupPosition.bottom;

                xScale = d3.scale.linear().range(
                    d3.range(sWidth / 2, sWidth * xDataLen, sWidth));
                yScale = d3.scale.linear().range(
                    d3.range(sHeight / 2, sHeight * yDataLen, sHeight));

                xScale.domain(d3.range(0, xDataLen));
                yScale.domain(d3.range(0, yDataLen));

                div = d3.select(this).selectAll('svg').data([data]);
                svg = div.enter()
                    .append('svg:svg')
                    .attr('width', matrixchart.width())
                    .attr('height', height);

                xTextGroup = svg
                    .append('g')
                    .attr('class', 'x')
                    .attr(
                        'transform',
                        'translate(' + groupPosition.left + ',' +
                            groupPosition.top + ')');

                yTextGroup = svg
                    .append('g')
                    .attr('class', 'y')
                    .attr(
                        'transform',
                        'translate(0,' + groupPosition.top + ')');

                matrixGroup = svg
                    .append('g')
                    .attr('class', 'matrix')
                    .attr(
                        'transform',
                        'translate(' + groupPosition.left + ',' +
                            groupPosition.top + ')');

                legendGroup = svg
                    .append('g')
                    .attr('class', 'legend');

                matrixLines = matrixGroup
                    .selectAll('g')
                    .data(yData)
                    .enter()
                    .append('g')
                    .attr('class', 'matrix-line-group')
                    .attr('transform', function(ignore, idx) {
                        return 'translate(0,' +
                            (yScale(idx) - (sHeight / 2)) + ')';
                    });

                // Then select each group, and add the rect elements.
                // Remap the data as well to make sure it is the correct one.
                matrixCells = matrixLines
                    .selectAll('g')
                    .data(function(datum, idx) {
                        return matrixchart.cellData()(datum, idx);
                    })
                    .enter()
                    .append('g')
                    .attr('class', 'matrix-cell-group');

                matrixCells
                    .append('rect')
                    .attr('x', function(ignore, idx) {
                        return xScale(idx) - (sWidth / 2);
                    })
                    .attr('width', sWidth)
                    .attr('height', sHeight)
                    .attr('rx', sRx);
            });
        };

        matrixchart.cellData = function(value) {
            var retVal = cellData;
            if (value !== undefined) {
                cellData = value;
                retVal = matrixchart;
            }
            return retVal;
        };

        matrixchart.legendGroup = function() {
            return legendGroup;
        };

        matrixchart.xScale = function(value) {
            return xScale(value);
        };

        matrixchart.yScale = function(value) {
            return yScale(value);
        };

        matrixchart.xTextGroup = function() {
            return xTextGroup;
        };

        matrixchart.yTextGroup = function() {
            return yTextGroup;
        };

        matrixchart.matrixGroup = function() {
            return matrixGroup;
        };

        matrixchart.matrixLines = function() {
            return matrixLines;
        };

        matrixchart.matrixCells = function() {
            return matrixCells;
        };

        matrixchart.div = function() {
            return div;
        };

        matrixchart.groupPosition = function(value) {
            var retVal = groupPosition;
            if (value !== undefined) {
                groupPosition = value;
                retVal = matrixchart;
            }
            return retVal;
        };

        matrixchart.margin = function(value) {
            var retVal = margin;
            if (value !== undefined) {
                margin = value;
                retVal = matrixchart;
            }
            return retVal;
        };

        matrixchart.square = function(value) {
            var retVal = square;
            if (value !== undefined) {
                square = value;
                retVal = matrixchart;
            }
            return retVal;
        };

        matrixchart.width = function(value) {
            var retVal = width;
            if (value !== undefined) {
                width = value;
                retVal = matrixchart;
            }
            return retVal;
        };

        return matrixchart;
    };
});
