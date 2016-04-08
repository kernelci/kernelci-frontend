/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    /*
        Return a custom UTC full date string, without time, in ISO format.
        The format returned is: YYYY-MM-DD
    */
    Date.prototype.toCustomISODate = function() {
        var day,
            month;

        day = this.getUTCDate().toString();
        month = this.getUTCMonth() + 1;

        month = month.toString();
        month = month[1] ? month : '0' + month[0];
        day = day[1] ? day : '0' + day[0];


        return this.getUTCFullYear().toString() + '-' + month + '-' + day;
    };

    /*
        Return a custom UTC full date string, including time, in ISO format.
        The format returned is: YYYY-MM-DD HH:MM:SS
    */
    Date.prototype.toCustomISODateTime = function() {
        var day,
            month,
            year,
            hour,
            minute,
            second,
            output;

        day = this.getUTCDate().toString();
        month = this.getUTCMonth() + 1;
        year = this.getUTCFullYear().toString();
        hour = this.getUTCHours().toString();
        minute = this.getUTCMinutes().toString();
        second = this.getUTCSeconds().toString();

        month = month.toString();
        month = month[1] ? month : '0' + month[0];
        day = day[1] ? day : '0' + day[0];
        hour = hour[1] ? hour : '0' + hour[0];
        minute = minute[1] ? minute : '0' + minute[0];
        second = second[1] ? second : '0' + second[0];
        output = year + '-' + month + '-' + day
                 + ' ' + hour + ':' + minute + ':' + second + ' UTC';

        return output;
    };

    /*
        Return a custom time representation as a string.
        This is mostly useful to calulate elapsed time.

        The full format returned is: X hours Y min. Z sec. T mill.

        If one of the values for hours, minutes, seconds or milliseconds is 0,
        it will not be returned.
    */
    Date.prototype.toCustomTime = function() {
        var localHours,
            localMilliseconds,
            localMinutes,
            localSeconds,
            localTime;

        localHours = this.getUTCHours();
        localMinutes = this.getUTCMinutes();
        localSeconds = this.getUTCSeconds();
        localMilliseconds = this.getMilliseconds();
        localTime = '';

        if (localHours !== 0) {
            localTime += localHours.toString() + ' hours ';
        }

        if (localMinutes !== 0) {
            localTime += localMinutes.toString() + ' min. ';
        }

        if (localSeconds !== 0) {
            localTime += localSeconds.toString() + ' sec. ';
        }

        if (localMilliseconds !== 0) {
            localTime += localMilliseconds.toString() + ' mill.';
        }

        if (!localTime) {
            localTime = '0';
        }

        return localTime.trim();
    };
});
