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
    // objects := an array of objects to concatenate.
    base.collectObjects = function(objects) {
        var collected = {};

        if (objects !== null && objects.constructor === Array) {
            objects.forEach(function(obj) {
                if (obj !== null && obj === Object(obj)) {
                    Object.keys(obj).forEach(function(key) {
                        collected[key] = obj[key];
                    });
                }
            });
        }

        return collected;
    };

    base.replaceByClass = function(name, content) {
        [].forEach
            .call(
                document.getElementsByClassName(name),
                function(element) {
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
        var element;
        element = document.getElementById(id);
        if (element !== null) {
            element.className = element.className + ' ' + className;
        }
    };

    base.elementAddClass = function(element, className) {
        if (element !== null) {
            element.className = element.className + ' ' + className;
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

    base.elementRemoveClass = function(element, className) {
        var regEx;
        if (element !== null && className !== '') {
            regEx = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
            element.className = element.className.replace(regEx, '');
        }
    };

    Element.prototype.remove = function() {
        this.parentElement.removeChild(this);
    };

    base.removeElement = function(id) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.remove();
        }
    };

    // Round a number down to 2 decimal positions.
    // This should work even when a integer is passed and should be returned
    // unchanged.
    function roundToTwo(value) {
        return +(Math.round(value + 'e+2') + 'e-2');
    }

    // Parse a byte number and return its human-readable form.
    base.bytesToHuman = function(bytes) {
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

    return base;
});
