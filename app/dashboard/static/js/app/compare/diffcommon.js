/*!
 * Copyright (C) Linaro Limited 2016,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
define(function() {
    'use strict';
    var gDiffCommon;

    gDiffCommon = {};

    // Dimensions of the legend element.
    gDiffCommon.legend = {
        width: 17.5,
        height: 17.5,
        rx: 1
    };

    // Dimensions of the rectangle to represent the 'status'.
    gDiffCommon.status = {
        height: 35,
        rx: 2.5,
        ry: 2.5,
        width: 35
    };

    gDiffCommon.colors = {
        fail: '#d9534f',
        pass: '#5cb85c',
        unavail: '#7f7e7e',
        unknown: '#f0ad4e'
    };

    gDiffCommon.boot_colors = {
        fail: '#d9534f',
        pass: '#5cb85c',
        unavail: '#7f7e7e',
        unknown: '#f0ad4e',
        offline: '#5bc0de'
    };

    gDiffCommon.icons = {
        fail: '\uf071',
        pass: '\uf00c',
        unknown: '?',
        offline: '\uf011',
        default: '\uf05e'
    };

    gDiffCommon.build_status = {
        fail: 'Build failed',
        pass: 'Build successful',
        unavail: 'Build not available',
        unknown: 'Build status unknown'
    };

    gDiffCommon.boot_status = {
        fail: 'Boot failed',
        pass: 'Boot successful',
        offline: 'Board offline',
        unavail: 'Boot not available',
        unknown: 'Boot status unknown'
    };

    gDiffCommon.symbols = {
        minus: '\u2212',
        plus: '\u002B',
        plus_minus: '\u00B1'
    };

    /**
     * Check if the passed argument is a function.
    **/
    gDiffCommon.isFunc = function(value) {
        return value && typeof(value) === 'function';
    };

    /**
     * Check if the passed value is valid.
     *
     * To be valid it has to:
     * . not be null or undefined
     * . not be an infinite or NaN value
     * . not be an empty string
     * . not be equal to the the string 'null', 'undefined' or 'none'
     *
     * @param {Number,String} value: The value to check.
     * @return {Boolean} The validity check result.
    **/
    gDiffCommon.isValidData = function(value) {
        var isValid;
        var toCheck;

        isValid = false;

        if (value !== null && value !== undefined) {

            if (typeof value === 'number') {
                if (isFinite(value) && !isNaN(value)) {
                    isValid = true;
                }
            } else {
                toCheck = String(value).toLowerCase();

                if (toCheck.length > 0) {
                    if (toCheck !== 'null' &&
                            toCheck !== 'undefined' && toCheck !== 'none') {
                        isValid = true;
                    }
                }
            }
        }

        return isValid;
    };

    /**
     * Check if the passed value is a number.
     *
     * @param {Number} value: The value to check.
     * @return {Boolean} The validity check result.
    **/
    gDiffCommon.isNumber = function(value) {
        if (value !== null &&
                value !== undefined && !isNaN(value) && isFinite(value)) {
            return true;
        }
        return false;
    };

    return gDiffCommon;
});
