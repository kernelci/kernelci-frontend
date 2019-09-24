 * Copyright (C) Linaro Limited 2015,2016,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
/* globals onmessage: true, postMessage: true */
/*!
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
onmessage = function(message) {
    'use strict';
    var bootData;
    var bootDataKeys;
    var conflicts;
    var conflictsCount;

    bootData = {};
    bootDataKeys = [];
    conflicts = {};
    conflictsCount = 0;

    /**
     * Go through the received boot data and create a new data structure.
     * The new data structure is an Object whose keys is a combination of
     * values from the boot data.
     *
     * @param {Object} element The element we are looking at.
    **/
    function _parseMessageData(element) {
        var key;

        key = [element.arch, element.defconfig_full, element.board].join('|');
        if (!bootData.hasOwnProperty(key)) {
            bootData[key] = [];
            bootDataKeys.push(key);
        }

        bootData[key].push([element.lab_name, element.status]);
    }

    /**
     * Search for the conflicts in the boot data.
     *
     * @param {String} key The bootData key we are working on.
    **/
    function _searchConflicts(key) {
        var arrayLen;
        var hasConflict;
        var idx;
        var jdx;

        function _reduce(array) {
            hasConflict = false;
            arrayLen = array.length;

            for (idx = 0; idx < arrayLen; idx = idx + 1) {
                if (array[idx][1] === 'OFFLINE') {
                    continue;
                }

                for (jdx = idx + 1; jdx < arrayLen; jdx = jdx + 1) {
                    if (array[jdx][1] === 'OFFLINE') {
                        continue;
                    }

                   if (array[idx][1] !== array[jdx][1]) {
                        if (!conflicts.hasOwnProperty(key)) {
                            conflicts[key] = array;
                            conflictsCount = conflictsCount + 1;
                        }

                        // Sentinel to break out of the external loop.
                        hasConflict = true;
                        break;
                    }
                }

                if (hasConflict) {
                    break;
                }
            }
        }

        if (bootData[key].length > 1) {
            _reduce(bootData[key]);
        }
    }

    if (message.data) {
        message.data.forEach(_parseMessageData);
        bootDataKeys.forEach(_searchConflicts);
    }

    /*
     * Return a 2-elements array as:
     * 0. Count of the conflicts found.
     * 1. Object with the conflicts found.
     *
     * The conflict object is:
     * {
     *   key: [[lab_name, status], ...]
     * }
     *
     * The key is composed of the "arch", "defconfing" and "board" values
     * joined together and separated by the "|" (pipe) character.
    */
    postMessage([conflictsCount, conflicts]);
};
