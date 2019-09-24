/*!
 * Copyright (C) Linaro Limited 2015,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
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
    'utils/html'
], function(html) {
    'use strict';
    var gBoot;

    gBoot = {};

    /**
     * Create the boot logs element.
     *
     * @private
     * @param {string} txtLog: The TXT boot log file name.
     * @param {string} htmlLog: The HTML boot log file name.
     * @param {string} labName: The name of the boot lab.
     * @param {URI} serverURI: The URI of the file server.
     * @param {string} pathURI: The path part to the log file on the server.
     * @return {Element} An HTML node if at least on of txtLog or htmlLog
     * are not null or null.
    **/
    gBoot.logsNode = function(
            txtLog, htmlLog, labName, serverURI, pathURI) {
        var aNode,
            logPath,
            retVal,
            tooltipNode;

        retVal = null;
        if (txtLog || htmlLog) {
            retVal = document.createElement('span');

            if (txtLog) {
                if (txtLog.search(labName) === -1) {
                    logPath = pathURI + '/' + labName + '/' + txtLog;
                } else {
                    logPath = pathURI + '/' + txtLog;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View raw text log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href', serverURI.path(logPath).normalizePath().href());
                aNode.appendChild(document.createTextNode('txt'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                tooltipNode.appendChild(aNode);
                retVal.appendChild(tooltipNode);
            }

            if (htmlLog) {
                if (txtLog) {
                    retVal.insertAdjacentHTML(
                        'beforeend', '&nbsp;&mdash;&nbsp;');
                }

                if (htmlLog.search(labName) === -1) {
                    logPath = pathURI + '/' + labName + '/' + htmlLog;
                } else {
                    logPath = pathURI + '/' + htmlLog;
                }

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View HTML log');

                aNode = document.createElement('a');
                aNode.setAttribute(
                    'href', serverURI.path(logPath).normalizePath().href());
                aNode.appendChild(document.createTextNode('html'));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                tooltipNode.appendChild(aNode);
                retVal.appendChild(tooltipNode);
            }
        }

        return retVal;
    };

    return gBoot;
});
