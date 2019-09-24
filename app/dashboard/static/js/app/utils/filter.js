/*!
 * Copyright (C) Linaro Limited 2015,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
    var gFilter,
        kciFilter;

    kciFilter = {
        input: null,
        filteredElements: null,
        searchableElements: null
    };

    /**
     * Re-show the DOM element.
     *
     * @private
     * @param {Element} element: The DOM element to show.
    **/
    function unhide(element) {
        element.style.display = 'block';
        html.removeClass(element, 'filtered');
    }

    /**
     * Verify if a string matches a list of regular expressions.
     *
     * @private
     * @param {String} string: The string to check.
     * @param {Array} regexArray: The array with regular expressons to check.
     * @return {Boolean}
    **/
    function match(string, regexArray) {
        var matches;

        matches = true;

        function _hasMatch(regEx) {
            if (string && string.search(regEx) !== -1) {
                matches = matches & true;
            } else {
                matches = false;
            }
        }

        regexArray.forEach(_hasMatch);

        return matches;
    }

    /**
     * Check that a string is not empty.
     *
     * @private
     * @param {String} string: The string to check.
     * @return {Boolean}
    **/
    function noEmpty(string) {
        if (string && string.trim() !== '') {
            return true;
        }
        return false;
    }

    /**
     * Create a new regular expression based on the passed string.
     *
     * @private
     * @param {String} string: The string the will be used as a regex.
     * @return {RegEx} A new regular expression.
    **/
    function createRegEx(string) {
        try {
            return new RegExp(string, 'ig');
        } catch (ignore) {
            return new RegExp('');
        }
    }

    /**
     * Re-show all the hidden elements and reset the search field.
     * This can be used before saving the page state.
    **/
    kciFilter.unload = function() {
        if (this.filteredElements) {
            this.filteredElements.forEach(unhide);
        }
        this.input.value = '';
    };

    /**
     * Filter the elements in the page based on the search value typed.
    **/
    kciFilter.filterEvent = function(event) {
        var allSearch,
            dataIndex,
            elementIndex,
            filteredElements,
            target;

        target = event.target || event.srcElement;
        filteredElements = this.filteredElements;

        function _filter(element) {
            dataIndex = element.getAttribute('data-index');

            if (!match(dataIndex, allSearch)) {
                // Hide the element only if it really is shown.
                if (element.style.display === 'block' ||
                        !element.style.display) {
                    html.addClass(element, 'filtered');
                    element.style.display = 'none';

                    filteredElements.push(element);
                }
            } else {
                if (filteredElements.length > 0) {
                    elementIndex = filteredElements.indexOf(element);
                    if (elementIndex !== -1) {
                        unhide(element);

                        filteredElements.splice(elementIndex, 1);
                    }
                }
            }
        }

        if (target.value) {
            allSearch = target.value
                .replace(/"/g, '\\"')
                .replace(/'/g, '\'')
                .toLowerCase().split(' ');

            // Remove empty strings.
            allSearch = allSearch.filter(noEmpty);
            // Create the regex.
            allSearch = allSearch.map(createRegEx);

            [].forEach.call(this.searchableElements, _filter);
        } else {
            if (filteredElements.length > 0) {
                filteredElements.forEach(function(element) {
                    element.style.display = 'block';
                });
            }
        }
    };

    /**
     * Complete the object setup.
    **/
    kciFilter.setup = function() {
        this.input.addEventListener('input', this.filterEvent.bind(this));
        this.filteredElements = [];
        this.searchableElements = document.getElementsByClassName('searchable');

        return this;
    };

    /**
     * Create a new filter-handling object.
    **/
    gFilter = function(inputId) {
        var newObject;

        newObject = Object.create(kciFilter);
        if (inputId) {
            newObject.input = document.getElementById(inputId);
        } else {
            newObject.input = document.querySelector('input');
        }

       return newObject.setup();
    };

    return gFilter;
});
