/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery'
], function($) {
    'use strict';
    var get,
        post,
        request,
        settings,
        token = null;

    if (document.querySelector('meta[name=csrf-token]') !== null) {
        token = document.querySelector('meta[name=csrf-token]').content;
    }

    settings = {
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'timeout': 35000,
        'beforeSend': function(jqXHR) {
            jqXHR.setRequestHeader('X-CSRFToken', token);
        }
    };

    get = function(url, data) {
        return request('GET', url, data);
    };

    post = function(url, data) {
        return request('POST', url, data);
    };

    request = function(method, url, data) {
        settings.headers = {'Content-Type': 'application/json'};
        settings.type = method;

        if (data === null || data === undefined) {
            data = {};
        }
        settings.data = data;

        return $.ajax(url, settings);
    };

    return {
        get: get,
        post: post
    };
});
