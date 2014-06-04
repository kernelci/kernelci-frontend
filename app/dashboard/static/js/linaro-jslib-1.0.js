// Copyright (C) 2014 Linaro Ltd.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*
    Return a custom date in ISO format, based on UTC time.
    The format returned is: YYYY-MM-DD HH:MM:SS UTC
*/
Date.prototype.getCustomISOFormat = function () {
    'use strict';
    var year = this.getUTCFullYear().toString(),
        month = (this.getUTCMonth() + 1).toString(),
        day = this.getUTCDate().toString(),
        hour = this.getUTCHours().toString(),
        minute = this.getUTCMinutes().toString(),
        seconds = this.getUTCSeconds().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];


    hour = hour[1] ? hour : '0' + hour[0];
    minute = minute[1] ? minute : '0' + minute[0];
    seconds = seconds[1] ? seconds : '0' + seconds[0];

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute +
        ':' + seconds + ' UTC';
};

/*
    Return a custom date in ISO format.
    The format returned is: YYYY-MM-DD
*/
Date.prototype.getCustomISODate = function () {
    'use strict';
    var year = this.getUTCFullYear().toString(),
        month = (this.getUTCMonth() + 1).toString(),
        day = this.getUTCDate().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];

    return year + '-' + month + '-' + day;
};

/*
    Return a custom time representation. This is mostly useful to calulate
    elapsed time.
    The full format returned is: X hours Y min. Z sec. T mill.

    If one of the values for hours, minutes, seconds or milliseconds is 0,
    it will not be returned.
*/
Date.prototype.getCustomTime = function () {
    'use strict';
    var l_hours = this.getUTCHours(),
        l_minutes = this.getUTCMinutes(),
        l_seconds = this.getUTCSeconds(),
        l_milliseconds = this.getMilliseconds(),
        l_time = '';

    if (l_hours !== 0) {
        l_time += l_hours.toString() + ' hours ';
    }

    if (l_minutes !== 0) {
        l_time += l_minutes.toString() + ' min. ';
    }

    if (l_seconds !== 0) {
        l_time += l_seconds.toString() + ' sec. ';
    }

    if (l_milliseconds !== 0) {
        l_time += l_milliseconds.toString() + ' mill.';
    }

    return l_time.trim();
};

/*
    Concatenate objects together in one single object.
*/
function CollectObjects() {
    'use strict';
    var return_obj = {},
        len = arguments.length,
        arg,
        i = 0,
        key;

    for (i = 0; i < len; i++) {
        arg = arguments[i];

        if (typeof arg === "object") {
            for (key in arg) {
                if (arg.hasOwnProperty(key)) {
                    return_obj[key] = arg[key];
                }
            }
        }
    }

    return return_obj;
}
