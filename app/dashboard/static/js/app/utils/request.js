// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
        'timeout': 12000,
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

        if (data !== null && data !== undefined) {
            settings.data = data;
        }

        return $.ajax(url, settings);
    };

    return {
        get: get,
        post: post
    };
});
