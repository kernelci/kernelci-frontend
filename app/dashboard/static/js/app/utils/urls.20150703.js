/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
