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
