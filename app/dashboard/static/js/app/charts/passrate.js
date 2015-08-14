/*! Kernel CI Dashboard v2015.8.3 | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'utils/base',
    'charts/base',
    'charts/rate'
], function(d3, b, k) {
    'use strict';
    var passrate = {},
        emptyContent;

    emptyContent = '<div class="pull-center">' +
        '<strong>No data available to show.</strong>' +
        '</div>';

    function countBDReports(response) {
        var dataObj = null,
            i = 0,
            count,
            tData,
            dataLength,
            lData,
            kernel,
            status;

        count = response.count;
        if (count > 0) {
            dataObj = {};
            tData = response.result;
            dataLength = tData.length;

            for (i; i < dataLength; i = i + 1) {
                lData = tData[i];
                kernel = lData.kernel;
                status = lData.status;

                if (!dataObj.hasOwnProperty(kernel)) {
                    dataObj[kernel] = {};
                    dataObj[kernel].job = lData.job;
                    dataObj[kernel].kernel = kernel;
                    dataObj[kernel].pass = 0;
                    dataObj[kernel].fail = 0;
                    dataObj[kernel].other = 0;
                }

                switch (status) {
                    case 'PASS':
                        dataObj[kernel].pass = (dataObj[kernel].pass || 0) + 1;
                        break;
                    case 'FAIL':
                        dataObj[kernel].fail = (dataObj[kernel].fail || 0) + 1;
                        break;
                    default:
                        dataObj[kernel].other =
                            (dataObj[kernel].other || 0) + 1;
                        break;
                }

                dataObj[kernel].total = (dataObj[kernel].total || 0) + 1;
            }
        }

        return dataObj;
     }

    passrate.bootpassrate = function(element, response) {
        var chart,
            setup,
            datat = null,
            tElement;

        tElement = b.checkElement(element);
        datat = countBDReports(response);

        if (datat !== null) {
            chart = k.charts.rate();
            setup = {
                'values': datat,
                'chart': chart,
                'graphType': 'boot',
                'dataAttributes': ['job', 'kernel', 'pass', 'total'],
                'clickFunction': k.toBootLinkClick
            };

            b.replaceById(tElement[0], '');
            d3.select(tElement[1])
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        } else {
            b.replaceById(tElement[0], emptyContent);
        }
    };

    passrate.buildpassrate = function(element, response) {
        var chart,
            setup,
            datat = null,
            tElement;

        tElement = b.checkElement(element);
        datat = countBDReports(response);

        if (datat !== null) {
            chart = k.charts.rate();
            setup = {
                'values': datat,
                'chart': chart,
                'graphType': 'build',
                'dataAttributes': ['job', 'kernel', 'pass', 'total'],
                'clickFunction': k.toBuildLinkClick
            };

            b.replaceById(tElement[0], '');
            d3.select(tElement[1])
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        } else {
            b.replaceById(tElement[0], emptyContent);
        }
    };

    return passrate;
});

