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
    'utils/html'
], function(html) {
    'use strict';
    var gCommonButtons;

    gCommonButtons = {};

    /**
     * Apply a display style of 'block' to the element.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function showAllElement(element) {
        element.style.setProperty('display', 'block');
    }

    /**
     * Apply a display style of 'none' to the element.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function hideAllElement(element) {
        element.style.setProperty('display', 'none');
    }

    /**
     * Show all elements by their class name.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function showAllByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), showAllElement);
    }

    /**
     * Hide all elements identified by a class name.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function hideAllByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), hideAllElement);
    }

    /**
     * Show all elements based on a class.
     *
     * @param {string} className: The name of the class.
    **/
    gCommonButtons.showAllByClass = function(className) {
        showAllByClass(className);
    };

    /**
     * Hide all elements based on a class.
     *
     * @param {string} className: The name of the class.
    **/
    gCommonButtons.hideAllByClass = function(className) {
        hideAllByClass(className);
    };

    /**
     * Function to show/hide failed/successfull/unknown classed elements.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gCommonButtons.showHideElements = function(event) {
        var element,
            target;

        function _makeActiveInactive(child) {
            if (child === target) {
                html.addClass(target, 'active');
            } else {
                html.removeClass(child, 'active');
            }
        }

        element = event.target || event.srcElement;

        // If we click on the graph lagend, we might click not directly into
        // the cell itself, but on the number, that does not have an id set.
        // Look for its parent node that is the cell.
        if (!element.id) {
            element = element.parentElement;
        }

        switch (element.id) {
            case 'success-cell':
                target = document.getElementById('success-btn');
                if (!target.hasAttribute('disabled')) {
                    hideAllByClass('df-failed');
                    showAllByClass('df-success');
                    showAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'success-btn':
                hideAllByClass('df-failed');
                showAllByClass('df-success');
                hideAllByClass('df-unknown');
                break;
            case 'fail-cell':
                target = document.getElementById('fail-btn');
                if (!target.hasAttribute('disabled')) {
                    showAllByClass('df-failed');
                    hideAllByClass('df-success');
                    hideAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'fail-btn':
                showAllByClass('df-failed');
                hideAllByClass('df-success');
                hideAllByClass('df-unknown');
                break;
            case 'unknown-cell':
                target = document.getElementById('unknown-btn');
                if (!target.hasAttribute('disabled')) {
                    hideAllByClass('df-failed');
                    hideAllByClass('df-success');
                    showAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'unknown-btn':
                hideAllByClass('df-failed');
                hideAllByClass('df-success');
                showAllByClass('df-unknown');
                break;
            default:
                showAllByClass('df-failed');
                showAllByClass('df-success');
                showAllByClass('df-unknown');

                target = document.getElementById('all-btn');
                [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                break;
        }
    };

    return gCommonButtons;
});
