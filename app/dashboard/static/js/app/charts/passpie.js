/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'utils/base',
    'charts/base',
    'charts/pie'
], function(d3, b, k) {
    'use strict';
    var passpie = {};

    function countStatus(response) {
        var counted = null,
            count = response.count,
            result = response.result,
            resLen,
            i = 0,
            tFail = 0,
            tPass = 0,
            tUnknown = 0;

        if (count > 0) {
            resLen = result.length;
            for (i; i < resLen; i = i + 1) {
                switch (result[i].status) {
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
            counted = [tPass, tFail, tUnknown];
        }
        return counted;
    }

    function passGraph(element, response) {
        var chart,
            setup,
            tElement,
            tData;

        tElement = b.checkElement(element);
        tData = countStatus(response);
        if (tData !== null) {
            chart = k.charts.pie();
            setup = {
                'values': tData,
                'total': tData[0] + tData[1] + tData[2],
                'chart': chart
            };
            b.replaceById(tElement[0], '');
            d3.select(tElement[1])
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        }
    }

    passpie.buildpie = function(element, response) {
        passGraph(element, response);
    };

    passpie.bootpie = function(element, response) {
        passGraph(element, response);
    };

    return passpie;
});
