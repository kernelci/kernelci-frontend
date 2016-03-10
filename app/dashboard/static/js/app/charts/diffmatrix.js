/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'charts/base',
    'utils/html',
    'charts/matrix'
], function(d3, k, html) {
    'use strict';
    var diffmatrix;

    diffmatrix = {};

    /**
     * Check if the passed argument is a function.
    **/
    function isFunc(toCheck) {
        return toCheck && typeof(toCheck) === 'function';
    }

    diffmatrix.create = function(args) {
        var chart = k.charts.matrix();

        function _callFunc(key) {
            if (chart.hasOwnProperty(key) && isFunc(chart[key])) {
                chart[key](args.options[key]);
            }
        }

        // Set the cell data function: mapping between the data and element.
        if (isFunc(args.cellDataFunc)) {
            chart.cellData(args.cellDataFunc);
        }

        if (args.hasOwnProperty('options') && args.options) {
            Object.keys(args.options).forEach(_callFunc);
        }

        html.removeChildren(document.getElementById(args.element));

        d3.select('#' + args.element)
            .data([args.data])
            .each(function() {
                d3.select(this).call(chart);
            });

        // Complete the graph setup.
        args.setupFunc(chart, args.data);
    };

    return diffmatrix;
});
