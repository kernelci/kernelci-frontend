/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var base = {},
        sizes,
        numFormat,
        entityMap;

    entityMap = {
        '"': '&#34;',
        '#': '&#35;',
        '$': '&#36;',
        '%': '&#37;',
        '&': '&#38;',
        '\'': '&#39;',
        '/': '&#47;',
        '<': '&#60;',
        '=': '&#61;',
        '>': '&#62;',
        '?': '&#63;'
    };

    sizes = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    numFormat = new Intl.NumberFormat(['en-US']);

    base.escapeHtml = function(string) {
        return String(string).replace(/[&<>"'\/]/g, function fromMap(s) {
            return entityMap[s];
        });
    };

    base.sliceText = function(text, max) {
        var sliced = text;
        if (text.length > max) {
            sliced = text.slice(0, max - 1) + '\u2026';
        }
        return sliced;
    };

    base.formatNumber = function(value) {
        return numFormat.format(value);
    };

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

    // Round a number down to 2 decimal positions.
    // This should work even when a integer is passed and should be returned
    // unchanged.
    function roundToTwo(value) {
        return +(Math.round(value + 'e+2') + 'e-2');
    }

    // Parse a byte number and return its human-readable form.
    base.bytesToHuman = function(bytes) {
        var retVal,
            base = 1024,
            idx;
        if (bytes === 0) {
            retVal = '0 bytes';
        } else {
            idx = Math.floor(Math.log(bytes) / Math.log(base));
            retVal = formatNumber(roundToTwo(bytes / Math.pow(base, idx))) +
                ' ' + sizes[idx];
        }
        return retVal;
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
