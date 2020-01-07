/* globals onmessage: true, postMessage: true */
/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
/**
 * Count the status of build and test reports for a passrate graph.
 * Return a message with an object whose keys are the kernel value.
 * Each key holds an object with the follwing keys:
 * . job
 * . kernel
 * . pass: total passed results
 * . fail: total failed results
 * . other: total other results
 * . total: the total number of results
 *
 * @param {Object} message: The received message containing the response from
 * the API.
**/
onmessage = function(message) {
    'use strict';
    var counted,
        kernel,
        results;

    function _count(result) {
        kernel = result.kernel;

        if (!counted.hasOwnProperty(kernel)) {
            counted[kernel] = {};
            counted[kernel].job = result.job;
            counted[kernel].kernel = kernel;
            counted[kernel].pass = 0;
            counted[kernel].fail = 0;
            counted[kernel].other = 0;
        }

        switch (result.status) {
            case 'PASS':
                counted[kernel].pass = (counted[kernel].pass || 0) + 1;
                break;
            case 'FAIL':
                counted[kernel].fail = (counted[kernel].fail || 0) + 1;
                break;
            default:
                counted[kernel].other = (counted[kernel].other || 0) + 1;
                break;
        }

        counted[kernel].total = (counted[kernel].total || 0) + 1;
    }

    counted = null;

    if (message.data) {
        results = message.data.result;

        if (results.length > 0) {
            counted = {};
            results.forEach(_count);
        }
    }

    postMessage(counted);
};
