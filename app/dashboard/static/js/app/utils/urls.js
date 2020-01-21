/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
define([
    'utils/git-rules',
    'URI'
], function(gitRules, URI) {
    'use strict';
    var urls;

    urls = {};

    if (!String.format) {
        String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] !== null ? args[number] : match;
          });
        };
    }

    /**
     * Concatenate the path and extra path to create a full URL.
     * @param  {URI}    base      The base URI
     * @param  {Array}  paths     The other paths to join
     * @return {String}           The normalized href
     */
    urls.getHref = function(base, paths) {
        return base
            .path(URI.joinPaths.apply(null, paths))
            .normalizePath()
            .href();
    };

    /**
     * Create just the path of an URL,
     * @param  {Array} paths
     * @return {String}
     */
    urls.createPathHref = function(paths) {
        return URI.joinPaths.apply(null, paths).href();
    };

    /**
     * Create the file server URL and its path.
     * @param  {String} serverURL The file server URL
     * @param  {Object} data      The object from which to take the data
     * @return {Array}            A 2-values array: the file server URI,
     * and the path
     */
    urls.createFileServerURL = function(serverURL, data) {
        var translatedURL;
        var serverURI;

        translatedURL = [null, null];
        if (serverURL) {
            serverURI = new URI(serverURL);

            translatedURL[0] = serverURI;

            if (data.file_server_resource) {
                translatedURL[1] = URI
                    .joinPaths(serverURI.path(), data.file_server_resource)
                    .path();
            } else {
                if (data.version === '1.0') {
                    translatedURL[1] = URI
                        .joinPaths(
                            data.job,
                            data.kernel,
                            data.arch + '-' +
                            (data.defconfig_full || data.defconfig))
                        .path();
                } else {
                    translatedURL[1] = URI
                        .joinPaths(
                            data.job,
                            data.git_branch,
                            data.kernel,
                            data.arch,
                            (data.defconfig_full || data.defconfig))
                        .path();
                }
            }
        }

        return translatedURL;
    };

    /**
        Return a list with:
        0. The base git URL
        1. The git commit URL
    */
    urls.translateCommit = function(url, sha) {
        var baseUrl;
        var commitUrl;
        var hostName;
        var rule;
        var parser;
        var urlPath;
        var commitPath;

        function replaceRule(value) {
            urlPath = urlPath.replace(value[0], value[1]);
        }

        baseUrl = null;
        commitUrl = null;
        if (url && sha) {
            parser = new URI(url);
            hostName = parser.hostname();
            urlPath = parser.path();

            // Perform translation only if we know the host.
            if (gitRules.hasOwnProperty(hostName)) {
                rule = gitRules[hostName];

                rule[3].forEach(replaceRule);

                if (rule[4]) {
                    hostName = rule[4];
                }

                baseUrl = new URI({
                    protocol: rule[0],
                    hostname: hostName,
                    path: String.format(rule[1], urlPath)
                });

                commitPath = String.format(rule[2], urlPath);
                commitPath += sha;
                commitUrl = new URI({
                    protocol: rule[0],
                    hostname: hostName,
                    path: commitPath
                });

                baseUrl = baseUrl.href();
                commitUrl = commitUrl.href();
            }
        }
        return [baseUrl, commitUrl];
    };

    return urls;
});
