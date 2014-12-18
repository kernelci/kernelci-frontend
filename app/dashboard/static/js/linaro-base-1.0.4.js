// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var JSBase = (function() {
    'use strict';

    var csrftoken = $('meta[name=csrf-token]').attr('content'),
        errorsContainer = $('#errors-container'),
        defaultErrorReason = 'Data call failed',
        defaultTimeout = 10000;

    // Make sure the element ID starts with #.
    // `elementID`: The element ID to check.
    function checkIfID(elementID) {
        var localElement = elementID;

        if (localElement[0] !== '#') {
            localElement = '#' + localElement;
        }
        return localElement;
    }

    // Make sure the class name starts with a dot.
    // `className`: The name of the class to check.
    function checkIfClass(className) {
        var localName = className;

        if (localName[0] !== '.') {
            localName = '.' + localName;
        }
        return localName;
    }

     // Add error alerts at the top of the page in the default container.
     // `id`: The id of the element to add.
     // `code`: The error code (int).
     // `reason`: Option reason that will be added to the error message.
    function setErrorAlert(id, code, reason) {
        var localId = checkIfID(id),
            text = '';

        text = '<div id="' + localId + '" ' +
            'class="alert alert-danger alert-dismissable">' +
            '<button type="button" class="close" ' +
            'data-dismiss="alert" aria-hidden="true">&times;</button>';

        if (reason !== null && reason !== undefined) {
            text = text + reason + '<br/>';
        }

        text = text +
            'Error while loading data from the server (error code:&nbsp;' +
            code + ').&nbsp;' +
            'Please contact the website administrators.';

        text = text + '</div>';

        errorsContainer.append(text);
        $(localId).alert();
    }

    // Load static HTML content from an URL.
    // `elementID`: The ID of the element.
    // `contentURL`: The URL where the static content will be taken.
    function loadHTMLContent(elementID, contentURL) {
        var realID = checkIfID(elementID);
        $(realID).empty().load(contentURL);
    }

    // Create a simple bash script for git bisection.
    // `badCommit`: The starting point for the bisect script.
    // `goodCommit`: The end point.
    function createBisectShellScript(badCommit, goodCommit) {
        var bisectScript = '';

        if (badCommit !== null && goodCommit !== null) {
            bisectScript = '#!/bin/bash\ngit bisect start ' +
                badCommit + ' ' + goodCommit + '\n';
        }
        return 'data:text/plain;charset=UTF-8,' +
            encodeURIComponent(bisectScript);
    }

    // Replace content of an element based on its id.
    // `elementID`: The ID of the element to search.
    // `staticContent`: The content that the element will be replaced with.
    function replaceContentByID(elementID, staticContent) {
        var realID = checkIfID(elementID);
        $(realID).empty().append(staticContent);
    }

    // Replace content of elements based on their class name.
    // It loops through all the elements removing their content and appending
    // the provided one.
    // `className`: The name of the class to search.
    // `staticContent`: The content that the elements will be replaced with.
    function replaceContentByClass(className, staticContent) {
        var realClass = checkIfClass(className);
        $(realClass).each(function() {
            $(this).empty().append(staticContent);
        });
    }

    // Return an ajax promise.
    // `url`: The URL for the ajax call.
    // `method`: The type of ajax call, default to 'GET'.
    // `data`: The data to be passed to the ajax call.
    // `successFunction`: Optional function, or array of functions,
    // to be called on success.
    // `errorFunction`: Optional function to be call on error.
    // `errorReason`: Error message to be displayed.
    // `headers`: Optional headers to set for the ajax call.
    // `errorId`: ID to use for the error message div element.
    function createDeferredCall(url, method, data, successFunction,
        errorFunction, errorReason, headers, errorId) {

        var ajaxSettings, ajaxCall;

        if (method === null || method === undefined) {
            method = 'GET';
        }

        if (errorReason === null || errorReason === undefined) {
            errorReason = defaultErrorReason;
        }

        if (errorId === null || errorId === undefined) {
            errorId = '#error';
        } else {
            errorId = checkIfID(errorId);
        }

        ajaxSettings = {
            'type': method,
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'beforeSend': function(jqXHR) {
                jqXHR.setRequestHeader('X-CSRFToken', csrftoken);
            },
            'timeout': defaultTimeout,
            'statusCode': {
                400: function() {
                    setErrorAlert(errorId + '-400', 404, errorReason);
                },
                403: function() {
                    setErrorAlert(errorId + '-403', 403, errorReason);
                },
                404: function() {
                    setErrorAlert(errorId + '-404', 404, errorReason);
                },
                408: function() {
                    errorReason = errorReason + 'nbsp;(timeout)';
                    setErrorAlert(errorId + '-408', 408, errorReason);
                },
                500: function() {
                    setErrorAlert(errorId + '-500', 500, errorReason);
                }
            }
        };

        if (data !== null && data !== undefined) {
            ajaxSettings.data = data;
        }

        if (successFunction !== null && successFunction !== undefined) {
            ajaxSettings.success = successFunction;
        }

        if (errorFunction !== null && errorFunction !== undefined) {
            ajaxSettings.error = errorFunction;
        }

        if (headers !== null && headers !== undefined) {
            ajaxSettings.headers = headers;
        }

        ajaxCall = $.ajax(url, ajaxSettings);
        return ajaxCall;
    }

    /*
        Populate the sidebar navigation with the provided elements.
        The "Top" link, is already populated since it's available in the base
        template.

        elements: An array of objects. Each object must have the href, and name
        attributes set. An optional subnav attribute can be defined, and must
        be another array of similar objects, to add a navigation sub-level.
    */
    function populateSideBarNav(elements) {
        if (elements === undefined || elements === null) {
            return;
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

                sidebarNav += '<li><a href="' + checkIfID(element.href) +
                    '">' + element.name + '</a>';

                // Add subnav links (only if really available).
                if (element.hasOwnProperty('subnav') &&
                        element.subnav !== null) {
                    subNav = element.subnav;
                    subNavLen = subNav.length;

                    sidebarNav += '<ul class="nav">';
                    for (j; j < subNavLen; j = j + 1) {
                        sidebarNav += '<li><a href="' +
                            checkIfID(subNav[j].href) +
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

    /*
        Concatenate objects together in one single object.
    */
    function collectObjects() {
        var returnObject = {},
            len = arguments.length,
            arg,
            i = 0,
            key;

        for (i = 0; i < len; i = i + 1) {
            arg = arguments[i];

            if (typeof arg === 'object') {
                for (key in arg) {
                    if (arg.hasOwnProperty(key)) {
                        returnObject[key] = arg[key];
                    }
                }
            }
        }

        return returnObject;
    }

    // Enable keyboard hotkeys/shortcuts.
    function setHotKeys() {
        var selectSearch = function() {
                $('.input-sm').focus();
            },
            selectTableLength = function() {
                $('.length-menu .input-sm').focus();
            },
            goToHome = function() {
                window.location = $('#home-l')[0].href;
            },
            goToJob = function() {
                window.location = $('#job-l')[0].href;
            },
            goToBuild = function() {
                window.location = $('#build-l')[0].href;
            },
            goToBoot = function() {
                window.location = $('#boot-l')[0].href;
            },
            goToInfo = function() {
                window.location = $('#info-l')[0].href;
            },
            showHelp = function() {
                $('#modal-hotkeys').modal('show');
            };

        $(document).mapHotKeys(
            [{
                    key: '/',
                    action: selectSearch
                }, {
                    key: 'l',
                    action: selectTableLength
                },
                $.mapHotKeys.createSequence('s', 'h', $(document), showHelp),
                $.mapHotKeys.createSequence('g', 'h', $(document), goToHome),
                $.mapHotKeys.createSequence('g', 'j', $(document), goToJob),
                $.mapHotKeys.createSequence('g', 'b', $(document), goToBuild),
                $.mapHotKeys.createSequence('g', 't', $(document), goToBoot),
                $.mapHotKeys.createSequence('g', 'i', $(document), goToInfo)
            ]
        );
    }

    function translateCommitURL(commitURL, commitId) {
        var uriParser,
            hostName,
            knownGit,
            baseURL = '',
            urlPath,
            newCommitURL = '',
            translateRule,
            lenTranslate,
            i,
            urlTranslation = $('#url-translation').val();

        if ((commitURL !== null && commitURL !== undefined) &&
                (commitId !== null && commitId !== undefined) &&
                urlTranslation !== 'None') {

            urlTranslation = JSON.parse(urlTranslation);

            uriParser = new URI(commitURL);
            hostName = uriParser.hostname();
            urlPath = uriParser.path();

            if (urlTranslation.hasOwnProperty(hostName)) {
                knownGit = urlTranslation[hostName];
                translateRule = knownGit[3];
                lenTranslate = translateRule.length;

                for (i = 0; i < lenTranslate; i = i + 1) {
                    urlPath = urlPath.replace(
                        translateRule[i][0], translateRule[i][1]);
                }

                baseURL = new URI({
                    protocol: knownGit[0],
                    hostname: hostName,
                    path: knownGit[1].replace('%s', urlPath)
                });

                newCommitURL = new URI({
                    protocol: knownGit[0],
                    hostname: hostName,
                    path: knownGit[2].replace('%s', urlPath) + commitId
                });

                baseURL = baseURL.href();
                newCommitURL = newCommitURL.href();
            }
        }
        return [baseURL, newCommitURL];
    }

    // Set up the base functionalities common to (almost) all pages.
    function init() {
        setHotKeys();

        var body = $('body');

        body.tooltip({
            'selector': '[rel=tooltip]',
            'placement': 'auto top'
        });

        body.scrollspy({
            target: '#sidebar-nav'
        });

        $('.clickable-table tbody').on('click', 'tr', function() {
            var url = $(this).data('url');
            if (url) {
                window.location = url;
            }
        });

        $('.btn-group > .btn').click(function() {
            $(this).addClass('active').siblings().removeClass('active');
        });
    }

    return {
        collectObjects: collectObjects,
        createBisectShellScript: createBisectShellScript,
        createDeferredCall: createDeferredCall,
        init: init,
        loadHTMLContent: loadHTMLContent,
        populateSideBarNav: populateSideBarNav,
        replaceContentByClass: replaceContentByClass,
        replaceContentByID: replaceContentByID,
        setErrorAlert: setErrorAlert,
        translateCommitURL: translateCommitURL
    };
}());

/*
    Return a custom date in ISO format.
    The format returned is: YYYY-MM-DD
*/
Date.prototype.getCustomISODate = function() {
    'use strict';
    var year = this.getUTCFullYear().toString(),
        month = (this.getUTCMonth() + 1).toString(),
        day = this.getUTCDate().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];

    return year + '-' + month + '-' + day;
};

/*
    Return a custom date in ISO format, based on UTC time.
    The format returned is: YYYY-MM-DD HH:MM:SS UTC
*/
Date.prototype.getCustomISOFormat = function() {
    'use strict';
    var year = this.getUTCFullYear().toString(),
        month = (this.getUTCMonth() + 1).toString(),
        day = this.getUTCDate().toString(),
        hour = this.getUTCHours().toString(),
        minute = this.getUTCMinutes().toString(),
        seconds = this.getUTCSeconds().toString();

    month = month[1] ? month : '0' + month[0];
    day = day[1] ? day : '0' + day[0];

    hour = hour[1] ? hour : '0' + hour[0];
    minute = minute[1] ? minute : '0' + minute[0];
    seconds = seconds[1] ? seconds : '0' + seconds[0];

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minute +
        ':' + seconds + ' UTC';
};

/*
    Return a custom time representation. This is mostly useful to calulate
    elapsed time.
    The full format returned is: X hours Y min. Z sec. T mill.

    If one of the values for hours, minutes, seconds or milliseconds is 0,
    it will not be returned.
*/
Date.prototype.getCustomTime = function() {
    'use strict';
    var localHours = this.getUTCHours(),
        localMinutes = this.getUTCMinutes(),
        localSeconds = this.getUTCSeconds(),
        localMilliseconds = this.getMilliseconds(),
        localTime = '';

    if (localHours !== 0) {
        localTime += localHours.toString() + ' hours ';
    }

    if (localMinutes !== 0) {
        localTime += localMinutes.toString() + ' min. ';
    }

    if (localSeconds !== 0) {
        localTime += localSeconds.toString() + ' sec. ';
    }

    if (localMilliseconds !== 0) {
        localTime += localMilliseconds.toString() + ' mill.';
    }

    if (!localTime) {
        localTime = '0';
    }

    return localTime.trim();
};
