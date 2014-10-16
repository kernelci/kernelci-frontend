var csrftoken = $('meta[name=csrf-token]').attr('content');

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

function setXhrHeader (xhr) {
    /*
        Set the CSRF token header for ajax request.
        xhr: The xhr object to add the header to.
    */
    'use strict';
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
}

function loadContent (elementId, staticContent) {
    /*
        Load some static content replacing what is inside the provided element.
        elementId: The ID of the element to empty and re-populate.
        staticContent: URI of the static content HTML to load.
    */
    'use strict';
    var localId = elementId;

    if (elementId[0] !== '#') {
        localId = '#' + elementId;
    }

    $(localId).empty().load(staticContent);
}
