/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery'
], function($) {
    'use strict';
    var request,
        settings;

    request = {};
    settings = {
        traditional: true,
        cache: true,
        dataType: 'json',
        timeout: 35000,
        beforeSend: function(jqXHR) {
            jqXHR.setRequestHeader('X-CSRFToken', _getToken());
        }
    };

    function _getToken() {
        var token;

        token = null;
        if (document.querySelector('meta[name=csrf-token]') !== null) {
            token = document.querySelector('meta[name=csrf-token]').content;
        }
        return token;
    }

    function _makeRequest(method, url, data) {
        settings.headers = {'Content-Type': 'application/json'};
        settings.type = method;

        if (!data) {
            data = {};
        }
        settings.data = data;

        return $.ajax(url, settings);
    }

    request.get = function(url, data) {
        return _makeRequest('GET', url, data);
    };

    request.post = function(url, data) {
        return _makeRequest('POST', url, data);
    };

    return request;
});
