/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var format,
        numFormat,
        sizes;

    format = {};

    numFormat = new Intl.NumberFormat(['en-US']);
    sizes = [
        'bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'
    ];

    /**
     * Round a value down to 2 decimal positions.
     *
     * @private
     * @param {Number} value: The value to round.
     * @return {Number} The rounded value.
    **/
    function roundToTwo(value) {
        return +(Math.round(value + 'e+2') + 'e-2');
    }

    /**
     * Format a number through the Intl library.
     *
     * @param {Number} value: The number to format.
     * @return {String} The formatted number as a string.
    **/
    format.number = function(value) {
        return numFormat.format(value);
    };


    // Parse a byte number and return its human-readable form.
    /**
     * Format a bytes number into a human-readable form.
     *
     * @param {Number} bytes: The bytes number to format.
     * @return {String} The formatted number as a string.
    **/
    format.bytes = function(bytes) {
        var calcBase,
            idx,
            retVal;
        calcBase = 1024;
        if (bytes === 0 || isNaN(bytes)) {
            retVal = '0 bytes';
        } else {
            idx = Math.floor(Math.log(bytes) / Math.log(calcBase));
            retVal = numFormat.format(
                roundToTwo(
                    bytes / Math.pow(calcBase, idx))) + ' ' + sizes[idx];
        }
        return retVal;
    };

    return format;
});
