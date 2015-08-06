/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
