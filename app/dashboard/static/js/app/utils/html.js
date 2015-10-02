/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var html,
        htmlEntities;

    html = {};
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

    html.escape = function(toEscape) {
        return String(toEscape).replace(/[&<>"'\/]/g, function fromMap(s) {
            return htmlEntities[s];
        });
    };

    html.a = function() {
        return document.createElement('a');
    };

    html.i = function() {
        return document.createElement('i');
    };

    html.div = function() {
        return document.createElement('div');
    };

    html.span = function() {
        return document.createElement('span');
    };

    html.table = function() {
        return document.createElement('table');
    };

    html.strong = function() {
        return document.createElement('strong');
    };

    html.small = function() {
        return document.createElement('small');
    };

    html.h4 = function() {
        return document.createElement('h4');
    };

    html.h5 = function() {
        return document.createElement('h5');
    };

    html.dl = function() {
        return document.createElement('dl');
    };

    html.dt = function() {
        return document.createElement('dt');
    };

    html.dd = function() {
        return document.createElement('dd');
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

    html.build = function() {
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

    html.time = function() {
        return document.createElement('time');
    };

    html.replaceAllBySelector = function(selector, content) {
        [].forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                element.innerHTML = content;
            }
        );
    };

    html.replaceByClass = function(className, content) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                element.innerHTML = content;
            }
        );
    };

    html.replaceByClassNode = function(className, node) {
        [].forEach.call(
            document.getElementsByClassName(className),
            function(element) {
                while (element.firstChild) {
                    element.removeChild(element.firstChild);
                }
                element.appendChild(child);
            }
        );
    };

    html.replaceContent = function(element, child) {
        if (element !== null) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.appendChild(child);
        }
    };

    html.removeChildren = function(element) {
        if (element !== null) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    };

    html.unavailable = function() {
        var iNode,
            spanNode;

        iNode = document.createElement('i');
        iNode.className = 'fa fa-ban';
        spanNode = document.createElement('span');
        spanNode.setAttribute('rel', 'tooltip');
        spanNode.setAttribute('data-toggle', 'tooltip');
        spanNode.setAttribute('title', 'Not available');
        spanNode.appendChild(iNode);

        return spanNode;
    };

    html.addClass = function(element, newClass) {
        var classes;

        if (element !== null) {
            classes = element.className.split(' ');

            if (classes.indexOf(newClass) === -1) {
                element.className = classes.join(' ');
            }
        }
    };

    html.removeClass = function(element, className) {
        var classIdx,
            classes;

        if (element !== null) {
            classes = element.className.split(' ');
            classIdx = classes.indexOf(className);

            if (classIdx !== -1) {
                classes.splice(classIdx, 1);
            }

            element.className = classes.join(' ');
        }
    };

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

    return html;
});
