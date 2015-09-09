/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'jquery',
    'bootstrap'
], function(p, $) {
    'use strict';
    var err = {},
        errorElement = document.getElementById('errors-container'),
        text,
        elementId;

    text = '<div id="%s" class="alert alert-danger alert-dismissable">' +
        '<button type="button" class="close" data-dismiss="alert" ' +
        'aria-hidden="true">&times;</button>' +
        'Error while loading data from the server (error code: %d).' +
        '&nbsp;Please contact the website administrators.</div>';
    elementId = 'error-%d';

    // Create random ID value for the error notification.
    function randId(code) {
        return 'error-' + (Math.random() * ((code + 100) - code) + code);
    }

    function createError(code) {
        var id,
            err;

        id = randId(code);
        err = p.sprintf(text, id, code);

        errorElement.innerHTML = errorElement.innerHTML + err;
        $('#' + id).alert();
    }

    err.error = function(response) {
        createError(response.status);
    };

    err.customError = function(code, message) {
        var id,
            err;

        id = randId(code);
        err = '<div id="' + id +
            '" class="alert alert-danger alert-dismissable">' +
            '<button type="button" class="close" data-dismiss="alert" ' +
            'aria-hidden="true">&times;</button>' +
            message + '&nbsp;(error code: ' + code + ').' + '</div>';

        errorElement.innerHTML = errorElement.innerHTML + err;
        $('#' + id).alert();
    };

    return err;
});
