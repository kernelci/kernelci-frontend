/*! Kernel CI Dashboard v2015.8.3 | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery'
], function($) {
    'use strict';
    var storage = {};

    function setClass(element, value) {
        $(element).each(function() {
            $(this).addClass(value);
        });
    }

    function setAttr(element, attribute, value) {
        $(element).each(function() {
            $(this).attr(attribute, value);
        });
    }

    function toJson(objects) {
        var json = {};
        if (arguments.length) {
            json = JSON.stringify(objects);
        }
        return json;
    }

    storage.Session = function(name) {
        var that = this;
        if (arguments.length) {
            that.name = name;
            that.objects = null;
        }
    };

    storage.load = function(name) {
        var loaded = false,
            sessionItem,
            sessionState = {},
            key,
            data;
        if (window.Storage) {
            if (arguments.length) {
                sessionItem = sessionStorage.getItem(name);
                if (sessionItem) {
                    sessionState = JSON.parse(sessionItem);
                    for (key in sessionState) {
                        if (sessionState.hasOwnProperty(key)) {
                            data = sessionState[key];
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
                                        loaded = loaded && false;
                                        break;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            console.warn('Loading from session/local storage is not supported');
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
