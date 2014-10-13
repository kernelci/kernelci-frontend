function setErrorAlert (id, code, reason) {
    /*
     * Pass code (int) and id (string) to alert an error on the page.
     * Optionally pass a reason (string) for the error.
    */
    'use strict';

    var localId = id,
        text = '';

    if (id[0] !== '#') {
        localId = '#' + id;
    }

    text = '<div id="' + localId + '" ' +
        'class="alert alert-danger alert-dismissable">' +
        '<button type="button" class="close" ' +
        'data-dismiss="alert" aria-hidden="true">&times;</button>';

    if (reason !== undefined) {
        text += reason + '<br/>';
    }
    
    text += 'Error while loading data from the server (error code:&nbsp;' +
        code + ').&nbsp;' +
        'Please contact the website administrators.';

    text += '</div>';

    $('#errors-container').append(text);
    $(localId).alert();
}
