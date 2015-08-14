/*! Kernel CI Dashboard v2015.8.3 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/show-hide-btns'
], function($, i, b, e, r, u, bisect, btns) {
    'use strict';
    var boardName = null,
        jobName = null,
        kernelName = null,
        defconfigName = null,
        labName = null,
        bootId = null,
        fileServer = null,
        dateRange = 14,
        // How many comparisons we should retrieve.
        comparedToLimit = 3,
        nonAvail;

    nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i></span>';

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

    function createBootTableRow(data) {
        var createdOn = new Date(data.created_on.$date),
            resultDescription = data.boot_result_description,
            fileServerURL = data.file_server_url,
            fileServerResource = data.file_server_resource,
            arch = data.arch,
            bootLog = data.boot_log,
            bootLogHtml = data.boot_log_html,
            defconfigFull = data.defconfig_full,
            lab = data.lab_name,
            job = data.job,
            kernel = data.kernel,
            statusDisplay = '',
            pathURI = null,
            fileServerURI = null,
            rowHref = '',
            col0,
            col1,
            col2,
            col3,
            col4,
            col5,
            lFileServer = fileServer,
            fileServerData,
            translatedURI;

        if (fileServerURL !== null && fileServerURL !== undefined) {
            lFileServer = fileServerURL;
        }
        fileServerData = [
            job, kernel, arch + '-' + defconfigFull
        ];
        translatedURI = u.translateServerURL(
            fileServerURL, lFileServer, fileServerResource, fileServerData);
        fileServerURI = translatedURI[0];
        pathURI = translatedURI[1];

        switch (data.status) {
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

        col0 = '<td class="lab-column">' + lab + '</td>';
        if (resultDescription !== null) {
            col1 = '<td class="failure-column">';
            col1 += '<span rel="tooltip" data-toggle="tooltip"' +
                'title="' + resultDescription + '">' +
                resultDescription + '</span>';
            col1 += '</td>';
        } else {
            col1 = '<td class="failure-column">&nbsp;</td>';
        }

        col2 = '<td class="pull-center">';
        col2 += createBootLogContent(
            bootLog, bootLogHtml, lab, fileServerURI, pathURI, '&nbsp;');
        col2 += '</td>';

        col3 = '<td class="date-column pull-center">' +
            createdOn.getCustomISODate() + '</td>';
        col4 = '<td class="pull-center">' + statusDisplay + '</td>';

        rowHref = '/boot/' + boardName + '/job/' + job +
            '/kernel/' + kernel + '/defconfig/' + defconfigFull +
            '/lab/' + lab + '/?_id=' + data._id.$oid;

        col5 = '<td><span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for board&nbsp;' + boardName +
            'with&nbsp;' +
            job + '&dash;' + kernel + '&dash;' +
            defconfigFull +
            '&nbsp;&dash;&nbsp;(' + lab + ')' +
            '"><a href="' + rowHref + '">' +
            '<i class="fa fa-search"></i></a></span></td>';

        return '<tr data-url="' + rowHref + '">' +
            col0 + col1 + col2 + col3 + col4 + col5 + '</tr>';
    }

    function generalCompareToTable(response, tableID, tableBodyID) {
        var results = response.result,
            resLen = results.length,
            idx = 0,
            rows = '';
        if (resLen > 0) {
            for (idx; idx < resLen; idx = idx + 1) {
                rows += createBootTableRow(results[idx]);
            }
            b.replaceById(tableBodyID, rows);
            b.removeClass(tableID, 'hidden');
        } else {
            b.replaceById(
                tableBodyID,
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No recent results found.</strong>' +
                '</td></tr>'
            );
            b.removeClass(tableID, 'hidden');
        }
    }

    function getCompareToNextFail() {
        b.removeElement('boot-reports-compared-to-load');
        b.replaceById(
            'compare-to-next-div',
            '<div class="pull-center"><p><strong>' +
            'Error downloading data compared to next.' +
            '</strong></p></div>'
        );
    }

    function getCompareToNextDone(response) {
        b.removeElement('boot-reports-compared-to-load');
        generalCompareToTable(
            response, 'compare-to-next-table', 'compare-to-next-table-body');
    }

    function getCompareToMainlineFail() {
        b.removeElement('boot-reports-compared-to-load');
        b.replaceById(
            'compare-to-mainline-div',
            '<div class="pull-center"><p><strong>' +
            'Error downloading data compared to mainline.' +
            '</strong></p></div>'
        );
    }

    function getCompareToMainlineDone(response) {
        b.removeElement('boot-reports-compared-to-load');
        generalCompareToTable(
            response,
            'compare-to-mainline-table', 'compare-to-mainline-table-body');
    }

    function getMultiLabDataFail() {
        b.replaceById('boot-reports-loading-div', '');
        b.replaceById(
            'other-reports-table-div',
            '<div class="pull-center">' +
            '<strong>Error loading data.</strong></div>'
        );
    }

    function getMultiLabDataDone(response) {
        var results = response.result,
            resLen = results.length,
            localRes,
            validReports = 0,
            allRows = '',
            localLabName,
            idx = 0;

        b.replaceById(
            'boot-reports-loading-div',
            '<i class="fa fa-cog fa-spin"></i>&nbsp;' +
            '<span>analyzing boot reports data&hellip;</span>'
        );

        if (resLen > 0) {
            for (idx; idx < resLen; idx = idx + 1) {
                localRes = results[idx];
                localLabName = localRes.lab_name;

                if (localLabName !== labName) {
                    validReports = validReports + 1;
                    allRows += createBootTableRow(localRes);
                }
            }

            if (validReports === 0) {
                b.replaceById('boot-reports-table-body',
                    '<tr><td colspan="6" class="pull-center">' +
                    '<strong>No similar boot reports found.</strong>' +
                    '</td></tr>'
                );
            } else {
                b.replaceById('boot-reports-table-body', allRows);
            }
        } else {
            b.replaceById(
                'boot-reports-table-body',
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No data available.</strong></td></tr>'
            );
        }
        b.replaceById('boot-reports-loading-div', '');
        b.removeElement('boot-reports-loading-div');
        b.removeClass('multiple-labs-table', 'hidden');
    }

    function getMultiLabData() {
        var deferred,
            data;
        data = {
            'kernel': kernelName,
            'job': jobName,
            'defconfig_full': defconfigName,
            'board': boardName,
            'field': [
                '_id', 'lab_name', 'boot_log', 'boot_log_html',
                'boot_result_description', 'defconfig', 'defconfig_full',
                'created_on', 'status', 'arch', 'job', 'kernel'
            ]
        };
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getMultiLabDataFail)
            .done(getMultiLabDataDone);
    }

    function getBootDataFail() {
        b.replaceByClass(
            'loading-content',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>'
        );
    }

    function getCompareData(response) {
        var data,
            deferred,
            result = response.result,
            resLen = result.length,
            createdOn = null;

        b.replaceById(
            'boot-reports-compared-to-load',
            '<i class="fa fa-cog fa-spin"></i>&nbsp;' +
            '<span id="boot-reports-loading-content">' +
            'searching for similar boot reports&hellip;</span>'
        );

        data = {
            'board': boardName,
            'date_range': dateRange,
            'sort': 'created_on',
            'defconfig_full': defconfigName,
            'sort_order': -1,
            'limit': comparedToLimit
        };

        if (resLen > 0) {
            createdOn = new Date(result[0].created_on.$date);
            data.created_on = createdOn.getCustomISODate();
        }

        // Compare to mainline, if it is not mainline.
        if (jobName !== 'mainline') {
            data.job = 'mainline';
            deferred = r.get('/_ajax/boot', data);
            $.when(deferred)
                .fail(e.error, getCompareToMainlineFail)
                .done(getCompareToMainlineDone);
        } else {
            b.removeElement('compare-to-mainline-div');
        }

        // Compare to next, if it is not next.
        if (jobName !== 'next') {
            data.job = 'next';
            deferred = r.get('/_ajax/boot', data);
            $.when(deferred)
                .fail(e.error, getCompareToNextFail)
                .done(getCompareToNextDone);
        } else {
            b.removeElement('compare-to-next-div');
        }
    }

    function bindBisectMoreLessBtns() {
        $('.bisect-pm-btn-less').each(function() {
            $(this).off().on('click', btns.showLessBisectRowsBtn);
        });
        $('.bisect-pm-btn-more').each(function() {
            $(this).off().on('click', btns.showMoreBisectRowsBtn);
        });
    }

    function bindBisectButtons() {
        $('.bisect-click-btn').each(function() {
            $(this).off().on('click', btns.showHideBisect);
        });
    }

    function getBisectCompareToMainlineFail() {
        b.removeElement('bisect-compare-loading-div');
        b.replaceById(
            'bisect-compare-content',
            '<div class="pull-center><strong>' +
            'Error loading bisect data from server.' +
            '</strong></div>');
        b.removeClass('hidden');
    }

    function getBisectToMainline(bisectData, boot) {
        var deferred,
            elements;

        elements = {
            showHideID: 'bootb-compare-showhide',
            tableDivID: 'table-compare-div',
            tableID: 'bisect-compare-table',
            tableBodyID: 'bisect-compare-table-body',
            contentDivID: 'bisect-compare-content',
            loadingDivID: 'bisect-compare-loading-div',
            loadingContentID: 'bisect-compare-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: null,
            goodCommitID: null,
            bisectScriptContainerID: 'dl-bisect-compare-script',
            bisectScriptContentID: 'bisect-compare-script',
            bisectCompareDescriptionID: 'bisect-compare-description',
            prevBisect: bisectData,
            bisectShowHideID: 'bisect-compare-hide-div'
        };
        deferred = r.get(
            '/_ajax/bisect?collection=boot&compare_to=mainline&boot_id=' +
            boot, {});
        $.when(deferred)
            .fail(e.error, getBisectCompareToMainlineFail)
            .done(function(data) {
                bisect(data, elements, true);
                bindBisectButtons();
                bindBisectMoreLessBtns();
                btns.triggerMinusBisectBtns(true);
            });
    }

    function getBisectCompareTo(response) {
        var result = response.result,
            resLen = result.length,
            bisectData = null,
            lBootId = null;

        if (resLen > 0) {
            bisectData = result[0];
            lBootId = bisectData.boot_id.$oid;
            if (bisectData.job !== 'mainline') {
                b.removeClass('bisect-compare-div', 'hidden');
                getBisectToMainline(bisectData, lBootId);
            } else {
                b.removeElement('bisect-compare-div');
            }
        } else {
            b.removeElement('bisect-compare-div');
        }
    }

    function getBisectDataFail() {
        b.removeElement('bisect-loading-div');
        b.removeClass('bisect-content', 'hidden');
        b.replaceById(
            'bisect-content',
            '<div class="pull-center">' +
            '<strong>Error loading bisect data from server.</strong></div>');
    }

    function getBisectData(response) {
        // TODO: check better if we do not get anything back.
        var result = response.result[0],
            status = result.status,
            bisectElements = null,
            lBootId = bootId,
            deferred;

        if (status === 'FAIL') {
            b.removeClass('bisect', 'hidden');
            b.removeClass('bisect-div', 'hidden');

            if (bootId === 'None' || bootId === null) {
                lBootId = result._id.$oid;
            }

            bisectElements = {
                showHideID: 'bootb-showhide',
                tableDivID: 'table-div',
                tableID: 'bisect-table',
                tableBodyID: 'bisect-table-body',
                contentDivID: 'bisect-content',
                loadingDivID: 'bisect-loading-div',
                loadingContentID: 'bisect-loading-content',
                loadingContentText: 'loading bisect data&hellip;',
                badCommitID: 'bad-commit',
                goodCommitID: 'good-commit',
                bisectScriptContainerID: 'dl-bisect-script',
                bisectScriptContentID: 'bisect-script',
                bisectCompareDescriptionID: null,
                prevBisect: null,
                bisectShowHideID: 'bisect-hide-div'
            };

            deferred = r.get(
                '/_ajax/bisect?collection=boot&boot_id=' + lBootId, {});

            $.when(deferred)
                .fail(e.error, getBisectDataFail)
                .done(getBisectCompareTo)
                .done(function(data) {
                    bisect(data, bisectElements, false);
                    bindBisectButtons();
                    bindBisectMoreLessBtns();
                    btns.triggerMinusBisectBtns(false);
                });
        }
    }

    function getBootDataDone(response) {
        var results = response.result[0],
            bootTime,
            job,
            kernel,
            arch,
            branch,
            defconfigFull,
            localLabName,
            localBoard,
            fileServerData,
            translatedURI,
            fileServerURI = null,
            fileServerURL = null,
            fileServerResource = null,
            pathURI,
            createdOn,
            dtb,
            dtbAddr,
            loadAddr,
            initrdAddr,
            qemuData,
            qemuCommand,
            kernelImange,
            bootLog,
            bootLogHtml,
            status,
            statusDispl,
            retries,
            otherDetailsTxt = null,
            otherTxt,
            resultDescription,
            endianness,
            warnings;

        bootTime = new Date(results.time.$date);
        createdOn = new Date(results.created_on.$date);
        localBoard = results.board;
        job = results.job;
        kernel = results.kernel;
        defconfigFull = results.defconfig_full;
        arch = results.arch;
        localLabName = results.lab_name;
        fileServerURL = results.file_server_url;
        fileServerResource = results.file_server_resource;
        bootLog = results.boot_log;
        bootLogHtml = results.boot_log_html;
        status = results.status;
        retries = results.retries;
        branch = results.git_branch;
        resultDescription = results.boot_result_description;
        endianness = results.endian;
        warnings = results.warnings;
        dtb = results.dtb;
        dtbAddr = results.dtb_addr;
        loadAddr = results.load_addr;
        initrdAddr = results.initrd_addr;
        kernelImange = results.kernel_image;
        qemuData = results.qemu;
        qemuCommand = results.qemu_command;

        if (fileServerURL !== null && fileServerURL !== undefined) {
            fileServer = fileServerURL;
        }
        fileServerData = [
            job, kernel, arch + '-' + defconfigFull
        ];
        translatedURI = u.translateServerURL(
            fileServerURL, fileServer, fileServerResource, fileServerData);
        fileServerURI = translatedURI[0];
        pathURI = translatedURI[1];

        b.replaceById(
            'dd-lab-name',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="All boot reports for lab&nbsp;&#171;' + localLabName +
            '&#187;">' +
            '<a href="/boot/all/lab/' + localLabName + '/">' + localLabName +
            '&nbsp;<i class="fa fa-search"></i></a></span>'
        );
        b.replaceById(
            'dd-board-board',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="All boot reports for board&nbsp;&#171;' + localBoard +
            '&#187;"><a href="/boot/' + localBoard + '/">' + localBoard +
            '&nbsp;<i class="fa fa-search"></i></a></span>'
        );
        b.replaceById(
            'dd-board-tree',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + job + '">' +
            '<a href="/boot/all/job/' + job + '">' + job +
            '</a></span>&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + job + '"><a href="/job/' + job +
            '"><i class="fa fa-sitemap"></i></a></span>'
        );
        b.replaceById('dd-board-branch', branch);
        b.replaceById(
            'dd-board-kernel',
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot reports for&nbsp;' + job + '&nbsp;&dash;&nbsp;' +
            kernel + '"><a href="/boot/all/job/' + job +
            '/kernel/' + kernel + '">' + kernel +
            '</a></span>&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + job + '&nbsp;&dash;&nbsp;' +
            kernel + '"><a href="/build/' + job + '/kernel/' + kernel +
            '"><i class="fa fa-cube"></i></a></span>'
        );
        b.replaceById(
            'dd-board-defconfig',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Boot reports for&nbsp;' + boardName +
            '&nbsp;&dash;&nbsp;' + jobName + '&nbsp;&dash;&nbsp;' +
            kernelName + '&nbsp;&dash;&nbsp;' + defconfigFull + '">' +
            '<a href="/boot/' + boardName + '/job/' + jobName + '/kernel/' +
            kernelName + '/defconfig/' + defconfigFull + '">' +
            defconfigFull + '</a></span>' +
            '&nbsp;&mdash;&nbsp;<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for build&nbsp;' + job +
            '&nbsp;&dash;&nbsp;' + kernel + '&nbsp;&dash;&nbsp;' +
            defconfigFull + '"><a href="/build/' + job + '/kernel/' +
            kernel + '/defconfig/' + defconfigFull +
            '"><i class="fa fa-cube"></i></a></span>'
        );
        b.replaceById('dd-date', createdOn.getCustomISODate());

        switch (status) {
            case 'PASS':
                statusDispl = '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="Boot completed"><span class="label ' +
                    'label-success"><i class="fa fa-check">' +
                    '</i></span></span>';
                break;
            case 'FAIL':
                statusDispl = '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="Boot failed"><span class="label label-danger">' +
                    '<i class="fa fa-exclamation-triangle"></i>' +
                    '</span></span>';
                break;
            case 'OFFLINE':
                statusDispl = '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="Board offline" <span class="label label-info">' +
                    '<i class="fa fa-power-off"></i></span></span>';
                break;
            default:
                statusDispl = '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="Unknown status"><span class="label ' +
                    'label-warning"><i class="fa fa-question"></i>' +
                    '</span></span>';
                break;
        }

        if (resultDescription !== null && status !== 'PASS') {
            statusDispl += '&nbsp;<small>' + resultDescription +
                '</small>';
        }
        b.replaceById('dd-board-status', statusDispl);
        b.replaceById('dd-board-arch', arch);

        if (endianness !== null) {
            b.replaceById('dd-board-endianness', endianness);
        } else {
            b.replaceById('dd-board-endianness', nonAvail);
        }

        if (warnings !== null) {
            b.replaceById('dd-board-warnings', warnings);
        } else {
            b.replaceById('dd-board-warnings', 0);
        }

        b.replaceById('dd-board-boot-time', bootTime.getCustomTime());
        b.replaceById(
            'dd-board-boot-log',
            createBootLogContent(
                bootLog,
                bootLogHtml, localLabName, fileServerURI, pathURI, nonAvail)
        );

        if (dtb !== null && dtb !== '') {
            b.replaceById(
                'dd-board-dtb',
                '<a href="' +
                fileServerURI.path(pathURI + '/' + dtb)
                    .normalizePath().href() +
                '">' + dtb +
                '&nbsp;<i class="fa fa-external-link"></i></a>');
        } else {
            $('#dd-board-dtb').empty().append(nonAvail);
        }

        if (dtbAddr !== null && dtbAddr !== '') {
            b.replaceById('dd-board-dtb-address', dtbAddr);
        } else {
            b.replaceById('dd-board-dtb-address', nonAvail);
        }

        if (loadAddr !== null && loadAddr !== '') {
            b.replaceById('dd-board-load-address', loadAddr);
        } else {
            b.replaceById('dd-board-load-address', nonAvail);
        }

        if (initrdAddr !== null && initrdAddr !== '') {
            b.replaceById('dd-board-initrd-address', initrdAddr);
        } else {
            b.replaceById('dd-board-initrd-address', nonAvail);
        }

        if (kernelImange !== null && kernelImange !== '') {
            b.replaceById('dd-board-kernel-image',
                '<a href="' +
                fileServerURI.path(
                    pathURI + '/' + kernelImange).normalizePath().href() +
                '">' + kernelImange +
                '&nbsp;<i class="fa fa-external-link"></i></a>');
        } else {
            b.replaceById('dd-board-kernel-image', nonAvail);
        }

        b.replaceById(
            'dd-retries',
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="How many times the boot has been attempted">' +
            retries + '</span>'
        );

        if (qemuData !== null && qemuData !== '') {
            otherTxt = '';
            otherDetailsTxt = '<div id="qemu-details" class="row">' +
                '<div class="page-header"><h4>Qemu details</h4></div>' +
                '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
            if (qemuCommand !== null && qemuCommand !== '') {
                otherTxt = '<dt>Command</dt><dd>';
                if (qemuCommand.length > 99) {
                    otherTxt += '<span class="command">' +
                        qemuCommand.slice(0, 99).trimRight() +
                        '&hellip;</span>&nbsp;' +
                        '<span class="pointer details" ' +
                        'rel="tooltip" data-toggle="tooltip" ' +
                        'title="View full qemu command"> ' +
                        '<i class="fa fa-eye" data-toggle="modal" ' +
                        'data-target="#qemu-command"></i></span>';
                    otherDetailsTxt += b.createModalDialog(
                        'qemu-command',
                        'Qemu Command Line',
                        '<div class="row"><p><span class="command">' +
                        qemuCommand +
                        '</p></span></div>'
                    );
                } else {
                    otherTxt += '<span class="command">' + qemuCommand +
                        '</span></dd>';
                }
            }
            otherDetailsTxt += '<dl class="dl-horizontal">' +
                '<dt>Binary</dt><dd>' + qemuData + '</dd>' + otherTxt +
                '</dl></div></div>';
            b.replaceById('other-details-div', otherDetailsTxt);
            b.removeClass('other-details-div', 'hidden');
        }
    }

    function getBootData() {
        var deferred,
            data;
        if (bootId !== null) {
            data = {
                'id': bootId
            };
        } else {
            data = {
                'kernel': kernelName,
                'job': jobName,
                'defconfig_full': defconfigName,
                'lab_name': labName,
                'board': boardName
            };
        }
        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootDataFail)
            .done(getBootDataDone, getCompareData, getBisectData);
    }

    $(document).ready(function() {
        // Setup and perform base operations.
        i();

        document.getElementById('li-boot').setAttribute('class', 'active');

        if (document.getElementById('board-name') !== null) {
            boardName = document.getElementById('board-name').value;
        }

        if (document.getElementById('job-name') !== null) {
            jobName = document.getElementById('job-name').value;
        }

        if (document.getElementById('kernel-name') !== null) {
            kernelName = document.getElementById('kernel-name').value;
        }

        if (document.getElementById('defconfig-name') !== null) {
            defconfigName = document.getElementById('defconfig-name').value;
        }

        if (document.getElementById('lab-name') !== null) {
            labName = document.getElementById('lab-name').value;
        }

        if (document.getElementById('boot-id') !== null) {
            bootId = document.getElementById('boot-id').value;
        }

        if (document.getElementById('file-server') !== null) {
            fileServer = document.getElementById('file-server').value;
        }

        if (document.getElementById('date-range') !== null) {
            dateRange = document.getElementById('date-range').value;
        }

        if (boardName !== null && jobName !== null && kernelName !== null &&
                defconfigName !== null && labName !== null) {
            getBootData();
            getMultiLabData();
        } else {
            getBootDataFail();
            getMultiLabDataFail();
        }
    });
});
