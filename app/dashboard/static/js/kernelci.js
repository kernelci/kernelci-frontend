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
Date.prototype.getCustomISOFormat = function() {
    var year = this.getUTCFullYear().toString();
    var month = (this.getUTCMonth() + 1).toString();
    var day = this.getUTCDate().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];

    var hour = this.getUTCHours().toString();
    var minute = this.getUTCMinutes().toString();
    var seconds = this.getUTCSeconds().toString();

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
Date.prototype.getCustomISODate = function() {
    var year = this.getUTCFullYear().toString();
    var month = (this.getUTCMonth() + 1).toString();
    var day = this.getUTCDate().toString();

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
Date.prototype.getCustomTime = function() {
    var l_hours = this.getUTCHours(),
        l_minutes = this.getUTCMinutes(),
        l_seconds = this.getUTCSeconds(),
        l_milliseconds = this.getMilliseconds(),
        l_time = '';

    if (l_hours != 0) {
        l_time += l_hours.toString() + ' hours ';
    }

    if (l_minutes != 0) {
        l_time += l_minutes.toString() + ' min. ';
    }

    if (l_seconds != 0) {
        l_time += l_seconds.toString() + ' sec. ';
    }

    if (l_milliseconds != 0) {
        l_time += l_milliseconds.toString() + ' mill.';
    }

    return l_time.trim();
};
