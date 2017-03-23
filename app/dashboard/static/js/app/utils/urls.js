/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'utils/git-rules',
    'URI'
], function(p, gitRules, URI) {
    'use strict';
    var urls;

    urls = {};

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
