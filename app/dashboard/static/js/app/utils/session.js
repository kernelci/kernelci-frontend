/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var gSession;

    gSession = {};

    function setClass(selector, value) {
        [].forEach.call(
            document.querySelectorAll(selector),
            function(element) {
                element.className = value;
            }
        );
    }

    function setAttr(selector, attribute, value) {
        [].forEach.call(
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
                    setAttr(key, data.name, data.value);
                    break;
                case 'class':
                    isLoaded = true;
                    setClass(key, data.value);
                    break;
                default:
                    isLoaded = false;
                    break;
            }
        }

        return isLoaded;
    }

    function parseSession(key, data) {
        var eachLoaded,
            isLoaded;

        isLoaded = false;
        if (data.constructor === Array) {
            data.forEach(function(value) {
                eachLoaded = loadSession(key, value);
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
