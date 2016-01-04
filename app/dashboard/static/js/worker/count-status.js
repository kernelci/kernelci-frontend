/* globals onmessage: true, postMessage: true */
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
        other,
        passed,
        results,
        total;

    function _count(result) {
        switch (result.status) {
            case 'FAIL':
                failed = failed + 1;
                break;
            case 'PASS':
                passed = passed + 1;
                break;
            default:
                other = other + 1;
                break;
        }
    }

    counted = null;

    if (message.data) {
        failed = 0;
        other = 0;
        passed = 0;
        total = 0;
        results = message.data.result;

        if (results.length > 0) {
            results.forEach(_count);
            total = passed + failed + other;
            counted = [total, [passed, failed, other]];
        }
    }

    postMessage(counted);
};
