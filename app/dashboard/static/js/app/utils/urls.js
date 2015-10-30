/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'utils/git-rules',
    'URI'
], function(p, gitRules, URI) {
    'use strict';
    var urls;

    urls = {};

    // Translate a URL into a URI object.
    // Return a 2-elements list:
    //  0. The URI object
    //  1. The URI path
    // In case the server URL is not valid, it returns a 2-nulls list.
    urls.translateServerURL = function(serverUrl, serverPath, data) {
        var serverUri,
            translatedUrl,
            validPath;

        function addPath(value) {
            validPath = validPath + value + '/';
        }

        if (serverUrl) {
            if (serverPath) {
                validPath = serverPath;
            } else {
                validPath = '';
                if (data) {
                    data.forEach(addPath);
                }
            }

            serverUri = new URI(serverUrl);
            translatedUrl = [serverUri, serverUri.path() + '/' + validPath];
        } else {
            translatedUrl = [null, null];
        }

        return translatedUrl;
    };

    /*
        Return a list with:
        0. The base git URL
        1. The git commit URL
    */
    urls.translateCommit = function(url, sha) {
        var bURL,
            cURL,
            hostName,
            knownGit,
            parser,
            urlPath;

        function replaceRule(value) {
            urlPath = urlPath.replace(value[0], value[1]);
        }

        bURL = null;
        cURL = null;
        if (url && sha) {
            parser = new URI(url);
            hostName = parser.hostname();
            urlPath = parser.path();

            // Perform translation only if we know the host.
            if (gitRules.hasOwnProperty(hostName)) {
                knownGit = gitRules[hostName];

                knownGit[3].forEach(replaceRule);

                bURL = new URI({
                    protocol: knownGit[0],
                    hostname: hostName,
                    path: p.sprintf(knownGit[1], urlPath)
                });
                cURL = new URI({
                    protocol: knownGit[0],
                    hostname: hostName,
                    path: p.sprintf(knownGit[2], urlPath) + sha
                });

                bURL = bURL.href();
                cURL = cURL.href();
            }
        }
        return [bURL, cURL];
    };

    return urls;
});
