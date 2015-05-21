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
    'sprintf'
], function(p) {
    'use strict';
    var urls = {};
    require(['URI']);

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

    urls.translateCommit = function(url, sha, rules) {
        var bURL = null,
            cURL = null,
            i = 0,
            tRules,
            parser,
            hostName,
            urlPath,
            knownGit,
            rule,
            lenRule;
        if (arguments.length === 3) {
            if ((url !== null && url !== '') && (sha !== null && sha !== '') &&
                (rules !== null && rules !== '' && rules !== 'None'))
            {
                tRules = JSON.parse(rules);
                parser = new URI(url);
                hostName = parser.hostname();
                urlPath = parser.path();

                // Perform translation only if we know the host.
                if (tRules.hasOwnProperty(hostName)) {
                    knownGit = tRules[hostName];
                    rule = knownGit[3];
                    lenRule = rule.length;

                    for (i; i < lenRule; i = i + 1) {
                        urlPath = urlPath.replace(rule[i][0], rule[i][1]);
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
        }
        return [bURL, cURL];
    };

    return urls;
});
