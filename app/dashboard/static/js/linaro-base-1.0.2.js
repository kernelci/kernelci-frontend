var csrftoken = $('meta[name=csrf-token]').attr('content');

function setErrorAlert(id, code, reason) {
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

function setXhrHeader(xhr) {
    /*
        Set the CSRF token header for ajax request.
        xhr: The xhr object to add the header to.
    */
    'use strict';
    xhr.setRequestHeader('X-CSRFToken', csrftoken);
}

function loadContent(elementId, staticContent) {
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

function populateSideBarNav(elements) {
    /*
        Populate the sidebar navigation with the provided elements.
        The "Top" link, is already populated since it's available in the base
        template.

        elements: An array of objects. Each object must have the href, and name
        attributes set. An optional subnav attribute can be defined, and must
        be another array of similar objects, to add a navigation sub-level.
    */
    'use strict';

    if (elements === undefined || elements === null) {
        return;
    }

    function checkHref(href) {
        if (href[0] !== '#') {
            href = '#' + href;
        }
        return href;
    }

    var sidebarNav = '',
        arrayLen = elements.length,
        element = null,
        i = 0,
        j = 0,
        subNav = null,
        subNavLen;

    // Append the stuff only if we have the element.
    // On mobile platforms the element is not available.
    if ($('#sidebar-nav').length !== 0) {
        sidebarNav = '<ul class="nav sidenav">' +
            '<li class="active"><a href="#top">Top</a></li>';

        for (i; i < arrayLen; i = i + 1) {
            element = elements[i];

            sidebarNav += '<li><a href="' + checkHref(element.href) +
                '">' + element.name + '</a>';

            // Add subnav links (only if really available).
            if (element.hasOwnProperty('subnav') && element.subnav !== null) {
                subNav = element.subnav;
                subNavLen = subNav.length;

                sidebarNav += '<ul class="nav">';
                for (j; j < subNavLen; j = j + 1) {
                    sidebarNav += '<li><a href="' +
                        checkHref(subNav[j].href) +
                        '">' + subNav[j].name +
                        '</a></li>';
                }

                sidebarNav += '</ul></li>';
            }

            sidebarNav += '</li>';
        }

        sidebarNav += '</ul>';

        $('#sidebar-nav').empty().append(sidebarNav);
        $('[data-spy="scroll"]').each(function() {
            $(this).scrollspy('refresh');
        });
    }
}

function createBisectScriptURI(badCommit, goodCommit) {
    'use strict';
    var bisectScript = '#!/bin/bash\n' +
        'git bisect start ' + badCommit + ' ' + goodCommit + '\n';

    return 'data:text/plain;charset=UTF-8,' + encodeURIComponent(bisectScript);
}
