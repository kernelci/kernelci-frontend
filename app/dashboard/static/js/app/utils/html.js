/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/date'
], function() {
    'use strict';
    var html,
        htmlEntities;

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
        '=': '&#61;',
        '>': '&#62;',
        '?': '&#63;'
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
        return String(toEscape).replace(/[$#%&<>"'\/=]/g, _getHTMLFromMap);
    };

    html.boot = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-hdd-o';

        return iNode;
    };

    html.external = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-external-link';

        return iNode;
    };

    html.search = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-search';

        return iNode;
    };

    html.tree = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-sitemap';

        return iNode;
    };

    html.build = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-cube';

        return iNode;
    };

    html.soc = function() {
        var iNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-server';

        return iNode;
    };

    html.nonavail = function() {
        var tooltipNode,
            iNode;

        tooltipNode = document.createElement('span');
        tooltipNode.setAttribute('title', 'Not available');
        tooltipNode.setAttribute('rel', 'tooltip');
        tooltipNode.setAttribute('data-toggle', 'tooltip');

        iNode = document.createElement('i');
        iNode.className = 'fa fa-ban';

        tooltipNode.appendChild(iNode);

        return tooltipNode;
    };

    html.errorDiv = function(text) {
        var divNode,
            strongNode;

        divNode = document.createElement('div');
        divNode.className = 'pull-center';

        strongNode = document.createElement('strong');
        strongNode.appendChild(document.createTextNode(text));

        divNode.appendChild(strongNode);

        return divNode;
    };

    html.building = function() {
        var spanNode,
            iNode;

        spanNode = document.createElement('span');
        spanNode.className = 'label label-info';
        iNode = document.createElement('i');
        iNode.className = 'fa fa-cogs';
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.fail = function() {
        var spanNode,
            iNode;

        spanNode = document.createElement('span');
        spanNode.className = 'label label-danger';
        iNode = document.createElement('i');
        iNode.className = 'fa fa-exclamation-triangle';
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.success = function() {
        var spanNode,
            iNode;

        spanNode = document.createElement('span');
        spanNode.className = 'label label-success';
        iNode = document.createElement('i');
        iNode.className = 'fa fa-check';
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.unknown = function() {
        var spanNode,
            iNode;

        spanNode = document.createElement('span');
        spanNode.className = 'label label-warning';
        iNode = document.createElement('i');
        iNode.className = 'fa fa-question';
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.offline = function() {
        var spanNode,
            iNode;

        spanNode = document.createElement('span');
        spanNode.className = 'label label-info';
        iNode = document.createElement('i');
        iNode.className = 'fa fa-power-off';
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.tooltip = function() {
        var element;

        element = document.createElement('span');
        element.setAttribute('rel', 'tooltip');
        element.setAttribute('data-toggle', 'tooltip');

        return element;
    };

    html.replaceAllBySelectorHTML = function(selector, replacement) {
        [].forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                _cleanElementChildren(element);
                element.insertAdjacentHTML('beforeend', replacement);
            }
        );
    };

    html.replaceAllBySelectorTxt = function(selector, txt) {
        [].forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                _cleanElementChildren(element);
                element.appendChild(document.createTextNode(txt));
            }
        );
    };

    html.replaceAllBySelector = function(selector, content) {
        [].forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                _cleanElementChildren(element);
                element.insertAdjacentHTML('beforeend', content);
            }
        );
    };

    html.replaceByClassHTML = function(className, replacement) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                _cleanElementChildren(element);
                element.insertAdjacentHTML('beforeend', replacement);
            }
        );
    };

    html.replaceByClassTxt = function(className, txt) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                _cleanElementChildren(element);
                element.appendChild(document.createTextNode(txt));
            }
        );
    };

    html.replaceByClass = function(className, content) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                _cleanElementChildren(element);
                element.insertAdjacentHTML('beforeend', content);
            }
        );
    };

    html.replaceByClassNode = function(className, child) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                _cleanElementChildren(element);
                element.appendChild(child);
            }
        );
    };

    html.replaceContent = function(element, child) {
        if (element !== null) {
            _cleanElementChildren(element);
            element.appendChild(child);
        }
    };

    html.replaceContentHTML = function(element, replacement) {
        if (element !== null) {
            _cleanElementChildren(element);
            element.insertAdjacentHTML('beforeend', replacement);
        }
    };

    /**
     * Remove all children elements of the elements identified by a CSS class.
     *
     * @param {string} className: The name of the CSS class.
    **/
    html.removeChildrenByClass = function(className) {
        [].forEach.call(
            document.getElementsByClassName(className),
            _cleanElementChildren
        );
    };

    /**
     * Remove all children elements of an element.
     *
     * @param {Element} element: The DOM element.
    **/
    html.removeChildren = function(element) {
        if (element !== null) {
            _cleanElementChildren(element);
        }
    };

    /**
     * Add a CSS class to an element.
     * The new class won't be inserted if already there.
     *
     * @param {Element} element: The DOM element.
     * @param {string} className: The name of the class to add.
    **/
    html.addClass = function(element, className) {
        var classes;

        if (element !== null) {
            classes = element.className.split(' ');

            if (classes.indexOf(className) === -1) {
                classes.push(className);
                element.className = classes.join(' ');
            }
        }
    };

    /**
     * Remove a CSS class from an element.
     *
     * @param {Element} element: The DOM element.
     * @param {string} className: The name of the class to add.
    **/
    html.removeClass = function(element, className) {
        var classIdx,
            classes;

        if (element !== null) {
            classes = element.className.split(' ');
            classIdx = classes.indexOf(className);

            if (classIdx !== -1) {
                classes.splice(classIdx, 1);
                element.className = classes.join(' ');
            }
        }
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
        var element,
            value;

        element = document.querySelector(selector);
        value = null;
        if (element !== null) {
            value = element.getAttribute(attribute);
        }

        return value;
    };

    html.attrById = function(elementId, attribute) {
        var element,
            value;

        element = document.getElementById(elementId);
        value = null;
        if (element !== null) {
            value = element.getAttribute(attribute);
        }

        return value;
    };

    html.removeElement = function(element) {
        if (element !== null) {
            element.parentElement.removeChild(element);
        }
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
        var classes,
            hasClass;

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
        var created,
            timeNode;

        created = new Date(date.$date);
        timeNode = document.createElement('time');
        timeNode.setAttribute('datetime', created.toISOString());
        timeNode.appendChild(
            document.createTextNode(created.toCustomISODate()));

        return timeNode;
    };

    return html;
});
