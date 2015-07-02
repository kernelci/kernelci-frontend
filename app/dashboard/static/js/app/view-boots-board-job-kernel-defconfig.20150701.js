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
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/urls'
], function($, b, e, i, r, u) {
    'use strict';
    var jobName,
        kernelName,
        defconfigFull,
        boardName,
        fileServer;

    function createBootLogContent(
            bootLogTxt, bootLogHtml, lab, fileServerURI, pathURI, na) {
        var retVal = na,
            logPath,
            displ = '';
        if (bootLogTxt !== null || bootLogHtml !== null) {
            if (bootLogTxt !== null) {
                if (bootLogTxt.search(lab) === -1) {
                    logPath = pathURI + '/' + lab + '/' + bootLogTxt;
                } else {
                    logPath = pathURI + '/' + bootLogTxt;
                }
                displ = '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View raw text boot log"><a href="' +
                    fileServerURI.path(logPath).normalizePath().href() +
                    '">txt' +
                    '&nbsp;<i class="fa fa-external-link"></i></a></span>';
            }

            if (bootLogHtml !== null) {
                if (bootLogTxt !== null) {
                    displ += '&nbsp;&mdash;&nbsp;';
                }
                if (bootLogHtml.search(lab) === -1) {
                    logPath = pathURI + '/' + lab + '/' + bootLogHtml;
                } else {
                    logPath = pathURI + '/' + bootLogHtml;
                }

                displ += '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View HTML boot log"><a href="' +
                    fileServerURI.path(logPath).normalizePath().href() +
                    '">html&nbsp;' +
                    '<i class="fa fa-external-link"></i></a></span>';
            }
            retVal = displ;
        }
        return retVal;
    }

    function getBootsFail() {
        b.removeElement('boot-reports-loading-div');
        b.replaceById(
            'other-reports-table-div',
            '<div class="pull-center"><strong>' +
            'Error loading data.</strong></div>'
        );
    }

    function getBootsDone(response) {
        var results = response.result,
            resLen = results.length,
            idx = 0,
            localResult,
            labName,
            createdOn,
            resultDescription,
            translatedURI,
            pathURI,
            fileServerURI,
            fileServerURL,
            fileServerResource,
            arch,
            bootLog,
            bootLogHtml,
            status,
            statusDisplay,
            fileServerData,
            lFileServer = fileServer,
            allRows = '',
            col0,
            col1,
            col2,
            col3,
            col4,
            col5,
            rowHref;

        if (resLen === 0) {
            b.removeElement('boot-reports-loading-div');
            b.replaceById(
                'other-reports-table-div',
                '<div class="pull-center"><strong>' +
                'No data available.</strong></div>'
            );
        } else {
            for (idx; idx < resLen; idx = idx + 1) {
                localResult = results[idx];
                labName = localResult.lab_name;
                createdOn = new Date(localResult.created_on.$date);
                resultDescription = localResult.boot_result_description;
                fileServerURL = localResult.file_server_url;
                fileServerResource = localResult.file_server_resource;
                arch = localResult.arch;
                bootLog = localResult.boot_log;
                bootLogHtml = localResult.boot_log_html;
                status = localResult.status;

                if (fileServerURL !== null && fileServerURL !== undefined) {
                    lFileServer = fileServerURL;
                }

                fileServerData = [
                    jobName, kernelName, arch + '-' + defconfigFull
                ];
                translatedURI = u.translateServerURL(
                    fileServerURL,
                    lFileServer, fileServerResource, fileServerData);
                fileServerURI = translatedURI[0];
                pathURI = translatedURI[1];

                switch (status) {
                    case 'PASS':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Boot completed"><span class="label ' +
                            'label-success"><i class="fa fa-check">' +
                            '</i></span></span>';
                        break;
                    case 'FAIL':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Boot failed">' +
                            '<span class="label label-danger">' +
                            '<i class="fa fa-exclamation-triangle"></i>' +
                            '</span></span>';
                        break;
                    case 'OFFLINE':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Board offline" ' +
                            '<span class="label label-info">' +
                            '<i class="fa fa-power-off"></i></span></span>';
                        break;
                    default:
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Unknown status"><span class="label ' +
                            'label-warning"><i class="fa fa-question"></i>' +
                            '</span></span>';
                        break;
                }

                col0 = '<td class="lab-column"><a class="table-link" ' +
                    'href="/boot/all/lab/' + labName + '/">' + labName +
                    '</a></td>';
                if (resultDescription !== null && status !== 'PASS') {
                    col1 = '<td class="failure-column">' +
                        '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="' + resultDescription + '">' +
                        resultDescription + '</span></td>';
                } else {
                    col1 = '<td>&nbsp;</td>';
                }

                col2 = '<td class="pull-center">';
                col2 += createBootLogContent(
                    bootLog,
                    bootLogHtml,
                    labName, fileServerURI, pathURI, '&nbsp;');
                col2 += '</td>';

                col3 = '<td class="date-column pull-center">' +
                    createdOn.getCustomISODate() + '</td>';
                col4 = '<td class="pull-center">' + statusDisplay + '</td>';

                rowHref = '/boot/' + boardName + '/job/' + jobName +
                    '/kernel/' + kernelName + '/defconfig/' + defconfigFull +
                    '/lab/' + labName + '/?_id=' + localResult._id.$oid;

                col5 = '<td><span rel="tooltip" data-toggle="tooltip"' +
                    'title="Details for board&nbsp;' + boardName +
                    ' with&nbsp;' + jobName + '&dash;' + kernelName +
                    '&dash;' + defconfigFull + '&nbsp;&dash;&nbsp;(' +
                    labName + ')"><a href="' + rowHref + '">' +
                    '<i class="fa fa-search"></i></a></span></td>';

                allRows += '<tr data-url="' + rowHref + '">' +
                    col0 + col1 + col2 + col3 + col4 + col5 + '</tr>';
            }

            b.removeElement('boot-reports-loading-div');
            b.replaceById('boot-reports-table-body', allRows);
            b.removeClass('multiple-labs-table', 'hidden');
        }
    }

    function getBoots() {
        var deferred,
            data;
        data = {
            'board': boardName,
            'job': jobName,
            'kernel': kernelName,
            'defconfig_full': defconfigFull
        };
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    $(document).ready(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        if (document.getElementById('board-name') !== null) {
            boardName = document.getElementById('board-name').value;
        }
        if (document.getElementById('defconfig-full') !== null) {
            defconfigFull = document.getElementById('defconfig-full').value;
        }
        if (document.getElementById('kernel-name') !== null) {
            kernelName = document.getElementById('kernel-name').value;
        }
        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }
        if (document.getElementById('file-server') !== null) {
            fileServer = document.getElementById('file-server').value;
        }

        b.replaceById(
            'dd-tree',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + jobName + '">' +
            '<a href="/boot/all/job/' + jobName + '">' + jobName +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + jobName +
            '"><a href="/job/' + jobName +
            '"><i class="fa fa-sitemap"></i></a></span>'
        );
        b.replaceById(
            'dd-git-describe',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot report details for&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' +
            kernelName + '"><a href="/boot/all/job/' + jobName +
            '/kernel/' + kernelName + '">' + kernelName +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' +
            kernelName + '"><a href="/build/' + jobName +
            '/kernel/' + kernelName +
            '"><i class="fa fa-cube"></i></a></span>'
        );
        b.replaceById(
            'dd-defconfig',
            defconfigFull + '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for build&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' + kernelName +
            '&nbsp;&dash;&nbsp;' + defconfigFull +
            '"><a href="/build/' + jobName + '/kernel/' +
            kernelName + '/defconfig/' + defconfigFull +
            '"><i class="fa fa-cube"></i></a></span>'
        );

        getBoots();
    });
});
