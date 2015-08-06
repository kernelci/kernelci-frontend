/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'jquery',
    'bootstrap'
], function(p, $) {
    'use strict';
    var error,
        errorElement = document.getElementById('errors-container'),
        text,
        elementId;

    text = '<div id="%s" class="alert alert-danger alert-dismissable">' +
        '<button type="button" class="close" data-dismiss="alert" ' +
        'aria-hidden="true">&times;</button>' +
        'Error while loading data from the server (error code: %d).' +
        '&nbsp;Please contact the website administrators.</div>';
    elementId = 'error-%d';

    function createError(code) {
        var id,
            err;

        id = p.sprintf(
            elementId, Math.random() * ((code + 100) - code) + code);
        err = p.sprintf(text, id, code);

        errorElement.innerHTML = errorElement.innerHTML + err;
        $('#' + id).alert();
    }

    error = function(response) {
        createError(response.status);
    };

    return {
        error: error
    };
});
