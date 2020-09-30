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
 * Count the status of build and boot reports.
 * Return a message with an array of 2 elements: the total count, an array of 3
 * elements (in this order: passed, failed, other).
 *
 * @param {Object} message: The received message containing the response from
 * the API.
**/
onmessage = function(message) {
    'use strict';
    var counted,
        failed,
        unknown,
        passed,
        warning,
        results;

    function _count(result) {
        var status;

        if ((result.status == "PASS") && result.warnings)
            status = 'WARNING';
        else
            status = result.status;

        switch (status) {
            case 'FAIL':
                failed += 1;
                break;
            case 'PASS':
                passed += 1;
                break;
            case 'WARNING':
                warning += 1;
                break;
            default:
                unknown += 1;
                break;
        }
    }

    counted = null;

    if (message.data) {
        failed = 0;
        warning = 0;
        passed = 0;
        unknown = 0;
        results = message.data.result;

        if (results.length > 0) {
            results.forEach(_count);
            counted = [results.length, [passed, warning, failed, unknown]];
        }
    }

    postMessage(counted);
};
