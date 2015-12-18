/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'charts/base',
    'utils/html',
    'charts/pie'
], function(d3, k, html) {
    'use strict';
    var passpie = {};

    // Return a list with:
    // 0. Total number of elements
    // 1. List with passed, failed and unknown counts
    function countStatus(response) {
        var counted = null,
            count = response.count,
            result = response.result,
            resLen,
            idx = 0,
            tTotal = 0,
            tFail = 0,
            tPass = 0,
            tUnknown = 0;

        if (count > 0) {
            resLen = result.length;
            for (idx; idx < resLen; idx = idx + 1) {
                switch (result[idx].status) {
                    case 'FAIL':
                        tFail = tFail + 1;
                        break;
                    case 'PASS':
                        tPass = tPass + 1;
                        break;
                    default:
                        tUnknown = tUnknown + 1;
                        break;
                }
            }
            tTotal = tPass + tFail + tUnknown;
            counted = [tTotal, [tPass, tFail, tUnknown]];
        }
        return counted;
    }

    function passGraph(element, response, chartText, countFunc) {
        var chart,
            setup,
            tData;

        if (countFunc === undefined || countFunc === null) {
            countFunc = countStatus;
        }

        tData = countFunc(response);

        if (tData !== null) {
            chart = k.charts
                .piechart()
                .innerText(chartText);

            setup = {
                values: tData[1],
                total: tData[0],
                chart: chart
            };

            html.removeChildren(document.getElementById(element));
            d3.select('#' + element)
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        }
    }

    passpie.buildpie = function(element, response, countFunc) {
        passGraph(element, response, 'total builds', countFunc);
    };

    passpie.bootpie = function(element, response, countFunc) {
        passGraph(element, response, 'total boots', countFunc);
    };

    return passpie;
});
