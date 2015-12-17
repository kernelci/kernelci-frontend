/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var base = {};

    base.sliceText = function(text, max) {
        var sliced = text;
        if (text.length > max) {
            sliced = text.slice(0, max - 1) + '\u2026';
        }
        return sliced;
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

    base.removeElement = function(id) {
        var el = document.getElementById(id);
        if (el !== null) {
            el.remove();
        }
    };

    return base;
});
