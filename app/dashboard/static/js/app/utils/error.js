/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'bootstrap'
], function($, html) {
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
                    'Please contanct the website administrator'));
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
