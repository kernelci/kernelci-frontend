/*!
 * Copyright (C) Linaro Limited 2015,2016,2017,2019
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
        output = year;
        output += '-';
        output += month;
        output += '-';
        output += day;
        output += ' ';
        output += hour;
        output += ':';
        output += minute;
        output += ':';
        output += second;
        output += ' UTC';

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
