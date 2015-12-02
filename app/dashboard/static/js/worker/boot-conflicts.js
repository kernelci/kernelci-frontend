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
        /**
         * This is a fake reduce function.
         * We are not interested in reducing the orginal array, what we are
         * looking for is a difference between boot statues.
         *
         * @param {Array} prev: The previous value.
         * @param {Array} cur: The current value.
         * @param {Array} ignore: The index in the array (not used).
         * @param {Array} arr: The array we are looping through.
         * @return {Array}
        **/
        function _reduceData(prev, cur, ignore, arr) {
            // TODO: need rework.
            if (prev[1] !== 'OFFLINE' && cur[1] !== 'OFFLINE') {
                if (prev[1] !== cur[1]) {
                    if (!conflicts.hasOwnProperty(key)) {
                        conflicts[key] = arr;
                        conflictsCount = conflictsCount + 1;
                    }
                }
            }
            return cur;
        }

        if (bootData[key].length > 1) {
            bootData[key].reduce(_reduceData);
        }
    }

    if (message.data) {
        message.data.forEach(_parseMessageData);
        bootDataKeys.forEach(_searchConflicts);
    }

    postMessage([conflictsCount, conflicts]);
};
