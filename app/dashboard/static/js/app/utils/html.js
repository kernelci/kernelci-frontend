/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
define([
    'utils/date'
], function() {
    'use strict';
    var html;
    var htmlEntities;

    html = {};
    // Characters that should be HTML-escaped.
    htmlEntities = {
        '"': '&#34;',
        '#': '&#35;',
        '$': '&#36;',
        '%': '&#37;',
        '&': '&#38;',
        '\'': '&#39;',
        '/': '&#47;',
        '<': '&#60;',
        '>': '&#62;'
    };

    /**
     * Remove children elements from a DOM element.
     *
     * @param {Element} element: The parent element.
    **/
    function _cleanElementChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Retrieve the specified char from the HTML-escape map.
     *
     * @param {string} char: The character to escape.
    **/
    function _getHTMLFromMap(char) {
        return htmlEntities[char];
    }

    /**
     * Parse a string and HTML-escape its characters.
     *
     * @param {string} toEscape: The string to parse and HTML-escape.
    **/
    html.escape = function(toEscape) {
        return String(toEscape).replace(/[$#%&<>"'\/]/g, _getHTMLFromMap);
    };

    html.boot = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-hdd-o';

        return frag;
    };

    html.external = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-external-link';

        return frag;
    };

    html.search = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-search';

        return frag;
    };

    html.tree = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-sitemap';

        return frag;
    };

    html.build = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-cube';

        return frag;
    };

    html.soc = function() {
        var frag;
        var iNode;

        frag = document.createDocumentFragment();

        iNode = frag.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-server';

        return frag;
    };

    html.nonavail = function() {
        var child;
        var frag;
        var tooltip;

        frag = document.createDocumentFragment();

        tooltip = frag.appendChild(document.createElement('span'));
        tooltip.setAttribute('title', 'Not available');
        tooltip.setAttribute('rel', 'tooltip');
        tooltip.setAttribute('data-toggle', 'tooltip');

        child = tooltip.appendChild(document.createElement('i'));
        child.className = 'fa fa-ban';

        return frag;
    };

    html.errorDiv = function(text) {
        var divNode;
        var frag;
        var strongNode;

        frag = document.createDocumentFragment();

        divNode = frag.appendChild(document.createElement('div'));
        divNode.className = 'pull-center';

        strongNode = divNode.appendChild(document.createElement('strong'));
        strongNode.appendChild(document.createTextNode(text));

        return frag;
    };

    html.building = function(extraClass) {
        var frag;
        var iNode;
        var spanNode;

        frag = document.createDocumentFragment();

        spanNode = frag.appendChild(document.createElement('span'));
        spanNode.className = 'label label-info label-status';
        if (extraClass && extraClass.trim().length > 0) {
            spanNode.className += ' ' + extraClass;
        }
        iNode = spanNode.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-cogs';

        return frag;
    };

    html.fail = function(extraClass) {
        var frag;
        var iNode;
        var spanNode;

        frag = document.createDocumentFragment();

        spanNode = frag.appendChild(document.createElement('span'));
        spanNode.className = 'label label-danger label-status';
        if (extraClass && extraClass.trim().length > 0) {
            spanNode.className += ' ' + extraClass;
        }
        iNode = spanNode.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-exclamation-triangle';

        return frag;
    };

    html.success = function(extraClass) {
        var frag;
        var iNode;
        var spanNode;

        frag = document.createDocumentFragment();

        spanNode = frag.appendChild(document.createElement('span'));
        spanNode.className = 'label label-success label-status';
        if (extraClass && extraClass.trim().length > 0) {
            spanNode.className += ' ' + extraClass;
        }
        iNode = spanNode.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-check';

        return frag;
    };

    html.unknown = function(extraClass) {
        var frag;
        var iNode;
        var spanNode;

        frag = document.createDocumentFragment();

        spanNode = frag.appendChild(document.createElement('span'));
        spanNode.className = 'label label-warning label-status';
        if (extraClass && extraClass.trim().length > 0) {
            spanNode.className += ' ' + extraClass;
        }
        iNode = spanNode.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-question';

        return frag;
    };

    html.offline = function(extraClass) {
        var frag;
        var iNode;
        var spanNode;

        frag = document.createDocumentFragment();

        spanNode = frag.appendChild(document.createElement('span'));
        spanNode.className = 'label label-info label-status';
        if (extraClass && extraClass.trim().length > 0) {
            spanNode.className += ' ' + extraClass;
        }
        iNode = spanNode.appendChild(document.createElement('i'));
        iNode.className = 'fa fa-power-off';

        return frag;
    };

    html.tooltip = function() {
        var element;

        element = document.createElement('span');
        element.setAttribute('rel', 'tooltip');
        element.setAttribute('data-toggle', 'tooltip');

        return element;
    };

    html.replaceAllBySelectorHTML = function(selector, replacement) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.querySelectorAll(selector),
                function(element) {
                    _cleanElementChildren(element);
                    element.insertAdjacentHTML('beforeend', replacement);
                });
        }, 5);
    };

    html.replaceAllBySelectorTxt = function(selector, txt) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.querySelectorAll(selector),
                function(element) {
                    _cleanElementChildren(element);
                    element.appendChild(document.createTextNode(txt));
                });
        }, 5);
    };

    html.replaceAllBySelector = function(selector, content) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.querySelectorAll(selector),
                function(element) {
                    _cleanElementChildren(element);
                    element.insertAdjacentHTML('beforeend', content);
                });
        }, 5);
    };

    html.replaceByClassHTML = function(className, replacement) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.getElementsByClassName(className),
                function(element) {
                    _cleanElementChildren(element);
                    element.insertAdjacentHTML('beforeend', replacement);
                });
        }, 5);
    };

    html.replaceByClassTxt = function(className, txt) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.getElementsByClassName(className),
                function(element) {
                    _cleanElementChildren(element);
                    element.appendChild(document.createTextNode(txt));
                });
        }, 5);
    };

    html.replaceByClass = function(className, content) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.getElementsByClassName(className),
                function(element) {
                    _cleanElementChildren(element);
                    element.insertAdjacentHTML('beforeend', content);
                });
        }, 5);
    };

    html.replaceByClassNode = function(className, child) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.getElementsByClassName(className),
                function(element) {
                    _cleanElementChildren(element);
                    element.appendChild(child.cloneNode(true));
                });
        }, 5);
    };

    html.replaceContent = function(element, child) {
        setTimeout(function() {
            if (element) {
                _cleanElementChildren(element);
                element.appendChild(child);
            }
        }, 5);
    };

    html.replaceContentHTML = function(element, replacement) {
        setTimeout(function() {
            if (element) {
                _cleanElementChildren(element);
                element.insertAdjacentHTML('beforeend', replacement);
            }
        }, 5);
    };

    /**
     * Remove all children elements of the elements identified by a CSS class.
     *
     * @param {string} className: The name of the CSS class.
    **/
    html.removeChildrenByClass = function(className) {
        setTimeout(function() {
            Array.prototype.forEach.call(
                document.getElementsByClassName(className),
                _cleanElementChildren
            );
        }, 5);
    };

    /**
     * Remove all children elements of an element.
     *
     * @param {Element} element: The DOM element.
    **/
    html.removeChildren = function(element) {
        if (element) {
            _cleanElementChildren(element);
        }
    };

    /**
     * The internal function to add a class to a DOM element.
     *
     * @private
    **/
    function _addClass(element, className) {
        var classes;
        classes = element.className.split(' ');

        if (classes.indexOf(className) === -1) {
            classes.push(className);
            element.className = classes.join(' ').trim();
        }
    }

    /**
     * Add a CSS class to an element.
     * The new class won't be inserted if already there.
     *
     * @param {Element} element: The DOM element.
     * @param {string} className: The name of the class to add.
    **/
    html.addClass = function(element, className) {
        if (element) {
            _addClass(element, className);
        }
    };

    /**
     * Add CSS classes to an element.
     * The new classes won't be inserted if already there.
     *
     * @param {Element} element: The DOM element.
     * @param {Array} classes: The list of classes to add.
    **/
    html.addClasses = function(element, classes) {
        if (element) {
            classes.forEach(function(className) {
                _addClass(element, className);
            });
        }
    };

    function _removeClass(element, className) {
        var classIdx;
        var classes;

        classes = element.className.split(' ');
        classIdx = classes.indexOf(className);

        if (classIdx !== -1) {
            classes.splice(classIdx, 1);
            element.className = classes.join(' ').trim();
        }
    }

    /**
     * Remove a CSS class from an element.
     *
     * @param {Element} element: The DOM element.
     * @param {string} className: The name of the class to add.
    **/
    html.removeClass = function(element, className) {
        setTimeout(function() {
            if (element) {
                _removeClass(element, className);
            }
        }, 5);
    };

    html.removeClasses = function(element, classes) {
        setTimeout(function() {
            if (element) {
                classes.forEach(function(className) {
                    _removeClass(element, className);
                });
            }
        }, 5);
    };

    /**
     * Get the specified attribute of an elmenet via a query selector.
     * If multiple elements are identified using the specified selector, only
     * the first one retrieved will be considered.
     *
     * @param {string} selector: The selector query string.
     * @param {string} attribute: The name of the attribute to retrieve.
    **/
    html.attrBySelector = function(selector, attribute) {
        var element;
        var value;

        element = document.querySelector(selector);
        value = null;
        if (element) {
            value = element.getAttribute(attribute);
        }

        return value;
    };

    html.attrById = function(elementId, attribute) {
        var element;
        var value;

        element = document.getElementById(elementId);
        value = null;
        if (element) {
            value = element.getAttribute(attribute);
        }

        return value;
    };

    html.removeElement = function(element) {
        setTimeout(function() {
            if (element && element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }, 5);
    };

    html.sliceText = function(text, max) {
        var sliced;

        sliced = text;
        if (text.length > max) {
            sliced = text.slice(0, max - 1) + '\u2026';
        }
        return sliced;
    };

    /**
     * Check if a DOM element has the provided class applied.
     *
     * @param {Element} element: The DOM element to check.
     * @param {string} className: The name of the CSS class.
     * @return {Boolean} True or false.
    **/
    html.classed = function(element, className) {
        var classes;
        var hasClass;

        hasClass = false;
        if (element) {
            classes = element.className.split(' ');
            if (classes.indexOf(className) !== -1) {
                hasClass = true;
            }
        }
        return hasClass;
    };

    html.time = function(date) {
        var created;
        var frag;
        var timeNode;

        frag = document.createDocumentFragment();

        created = new Date(date.$date);
        timeNode = frag.appendChild(document.createElement('time'));
        timeNode.setAttribute('datetime', created.toISOString());
        timeNode.appendChild(
            document.createTextNode(created.toCustomISODate()));

        return frag;
    };

    html.timeDate = function(date) {
        var created;
        var frag;
        var timeNode;

        frag = document.createDocumentFragment();

        created = new Date(date.$date);
        timeNode = frag.appendChild(document.createElement('time'));
        timeNode.setAttribute('datetime', created.toISOString());
        timeNode.appendChild(
            document.createTextNode(created.toCustomISODateTime()));

        return frag;
    };

    return html;
});
