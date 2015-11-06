/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/show-hide-btns',
    'tables/boot',
    'utils/html',
    'utils/const',
    'utils/date'
], function($, init, b, e, r, u, bisect, btns, boot, html, appconst) {
    'use strict';
    var boardName,
        bootId,
        dateRange,
        defconfigName,
        fileServer,
        jobName,
        kernelName,
        labName;

    document.getElementById('li-boot').setAttribute('class', 'active');
    dateRange = appconst.MAX_DATE_RANGE;
    fileServer = null;

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
            fileServerData,
            translatedURI;

        if (fileServerURL === null || fileServerURL === undefined) {
            fileServerURL = fileServer;
        }
        fileServerData = [
            job, kernel, arch + '-' + defconfigFull
        ];
        translatedURI = u.translateServerURL(
            fileServerURL, fileServerResource, fileServerData);
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
            resultDescription = html.escape(resultDescription);
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
            createdOn.toCustomISODate() + '</td>';
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

    function generalCompareToTable(response, tableId, tableBodyId) {
        var results,
            rows;

        results = response.result;
        if (results.length > 0) {
            rows = '';
            results.forEach(function(result) {
                rows += createBootTableRow(result);
            });
            html.replaceContentHTML(
                document.getElementById(tableBodyId), rows);
        } else {
            html.replaceContentHTML(
                document.getElementById(tableBodyId),
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No recent results found.</strong>' +
                '</td></tr>');
        }

        html.removeClass(document.getElementById(tableId), 'hidden');
    }

    function getCompareToNextFail() {
        html.removeElement(
            document.getElementById('boot-reports-compared-to-load'));
        html.replaceContent(
            document.getElementById('compare-to-next-div'),
            html.errorDiv('Error retrieving data compared to next.'));
    }

    function getCompareToNextDone(response) {
        html.removeElement(
            document.getElementById('boot-reports-compared-to-load'));
        generalCompareToTable(
            response, 'compare-to-next-table', 'compare-to-next-table-body');
    }

    function getCompareToMainlineFail() {
        html.removeElement(
            document.getElementById('boot-reports-compared-to-load'));
        html.replaceContent(
            document.getElementById('compare-to-mainline-div'),
            html.errorDiv('Error retrieving data compared to mainline.'));
    }

    function getCompareToMainlineDone(response) {
        html.removeElement(
            document.getElementById('boot-reports-compared-to-load'));
        generalCompareToTable(
            response,
            'compare-to-mainline-table', 'compare-to-mainline-table-body');
    }

    function getMultiLabDataFail() {
        html.removeChildren(
            document.getElementById('boot-reports-loading-div'));
        html.replaceContent(
            document.getElementById('other-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getMultiLabDataDone(response) {
        var allRows,
            results,
            validReports;

        results = response.result;
        if (results.length > 0) {
            validReports = 0;
            allRows = '';

            results.forEach(function(result) {
                if (result.lab_name !== labName) {
                    validReports = validReports + 1;
                    allRows += createBootTableRow(result);
                }
            });

            if (validReports === 0) {
                html.replaceContentHTML(
                    document.getElementById('boot-reports-table-body'),
                    '<tr><td colspan="6" class="pull-center">' +
                    '<strong>No similar boot reports found.</strong>' +
                    '</td></tr>'
                );
            } else {
                html.replaceContentHTML(
                    document.getElementById('boot-reports-table-body'),
                    allRows);
            }
        } else {
            html.replaceContentHTML(
                document.getElementById('boot-reports-table-body'),
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No data available.</strong></td></tr>');
        }

        html.removeChildren(
            document.getElementById('boot-reports-loading-div'));
        html.removeElement(
            document.getElementById('boot-reports-loading-div'));
        html.removeClass(
            document.getElementById('multiple-labs-table'), 'hidden');
    }

    function getMultiLabData() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: boardName,
                defconfig_full: defconfigName,
                job: jobName,
                kernel: kernelName
            }
        );
        $.when(deferred)
            .fail(e.error, getMultiLabDataFail)
            .done(getMultiLabDataDone);
    }

    function getBootDataFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function getCompareData(response) {
        var childNode,
            createdOn,
            deferred,
            loadingNode,
            requestData,
            result;

        result = response.result;
        loadingNode = document.getElementById('boot-reports-compared-to-load');

        childNode = document.createElement('i');
        childNode.className = 'fa fa-cog fa-spin';

        html.removeChildren(loadingNode);
        loadingNode.appendChild(childNode);
        loadingNode.insertAdjacentHTML('beforeend', '&nbsp;');

        childNode = document.createElement('small');
        childNode.id = 'boot-reports-loading-content';
        childNode.appendChild(
            document.createTextNode('searching similar boot reports'));
        childNode.insertAdjacentHTML('beforeend', '&hellip;');

        loadingNode.appendChild(childNode);

        requestData = {
            board: boardName,
            date_range: dateRange,
            defconfig_full: defconfigName,
            limit: appconst.MAX_COMPARE_LIMIT,
            sort: 'created_on',
            sort_order: -1
        };

        if (result.length > 0) {
            createdOn = new Date(result[0].created_on.$date);
            requestData.created_on = createdOn.toCustomISODate();
        }

        // Compare to mainline, if it is not mainline.
        if (jobName !== 'mainline') {
            requestData.job = 'mainline';
            deferred = r.get('/_ajax/boot', requestData);

            $.when(deferred)
                .fail(e.error, getCompareToMainlineFail)
                .done(getCompareToMainlineDone);
        } else {
            html.removeElement(
                document.getElementById('compare-to-mainline-div'));
        }

        // Compare to next, if it is not next.
        if (jobName !== 'next') {
            requestData.job = 'next';
            deferred = r.get('/_ajax/boot', requestData);

            $.when(deferred)
                .fail(e.error, getCompareToNextFail)
                .done(getCompareToNextDone);
        } else {
            html.removeElement(
                document.getElementById('compare-to-next-div'));
        }
    }

    function _bindShowLess(element) {
        element.removeEventListener('click');
        element.addEventListener('click', btns.showLessBisectRowsBtn);
    }

    function _bindShowMore(element) {
        element.removeEventListener('click');
        element.addEventListener('click', btns.showMoreBisectRowsBtn);
    }

    function _bindBisect(element) {
        element.removeEventListener('click');
        element.addEventListener('click', btns.showHideBisect);
    }

    function bindBisectMoreLessBtns() {
        [].forEach.call(
            document.getElementsByClassName('bisect-pm-btn-less'),
            _bindShowLess);

        [].forEach.call(
            document.getElementsByClassName('bisect-pm-btn-more'),
            _bindShowMore);
    }

    function bindBisectButtons() {
        [].forEach.call(
            document.getElementsByClassName('bisect-click-btn'), _bindBisect);
    }

    function getBisectCompareToMainlineFail() {
        html.removeElement(
            document.getElementById('bisect-compare-loading-div'));
        html.replaceContent(
            document.getElementById('bisect-compare-content'),
            html.errorDiv('Error loading bisect data.'));
    }

    function getBisectToMainline(bisectData, bBootId) {
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
            bBootId,
            {}
        );
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
        var bisectData,
            bBootId,
            result;

        result = response.result;
        if (result.length > 0) {
            bisectData = result[0];
            bBootId = bisectData.boot_id.$oid;

            if (bisectData.job !== 'mainline') {
                html.removeClass(
                    document.getElementById('bisect-compare-div'), 'hidden');

                getBisectToMainline(bisectData, bBootId);
            } else {
                html.removeElement(
                    document.getElementById('bisect-compare-div'));
            }
        } else {
            html.removeElement(document.getElementById('bisect-compare-div'));
        }
    }

    function getBisectDataFail() {
        html.removeElement(document.getElementById('bisect-loading-div'));
        html.removeClass(document.getElementById('bisect-content'), 'hidden');
        html.replaceContent(
            document.getElementById('bisect-content'),
            html.errorDiv('Error loading bisect data.'));
    }

    function getBisectData(response) {
        var bisectElements,
            deferred,
            lBootId,
            result;

        lBootId = bootId;
        result = response.result[0];

        if (result.status === 'FAIL') {
            html.removeClass(document.getElementById('bisect'), 'hidden');
            html.removeClass(document.getElementById('bisect-div'), 'hidden');

            if (bootId === 'None' || !bootId) {
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
        var aNode,
            arch,
            board,
            bootLog,
            bootTime,
            buildId,
            createdOn,
            defconfigFull,
            dtb,
            dtbAddr,
            endianness,
            initrdAddr,
            job,
            kernel,
            kernelImage,
            lab,
            loadAddr,
            otherDetailsTxt,
            otherTxt,
            pathURI,
            qemuCommand,
            qemuData,
            result,
            resultDescription,
            serverResource,
            serverURI,
            serverURL,
            smallNode,
            soc,
            spanNode,
            statusNode,
            tooltipNode,
            translatedURI,
            warnings;

        result = response.result[0];
        bootTime = new Date(result.time.$date);
        createdOn = new Date(result.created_on.$date);
        board = result.board;
        job = result.job;
        kernel = result.kernel;
        defconfigFull = result.defconfig_full;
        arch = result.arch;
        lab = result.lab_name;
        serverURL = result.file_server_url;
        serverResource = result.file_server_resource;

        resultDescription = result.boot_result_description;
        endianness = result.endian;
        warnings = result.warnings;
        dtb = result.dtb;
        dtbAddr = result.dtb_addr;
        loadAddr = result.load_addr;
        initrdAddr = result.initrd_addr;
        kernelImage = result.kernel_image;
        qemuData = result.qemu;
        qemuCommand = result.qemu_command;
        soc = result.mach;

        if (!serverURL) {
            serverURL = fileServer;
        }

        translatedURI = u.translateServerURL(
            serverURL,
            serverResource,
            [job, kernel, arch + '-' + defconfigFull]
        );

        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        // Lab.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Boot reports for lab&nbsp' + lab);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/lab/' + lab + '/');
        aNode.appendChild(document.createTextNode(lab));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        html.replaceContent(
            document.getElementById('dd-lab-name'), tooltipNode);

        // Board.
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'Boot reports for board&nbsp;' + board);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/' + board + '/');
        aNode.appendChild(document.createTextNode(board));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);

        html.replaceContent(
            document.getElementById('dd-board-board'), tooltipNode);

        // Tree.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot reports for&nbsp;' + job);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/boot/all/job/' + job + '/');
        aNode.appendChild(document.createTextNode(job));

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Details for tree&nbsp;' + job);
        aNode = document.createElement('a');
        aNode.setAttribute('href', '/job/' + job + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.tree());

        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-board-tree'), spanNode);

        // Branch.
        html.replaceContent(
            document.getElementById('dd-board-branch'),
            document.createTextNode(result.git_branch));

        // Kernel.
        spanNode = document.createElement('span');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Boot reports for&nbsp;' + job + '&nbsp;&dash;&nbsp;' + kernel);
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/boot/all/job/' + job + '/kernel/' + kernel + '/');
        aNode.appendChild(document.createTextNode(kernel));
        tooltipNode.appendChild(aNode);

        spanNode.appendChild(tooltipNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title',
            'Build reports for&nbsp;' + job + '&nbsp;&dash;&nbsp;' + kernel);
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', '/build/' + job + '/kernel/' + kernel + '/');
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);

        spanNode.appendChild(tooltipNode);
        html.replaceContent(
            document.getElementById('dd-board-kernel'), spanNode);

        // Defconfig
        spanNode = document.createElement('span');
        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot reports');
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/' + boardName + '/job/' + job + '/kernel/' + kernel +
                '/defconfig/' + defconfigFull + '/'
        );
        aNode.appendChild(document.createTextNode(defconfigFull));
        tooltipNode.appendChild(aNode);

        spanNode.appendChild(tooltipNode);
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Build details');
        aNode = document.createElement('a');

        buildId = '';
        if (result.build_id) {
            buildId = '?_id=' + result.build_id.$oid;
        }
        aNode.setAttribute(
            'href',
            '/build/' + job + '/kernel/' + kernel +
                '/defconfig/' + defconfigFull + '/' + buildId);
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.build());
        tooltipNode.appendChild(aNode);
        spanNode.appendChild(tooltipNode);

        html.replaceContent(
            document.getElementById('dd-board-defconfig'), spanNode);

        // Date.
        spanNode = document.createElement('time');
        spanNode.setAttribute('datetime', createdOn.toISOString());
        spanNode.appendChild(
            document.createTextNode(createdOn.toCustomISODate()));
        html.replaceContent(document.getElementById('dd-date'), spanNode);

        // Status.
        statusNode = boot.statusNode(result.status);
        if (resultDescription && result.status !== 'PASS') {
            spanNode = document.createElement('span');
            spanNode.appendChild(statusNode);
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

            resultDescription = html.escape(resultDescription);

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute('title', resultDescription);
            smallNode = document.createElement('small');
            smallNode.insertAdjacentHTML(
                'beforeend', html.sliceText(resultDescription, 40));
            tooltipNode.appendChild(smallNode);

            spanNode.appendChild(tooltipNode);
            statusNode = spanNode;
        }
        html.replaceContent(
            document.getElementById('dd-board-status'), statusNode);

        // Arch.
        html.replaceContent(
            document.getElementById('dd-board-arch'),
            document.createTextNode(arch));

        // Soc.
        if (soc) {
            html.replaceContent(
                document.getElementById('dd-board-soc'),
                document.createTextNode(soc));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-soc'), html.nonavail());
        }

        if (endianness) {
            html.replaceContent(
                document.getElementById('dd-board-endianness'),
                document.createTextNode(endianness));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-endianness'),
                html.nonavail());
        }

        if (!warnings) {
            warnings = 0;
        }
        html.replaceContent(
            document.getElementById('dd-board-warnings'),
            document.createTextNode(warnings));

        // Time.
        html.replaceContent(
            document.getElementById('dd-board-boot-time'),
            document.createTextNode(bootTime.toCustomTime()));

        // Boot log.
        bootLog = boot.createBootLog(
            result.boot_log,
            result.boot_log_html,
            lab,
            serverURI,
            pathURI
        );
        if (!bootLog) {
            bootLog = html.nonavail();
        }
        html.replaceContent(
            document.getElementById('dd-board-boot-log'), bootLog);

        if (dtb) {
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                serverURI
                    .path(pathURI + '/' + dtb).normalizePath().href()
            );
            aNode.appendChild(document.createTextNode(dtb));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            html.replaceContent(
                document.getElementById('dd-board-dtb'), aNode);
        } else {
            html.replaceContent(
                document.getElementById('dd-board-dtb'), html.nonavail());
        }

        if (dtbAddr) {
            html.replaceContent(
                document.getElementById('dd-board-dtb-address'),
                document.createTextNode(dtbAddr));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-dtb-address'),
                html.nonavail());
        }

        if (loadAddr) {
            html.replaceContent(
                document.getElementById('dd-board-load-address'),
                document.createTextNode(loadAddr));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-load-address'),
                html.nonavail());
        }

        if (initrdAddr) {
            html.replaceContent(
                document.getElementById('dd-board-initrd-address'),
                document.createTextNode(initrdAddr));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-initrd-address'),
                html.nonavail());
        }

        if (kernelImage) {
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                serverURI
                    .path(pathURI + '/' + kernelImage).normalizePath().href()
            );
            aNode.appendChild(document.createTextNode(kernelImage));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());
            html.replaceContent(
                document.getElementById('dd-board-kernel-image'), aNode);
        } else {
            html.replaceContent(
                document.getElementById('dd-board-kernel-image'),
                html.nonavail());
        }

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute(
            'title', 'How many times the boot has been attempted');
        tooltipNode.appendChild(document.createTextNode(result.retries));
        html.replaceContent(
            document.getElementById('dd-retries'), tooltipNode);

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
            html.replaceContentHTML(
                document.getElementById('other-details-div'), otherDetailsTxt);
            html.removeClass(
                document.getElementById('other-details-div'), 'hidden');
        }
    }

    function getBootData() {
        var data,
            deferred;

        if (bootId) {
            data = {
                id: bootId
            };
        } else {
            data = {
                board: boardName,
                defconfig_full: defconfigName,
                job: jobName,
                kernel: kernelName,
                lab_name: labName
            };
        }

        deferred = r.get('/_ajax/boot', data);
        $.when(deferred)
            .fail(e.error, getBootDataFail)
            .done(getBootDataDone, getCompareData, getBisectData);
    }

    // Setup and perform base operations.
    init.hotkeys();
    init.tooltip();

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

    getBootData();
    getMultiLabData();
});
