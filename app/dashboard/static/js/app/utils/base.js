/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var base = {},
        sizes,
        numFormat;

    sizes = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    numFormat = new Intl.NumberFormat(['en-US']);

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

    base.addContent = function(id, content) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.innerHTML += content;
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
