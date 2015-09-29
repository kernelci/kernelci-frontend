/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var storage = {};

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

    function toJson(objects) {
        var json;

        json = {};
        if (objects !== null && objects !== undefined) {
            json = JSON.stringify(objects);
        }

        return json;
    }

    function loadSessionData(key, data) {
        var loaded;
        loaded = false;

        if (data.value !== null && data.value !== '') {
            switch (data.type) {
                case 'attr':
                    loaded = loaded || true;
                    setAttr(key, data.name, data.value);
                    break;
                case 'class':
                    loaded = loaded || true;
                    setClass(key, data.value);
                    break;
                default:
                    loaded = false;
                    break;
            }
        }

        return loaded;
    }

    function parseSessionData(key, data) {
        var loaded,
            eachLoaded;

        loaded = false;
        if (data.constructor === Array) {
            data.forEach(function(value) {
                eachLoaded = loadSessionData(key, value);
                loaded = loaded || eachLoaded;
            });
        } else {
            loaded = loadSessionData(key, data);
        }

        return loaded;
    }

    storage.Session = function(name) {
        var that;

        that = this;
        if (name !== null && name !== undefined) {
            that.name = name;
            that.objects = null;
        }
    };

    storage.load = function(name) {
        var loaded,
            sessionItem,
            sessionState;

        loaded = false;
        if (window.Storage) {
            if (name !== null && name !== undefined) {
                sessionState = {};
                sessionItem = sessionStorage.getItem(name);
                if (sessionItem) {
                    sessionState = JSON.parse(sessionItem);
                    Object.keys(sessionState).forEach(function(key) {
                        loaded = parseSessionData(key, sessionState[key]);
                    });
                }
            }
        } else {
            console.warn('Loading from session storage is not supported');
        }
        return loaded;
    };

    storage.save = function(session) {
        if (window.Storage) {
            try {
                sessionStorage.setItem(session.name, toJson(session.objects));
            } catch (e) {
                if (e === QUOTA_EXCEEDED_ERR) {
                    console.error(
                        'Error saving to session storage: quota exceeded');
                } else {
                    console.error('Error saving to session storage');
                }
            }
        } else {
            console.warn('Saving to session/local storage is not supported');
        }
    };

    return storage;
});
