/*! Kernel CI Dashboard v2015.8.2 | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'utils/git-rules'
], function(p, gitRules) {
    'use strict';
    var urls = {};

    urls.translateServerURL = function(vUrl, url, path, data) {
        var sPath = '',
            sURL,
            tURI,
            tURIp;
        if (url !== null && url !== undefined) {
            sURL = url;
        } else {
            sURL = vUrl;
        }

        if (path !== null && path !== undefined) {
            sPath = path;
        } else {
            if (data !== null && data !== undefined) {
                data.forEach(function(value) {
                    sPath = sPath + value + '/';
                });
            }
        }

        tURI = new URI(sURL);
        tURIp = tURI.path() + '/' + sPath;
        return [tURI, tURIp];
    };

    urls.translateCommit = function(url, sha) {
        var bURL = null,
            cURL = null,
            idx = 0,
            parser,
            hostName,
            urlPath,
            knownGit,
            rule,
            lenRule;

        if ((url !== null && url !== '') && (sha !== null && sha !== '')) {
            parser = new URI(url);
            hostName = parser.hostname();
            urlPath = parser.path();

            // Perform translation only if we know the host.
            if (gitRules.hasOwnProperty(hostName)) {
                knownGit = gitRules[hostName];
                rule = knownGit[3];
                lenRule = rule.length;

                for (idx; idx < lenRule; idx = idx + 1) {
                    urlPath = urlPath.replace(rule[idx][0], rule[idx][1]);
                }

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
