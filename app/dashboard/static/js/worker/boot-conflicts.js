/* globals onmessage: true, postMessage: true */
onmessage = function(message) {
    'use strict';
    var bootData,
        bootDataKeys,
        conflicts,
        conflictsCount;

    bootData = {};
    bootDataKeys = [];
    conflicts = {};
    conflictsCount = 0;

    /**
     * Go through the received boot data and create a new data structure.
     * The new data structure is an Object whose keys is a combination of
     * values from the boot data.
     *
     * @param {Object} element: The element we are looking at.
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
     * @param {String} key: The bootData key we are working on.
    **/
    function _searchConflicts(key) {
        var arrayLen,
            hasConflict,
            idx,
            jdx;

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
