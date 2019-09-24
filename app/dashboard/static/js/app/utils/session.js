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
define(function() {
    'use strict';
    var gSession;

    gSession = {};

    function setClass(selector, value) {
        Array.prototype.forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                element.className = value;
            }
        );
    }

    function setAttr(selector, attribute, value) {
        Array.prototype.forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                element.setAttribute(attribute, value);
            }
        );
    }

    function loadSession(key, data) {
        var isLoaded;

        isLoaded = false;
        if (data.value) {
            switch (data.type) {
                case 'attr':
                    isLoaded = true;
                    if (data.value) {
                        setAttr(key, data.name, data.value);
                    }
                    break;
                case 'class':
                    isLoaded = true;
                    if (data.value) {
                        setClass(key, data.value);
                    }
                    break;
                default:
                    isLoaded = false;
                    break;
            }
        }

        return isLoaded;
    }

    function parseSession(key, data) {
        var eachLoaded;
        var isLoaded;

        isLoaded = false;
        if (data.constructor === Array) {
            data.forEach(function(value) {
                eachLoaded = setTimeout(loadSession.bind(null, key, value), 0);
                isLoaded = isLoaded || eachLoaded;
            });
        } else {
            isLoaded = loadSession(key, data);
        }

        return isLoaded;
    }

    gSession.load = function(objects) {
        var isLoaded;

        isLoaded = false;
        function _isLoaded(key) {
            if (objects.hasOwnProperty(key)) {
                isLoaded = parseSession(key, objects[key]);
            }
        }

        Object.keys(objects).forEach(_isLoaded);

        return isLoaded;
    };

    return gSession;

});
