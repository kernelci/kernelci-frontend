/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'tables/boot',
    'utils/html',
    'utils/const',
    'utils/date'
], function($, init, e, r, u, bisect, boot, html, appconst) {
    'use strict';
    var gBoardName,
        gBootId,
        gDateRange,
        gDefconfig,
        gFileServer,
        gJobName,
        gKernelName,
        gLabName;

    document.getElementById('li-boot').setAttribute('class', 'active');
    gDateRange = appconst.MAX_DATE_RANGE;
    gFileServer = null;

    function _tableMessage(table, text) {
        var cellNode,
            rowNode,
            strongNode;

        rowNode = table.insertRow(-1);
        cellNode = rowNode.insertCell(-1);
        cellNode.colSpan = 6;
        cellNode.className = 'pull-center';
        strongNode = document.createElement('strong');
        strongNode.appendChild(document.createTextNode(text));
        cellNode.appendChild(strongNode);
    }

    function addBootTableRow(data, table) {
        var arch,
            cellNode,
            defconfigFull,
            job,
            kernel,
            lab,
            logsNode,
            pathURI,
            resultDescription,
            rowNode,
            serverResource,
            serverURI,
            serverURL,
            translatedURI;

        arch = data.arch;
        defconfigFull = data.defconfig_full;
        job = data.job;
        kernel = data.kernel;
        lab = data.lab_name;
        resultDescription = data.boot_result_description;
        serverResource = data.file_server_resource;
        serverURL = data.file_server_url;

        if (!serverURL) {
            serverURL = gFileServer;
        }

        translatedURI = u.translateServerURL(
            serverURL,
            serverResource,
            [job, kernel, arch + '-' + defconfigFull]
        );
        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        rowNode = table.insertRow(-1);

        // Lab.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'lab-column';
        cellNode.appendChild(document.createTextNode(lab));

        // Failure desc.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'failure-column';
        if (resultDescription) {
            cellNode.appendChild(boot.resultDescription(resultDescription));
        } else {
            cellNode.insertAdjacentHTML('beforeend', '&nbsp;');
        }

        // Boot log.
        logsNode = boot.createBootLog(
            data.boot_log, data.boot_log_html, lab, serverURI, pathURI);
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(logsNode);

        // Date.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'date-column pull-center';
        cellNode.appendChild(boot.bootDate(data.created_on));

        // Status.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(boot.statusNode(data.status));

        // Detail.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(boot.bootDetail(data.board, data));
    }

    function generalCompareToTable(response, tableId) {
        var results,
            table;

        table = document.getElementById(tableId);
        results = response.result;

        if (results.length > 0) {
            results.forEach(function(result) {
                addBootTableRow(result, table);
            });
        } else {
            _tableMessage(table, 'No results found.');
        }

        html.removeClass(table, 'hidden');
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
        generalCompareToTable(response, 'compare-to-next-table');
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
        generalCompareToTable(response, 'compare-to-mainline-table');
    }

    function getMultiLabDataFail() {
        html.removeChildren(
            document.getElementById('boot-reports-loading-div'));
        html.replaceContent(
            document.getElementById('other-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getMultiLabDataDone(response) {
        var results,
            table,
            validReports;

        table = document.getElementById('multiple-labs-table');
        results = response.result;
        if (results.length > 0) {
            validReports = 0;

            results.forEach(function(result) {
                if (result.lab_name !== gLabName) {
                    validReports = validReports + 1;
                    addBootTableRow(result, table);
                }
            });

            if (validReports === 0) {
                _tableMessage(table, 'No similar boot reports found.');
            }
        } else {
            _tableMessage(table, 'No data available.');
        }

        html.removeElement(
            document.getElementById('boot-reports-loading-div'));
        html.removeClass(table, 'hidden');
    }

    function getMultiLabData() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                board: gBoardName,
                defconfig_full: gDefconfig,
                job: gJobName,
                kernel: gKernelName
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
            board: gBoardName,
            date_range: gDateRange,
            defconfig_full: gDefconfig,
            limit: appconst.MAX_COMPARE_LIMIT,
            sort: 'created_on',
            sort_order: -1
        };

        if (result.length > 0) {
            createdOn = new Date(result[0].created_on.$date);
            requestData.created_on = createdOn.toCustomISODate();
        }

        // Compare to mainline, if it is not mainline.
        if (gJobName !== 'mainline') {
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
        if (gJobName !== 'next') {
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

    function getBisectCompareToMainlineFail() {
        html.removeElement(
            document.getElementById('bisect-compare-loading-div'));
        html.replaceContent(
            document.getElementById('bisect-compare-content'),
            html.errorDiv('Error loading bisect data.'));
    }

    function getBisectToMainline(bisectData, bBootId) {
        var deferred,
            settings;

        settings = {
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
            bisectShowHideID: 'bisect-compare-hide-div',
            isCompared: true
        };

        deferred = r.get(
            '/_ajax/bisect?collection=boot&compare_to=mainline&boot_id=' +
            bBootId,
            {}
        );
        $.when(deferred)
            .fail(e.error, getBisectCompareToMainlineFail)
            .done(function(data) {
                settings.data = data;
                bisect(settings).draw();
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
        var deferred,
            lBootId,
            result,
            settings;

        lBootId = gBootId;
        result = response.result[0];

        if (result.status === 'FAIL') {
            html.removeClass(document.getElementById('bisect'), 'hidden');
            html.removeClass(document.getElementById('bisect-div'), 'hidden');

            if (gBootId === 'None' || !gBootId) {
                lBootId = result._id.$oid;
            }

            settings = {
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
                    settings.data = data;
                    bisect(settings).draw();
                });
        }
    }

    function _createModal(data) {
        var buttonNode,
            divNode,
            hNode,
            modalBody,
            modalContent,
            modalDivNode,
            modalHeader;

        divNode = document.createElement('div');
        divNode.className = 'modal fade';
        divNode.setAttribute('tabindex', '-1');
        divNode.setAttribute('role', 'dialog');
        divNode.setAttribute('aria-hidden', true);
        divNode.id = data.id;

        modalDivNode = document.createElement('div');
        // modalDivNode.className = 'modal-dialog modal-lg larger-modal';
        modalDivNode.className = 'modal-dialog modal-lg';

        modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        buttonNode = document.createElement('button');
        buttonNode.setAttribute('type', 'button');
        buttonNode.className = 'close';
        buttonNode.setAttribute('data-dismiss', 'modal');
        buttonNode.setAttribute('aria-hidden', true);
        buttonNode.insertAdjacentHTML('beforeend', '&times;');

        modalHeader.appendChild(buttonNode);

        hNode = document.createElement('h3');
        hNode.className = 'modal-title';
        hNode.id = data.id + '-title';
        hNode.insertAdjacentHTML('beforeend', data.title);

        modalHeader.appendChild(hNode);
        modalContent.appendChild(modalHeader);

        modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        modalBody.appendChild(data.body);

        modalContent.appendChild(modalBody);

        modalDivNode.appendChild(modalContent);
        divNode.appendChild(modalDivNode);

        return divNode;
    }

    function _createQemuCommand(data, command) {
        var bodyNode,
            ddNode,
            divNode,
            dlNode,
            dtNode,
            hNode,
            headerNode,
            iNode,
            rowNode,
            spanNode,
            textareaNode,
            tooltipNode;

        divNode = document.createElement('div');
        divNode.id = 'qemu-details';
        divNode.className = 'row';

        headerNode = document.createElement('div');
        headerNode.className = 'page-header';

        hNode = document.createElement('h4');
        hNode.appendChild(document.createTextNode('Qemu details'));
        headerNode.appendChild(hNode);
        divNode.appendChild(headerNode);

        rowNode = document.createElement('div');
        rowNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

        dlNode = document.createElement('dl');
        dlNode.className = 'dl-horizontal';

        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Binary'));
        ddNode = document.createElement('dd');
        ddNode.appendChild(document.createTextNode(data));

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        if (command) {
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Command'));
            ddNode = document.createElement('dd');

            spanNode = document.createElement('span');

            if (command.length > 75) {
                spanNode.appendChild(
                    document.createTextNode(
                        command.slice(0, 75).trimRight()));

                spanNode.insertAdjacentHTML('beforeend', '&hellip;');

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', 'View qemu command');
                tooltipNode.className = 'pointer details';
                iNode = document.createElement('i');
                iNode.className = 'fa fa-eye';
                iNode.setAttribute('data-toggle', 'modal');
                iNode.setAttribute('data-target', '#qemu-command');

                tooltipNode.appendChild(iNode);

                ddNode.appendChild(spanNode);
                ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                ddNode.appendChild(tooltipNode);

                bodyNode = document.createElement('div');
                bodyNode.className = 'qemu-command';

                textareaNode = document.createElement('textarea');
                textareaNode.setAttribute('readonly', true);
                textareaNode.className = 'form-control';
                textareaNode.appendChild(document.createTextNode(command));

                bodyNode.appendChild(textareaNode);

                divNode.appendChild(_createModal({
                    id: 'qemu-command',
                    title: 'Qemu Command',
                    body: bodyNode
                }));
            } else {
                spanNode.appendChild(document.createTextNode(command));
                ddNode.appendChild(spanNode);
            }

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);
        }

        divNode.appendChild(dlNode);
        return divNode;
    }

    function getBootDataDone(response) {
        var aNode,
            arch,
            board,
            boardInstance,
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
        boardInstance = result.board_instance;
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
            serverURL = gFileServer;
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

        // Board instance.
        if (boardInstance) {
            html.replaceContent(
                document.getElementById('dd-board-instance'),
                document.createTextNode(boardInstance));
        } else {
            html.replaceContent(
                document.getElementById('dd-board-instance'),
                html.nonavail());
        }

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
            '/boot/' + gBoardName + '/job/' + job + '/kernel/' + kernel +
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
            spanNode = document.createElement('span');
            spanNode.appendChild(document.createTextNode(soc));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for SoC &#171;' + soc + '&#187;');
            aNode = document.createElement('a');
            aNode.setAttribute('href', '/soc/' + soc + '/');
            aNode.appendChild(html.soc());

            tooltipNode.appendChild(aNode);
            spanNode.appendChild(tooltipNode);

            html.replaceContent(
                document.getElementById('dd-board-soc'), spanNode);
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

        if (qemuData) {
            html.replaceContent(
                document.getElementById('other-details-div'),
                _createQemuCommand(qemuData, qemuCommand));
            html.removeClass(
                document.getElementById('other-details-div'), 'hidden');
        }
    }

    function getBootData() {
        var data,
            deferred;

        if (gBootId) {
            data = {
                id: gBootId
            };
        } else {
            data = {
                board: gBoardName,
                defconfig_full: gDefconfig,
                job: gJobName,
                kernel: gKernelName,
                lab_name: gLabName
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
        gBoardName = document.getElementById('board-name').value;
    }
    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('defconfig-name') !== null) {
        gDefconfig = document.getElementById('defconfig-name').value;
    }
    if (document.getElementById('lab-name') !== null) {
        gLabName = document.getElementById('lab-name').value;
    }
    if (document.getElementById('boot-id') !== null) {
        gBootId = document.getElementById('boot-id').value;
    }
    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    getBootData();
    getMultiLabData();
});
