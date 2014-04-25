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

Date.prototype.getCustomISODate = function() {
    var year = this.getUTCFullYear().toString();
    var month = (this.getUTCMonth() + 1).toString();
    var day = this.getUTCDate().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];

    return year + '-' + month + '-' + day;
};
