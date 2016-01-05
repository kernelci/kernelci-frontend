/* globals onmessage: true, postMessage: true */
/**
 * Count the status of build and boot reports for a passrate graph.
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
