// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

define([
    'jquery',
    'd3',
    'sprintf',
    'charts/base'
], function($, d3, p, k) {
    'use strict';
    var pie,
        sTooltipFmt;
    sTooltipFmt = '<span ' +
        'rel="tooltip" data-toggle="tooltip" title="%s">%d</span>';

    k.charts.pie = function() {
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = 200,
            height = 200,
            w = width - margin.right - margin.left,
            h = height - margin.top - margin.left,
            radius,
            gLayout,
            gArc,
            color,
            svg,
            svge;

        radius = Math.min(w, h) / 2;
        gLayout = d3.layout.pie().sort(null);
        gArc = d3.svg.arc().innerRadius(radius - 30).outerRadius(radius - 50);
        // pass, fail, unknown
        color = ['#5cb85c', '#d9534f', '#f0ad4e'];

        pie = function(selection) {
            selection.each(function(data) {
                svg = d3.select(this).append('svg:svg')
                    .attr('width', w)
                    .attr('height', h);
                svge = svg.append('g')
                    .attr(
                        'transform',
                        'translate(' + (w / 2) + ',' + (h / 2) + ')');

                svge.selectAll('path')
                    .data(gLayout(data.values))
                    .enter()
                    .append('path')
                        .attr('fill', function(d, i) {
                            return color[i];
                        })
                        .attr('d', gArc);

                svge.append('text')
                    .attr('dy', '0em')
                    .style('text-anchor', 'middle')
                    .attr('class', 'pie-chart-inside')
                    .text(data.total);

                svge.append('text')
                    .attr('dy', '1.5em')
                    .style('text-anchor', 'middle')
                    .attr('class', 'pie-chart-data')
                    .text('total boots');

                $('#success-cell')
                    .empty()
                    .append(
                        p.sprintf(sTooltipFmt, 'Successful', data.values[0]))
                    .css('border-bottom-color', color[0]);
                $('#fail-cell')
                    .empty()
                    .append(
                        p.sprintf(sTooltipFmt, 'Failed', data.values[1]))
                    .css('border-bottom-color', color[1]);
                $('#unknown-cell')
                    .empty()
                    .append(
                        p.sprintf(sTooltipFmt, 'Unknown', data.values[2]))
                    .css('border-bottom-color', color[2]);
            });
        };

        return pie;
    };
});
