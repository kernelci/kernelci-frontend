/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
define(function() {
    'use strict';
    var base = {};

    base.getAttrBySelector = function(selector, attribute) {
        var el = document.querySelector(selector),
            attr = null;
        if (el !== null) {
            attr = el.getAttribute(attribute);
        }
        return attr;
    };

    base.getAttrById = function(elementID, attribute) {
        var el = document.getElementById(elementID),
            attr = null;
        if (el !== null) {
            attr = el.getAttribute(attribute);
        }
        return attr;
    };

    // Concatenate objects into a single one.
    base.collectObjects = function() {
        var fObject = {},
            i = 0,
            argLen = arguments.length,
            arg,
            key;

        for (i; i < argLen; i = i + 1) {
            arg = arguments[i];
            if (typeof arg === 'object') {
                for (key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        fObject[key] = arg[key];
                    }
                }
            }
        }
        return fObject;
    };

    base.replaceByClass = function(name, content) {
        var elements = document.getElementsByClassName(name);
        Array.prototype.filter.call(elements, function(element) {
            element.innerHTML = content;
        });
    };

    base.replaceById = function(name, content) {
        var el = document.getElementById(name);
        if (el !== null) {
            el.innerHTML = content;
        }
    };

    base.checkElement = function(element) {
        var tElement,
            dElement;
        if (element[0] === '#') {
            tElement = element.slice(1);
            dElement = element;
        } else {
            tElement = element;
            dElement = '#' + element;
        }
        return [tElement, dElement];
    };

    base.createModalDialog = function(id, title, body) {
        var mDialog = '<div class="modal fade" tabindex="-1" ' +
            'role="dialog" aria-hidden="true" id="' + id + '">';

        mDialog += '<div class="modal-dialog modal-lg larger-modal">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<button type="button" class="close" ' +
            'data-dismiss="modal"' +
            'aria-hidden="true">&times;</button>' +
            '<h3 class="modal-title" id="' + id + '-title">' +
            title + '</h3>' +
            '<div class="modal-body">' +
            body +
            '</div></div></div></div></div>';

        return mDialog;
    };

    base.addContent = function(id, content) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.innerHTML += content;
        }
    };

    base.addClass = function(id, className) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.className = el.className + ' ' + className;
        }
    };

    base.removeClass = function(id, className) {
        var el = document.getElementById(id),
            regEx;
        if (el !== null) {
            regEx = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
            el.className = el.className.replace(regEx, '');
        }
    };

    base.removeElement = function(id) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.remove();
        }
    };

    Element.prototype.remove = function() {
        this.parentElement.removeChild(this);
    };

    /*
        Return a custom date in ISO format.
        The format returned is: YYYY-MM-DD
    */
    Date.prototype.getCustomISODate = function() {
        var year = this.getUTCFullYear().toString(),
            month = (this.getUTCMonth() + 1).toString(),
            day = this.getUTCDate().toString();

        month = month[1] ? month : '0' + month[0];
        day = day[1] ? day : '0' + day[0];

        return year + '-' + month + '-' + day;
    };

    /*
        Return a custom date in ISO format, based on UTC time.
        The format returned is: YYYY-MM-DD HH:MM:SS UTC
    */
    Date.prototype.getCustomISOFormat = function() {
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
        Return a custom time representation. This is mostly useful to calulate
        elapsed time.
        The full format returned is: X hours Y min. Z sec. T mill.

        If one of the values for hours, minutes, seconds or milliseconds is 0,
        it will not be returned.
    */
    Date.prototype.getCustomTime = function() {
        var localHours = this.getUTCHours(),
            localMinutes = this.getUTCMinutes(),
            localSeconds = this.getUTCSeconds(),
            localMilliseconds = this.getMilliseconds(),
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

    return base;
});
