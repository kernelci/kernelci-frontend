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
    'jquery',
    'bootstrap'
], function($) {
    'use strict';
    var err;

    err = {};

    // Create random ID value for the error notification.
    function randId(code) {
        return 'error-' + (Math.random() * ((code + 100) - code) + code);
    }

    function createErrorDiv(code, message) {
        var buttonNode,
            divNode;

        divNode = document.createElement('div');
        divNode.id = randId(code);
        divNode.className = 'alert alert-danger alert-dismissable';

        buttonNode = document.createElement('button');
        buttonNode.className = 'close';
        buttonNode.setAttribute('type', 'button');
        buttonNode.setAttribute('data-dismiss', 'alert');
        buttonNode.setAttribute('aria-hidden', 'true');
        buttonNode.insertAdjacentHTML('beforeend', '&times;');

        divNode.appendChild(buttonNode);

        if (message !== '' && message !== undefined && message !== null) {
            divNode.insertAdjacentHTML('beforeend', message);
        } else {
            divNode.appendChild(
                document.createTextNode(
                    'Error while loading data from the server ' +
                    '(error code: ' + code + ').')
            );
            divNode.appendChild(document.createTextNode(' '));
            divNode.appendChild(
                document.createTextNode(
                    'Please contact the website administrator'));
        }

        return divNode;
    }

    function createError(code) {
        var divNode,
            errorElement;

        errorElement = document.getElementById('errors-container');
        divNode = createErrorDiv(code);
        errorElement.appendChild(divNode);

        $('#' + divNode.id).alert();
    }

    err.error = function(response) {
        createError(response.status);
    };

    err.customError = function(code, message) {
        var divNode,
            errorElement;

        errorElement = document.getElementById('errors-container');
        divNode = createErrorDiv(code, message);
        errorElement.appendChild(divNode);

        $('#' + divNode.id).alert();
    };

    return err;
});
