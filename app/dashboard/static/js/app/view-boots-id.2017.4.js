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
    'utils/format',
    'utils/date'
], function($, init, e, r, u, bisect, tboot, html, appconst, format) {
    'use strict';
    var gBootId;
    var gDateRange;
    var gFileServer;

    setTimeout(function() {
        document.getElementById('li-boot').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gFileServer = null;

    function _tableMessage(tableId, text) {
        var cellNode;
        var frag;
        var rowNode;
        var strongNode;

        frag = document.createDocumentFragment();
        rowNode = frag.appendChild(document.createElement('tr'));

        cellNode = rowNode.insertCell(-1);
        cellNode.colSpan = 6;
        cellNode.className = 'pull-center';

        strongNode = cellNode.appendChild(document.createElement('strong'));
        strongNode.appendChild(document.createTextNode(text));

        document.getElementById(tableId)
            .tBodies[0].appendChild(frag);
    }

    function addBootTableRow(data, docFrag) {
        var arch;
        var cellNode;
        var defconfigFull;
        var job;
        var kernel;
        var lab;
        var logsNode;
        var resultDescription;
        var rowNode;
        var serverURL;
        var translatedURI;

        arch = data.arch;
        defconfigFull = data.defconfig_full;
        job = data.job;
        kernel = data.kernel;
        lab = data.lab_name;
        resultDescription = data.boot_result_description;
        serverURL = data.file_server_url;

        if (!serverURL) {
            serverURL = gFileServer;
        }

        translatedURI = u.createFileServerURL(serverURL, data);

        rowNode = docFrag.appendChild(document.createElement('tr'));

        // Lab.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'lab-column';
        cellNode.appendChild(document.createTextNode(lab));

        // Failure desc.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'failure-column';
        if (resultDescription) {
            cellNode.appendChild(
                tboot.resultDescriptionNode(resultDescription));
        } else {
            cellNode.insertAdjacentHTML('beforeend', '&nbsp;');
        }

        // Boot log.
        logsNode = tboot.createBootLog(
            data.boot_log,
            data.boot_log_html, lab, translatedURI[0], translatedURI[1]);
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(logsNode);

        // Date.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'date-column pull-center';
        cellNode.appendChild(tboot.dateNode(data.created_on));

        // Status.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(tboot.statusNode(data.status));

        // Detail.
        cellNode = rowNode.insertCell(-1);
        cellNode.className = 'pull-center';
        cellNode.appendChild(tboot.detailsNode(data.board, data));
    }

    function generalCompareToTable(response, tableId) {
        var docFrag;
        var results;
        var table;

        results = response.result;
        table = document.getElementById(tableId);

        if (results.length > 0) {
            docFrag = document.createDocumentFragment();

            results.forEach(function(result) {
                addBootTableRow(result, docFrag);
            });

            table.tBodies[0].appendChild(docFrag);
        } else {
            setTimeout(
                _tableMessage.bind(null, tableId, 'No results found.'), 0);
        }

        html.removeClass(table, 'hidden');
    }

    function getCompareToLskFail() {
        html.replaceContent(
            document.getElementById('compare-to-lsk-div'),
            html.errorDiv('Error retrieving data compared to lsk.'));
    }

    function getCompareToLskDone(response) {
        generalCompareToTable(response, 'compare-to-lsk-table');
    }

    function getCompareToNextFail() {
        html.replaceContent(
            document.getElementById('compare-to-next-div'),
            html.errorDiv('Error retrieving data compared to next.'));
    }

    function getCompareToNextDone(response) {
        generalCompareToTable(response, 'compare-to-next-table');
    }

    function getCompareToMainlineFail() {
        html.replaceContent(
            document.getElementById('compare-to-mainline-div'),
            html.errorDiv('Error retrieving data compared to mainline.'));
    }

    function getCompareToMainlineDone(response) {
        generalCompareToTable(response, 'compare-to-mainline-table');
    }

    function getMultiLabDataFail() {
        html.removeChildren(
            document.getElementById('boot-reports-loading-div'));
        html.replaceContent(
            document.getElementById('other-reports-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getMultiLabDataDone(response, lab) {
        var docFrag;
        var results;
        var table;
        var tableId;
        var validReports;

        tableId = 'multiple-labs-table';
        results = response.result;
        table = document.getElementById(tableId);

        if (results.length > 0) {
            validReports = 0;

            docFrag = document.createDocumentFragment();

            results.forEach(function(result) {
                if (result.lab_name !== lab) {
                    validReports = validReports + 1;
                    addBootTableRow(result, docFrag);
                }
            });

            if (validReports === 0) {
                setTimeout(
                    _tableMessage.bind(
                        null, tableId, 'No similar boot reports found.'), 0);
            } else {
                table.tBodies[0].appendChild(docFrag);
            }
        } else {
            setTimeout(
                _tableMessage.bind(null, tableId, 'No data available.'), 0);
        }

        html.removeElement(
            document.getElementById('boot-reports-loading-div'));
        html.removeClass(table, 'hidden');
    }

    function getMultiLabData(response) {
        var deferred;
        var result;

        result = response.result[0];

        setTimeout(function() {
            deferred = r.get(
                '/_ajax/boot',
                {
                    board: result.board,
                    defconfig_full: result.defconfig_full,
                    job: result.job,
                    kernel: result.kernel
                }
            );

            $.when(deferred)
                .fail(e.error, getMultiLabDataFail)
                .done(function(data) {
                    getMultiLabDataDone(data, result.lab_name);
                });
        }, 10);
    }

    function getBootDataFail() {
        html.replaceByClassNode('loading-content', html.nonavail());
        document.getElementById('body-title')
            .insertAdjacentHTML('beforeend', '&hellip;');
    }

    function getCompareData(response) {
        var childNode;
        var createdOn;
        var deferred;
        var docFrag;
        var job;
        var loadingNode;
        var requestData;
        var result;
        var templateNode;

        loadingNode = document.getElementById('boot-reports-compared-to-load');

        docFrag = document.createDocumentFragment();

        childNode = docFrag.appendChild(document.createElement('i'));
        childNode.className = 'fa fa-circle-o-notch fa-spin fa-fw';

        // Needed to insert HTML text.
        templateNode = document.createElement('template');
        templateNode.innerHTML = '&nbsp;';

        docFrag.appendChild(templateNode.content);

        childNode = docFrag.appendChild(document.createElement('small'));
        childNode.id = 'boot-reports-loading-content';
        childNode.appendChild(
            document.createTextNode('searching similar boot reports'));
        childNode.insertAdjacentHTML('beforeend', '&hellip;');

        html.removeChildren(loadingNode);
        html.replaceContent(loadingNode, docFrag);

        result = response.result[0];
        job = result.job;
        createdOn = new Date(result.created_on.$date);

        requestData = {
            created_on: createdOn.toCustomISODate(),
            board: result.board,
            date_range: gDateRange,
            defconfig_full: result.defconfig_full,
            limit: appconst.MAX_COMPARE_LIMIT,
            sort: 'created_on',
            sort_order: -1
        };

        // Compare to LSK, if it is not LSK.
        if (job !== 'lsk') {
            html.removeClass(
                document.getElementById('compare-to-lsk-div'), 'hidden');

            requestData.job = 'lsk';
            deferred = r.get('/_ajax/boot', requestData);

            $.when(deferred)
                .fail(e.error, getCompareToLskFail)
                .done(getCompareToLskDone);
        } else {
            html.removeElement(
                document.getElementById('compare-to-lsk-div'));
        }

        // Compare to mainline, if it is not mainline.
        if (job !== 'mainline') {
            html.removeClass(
                document.getElementById('compare-to-mainline-div'), 'hidden');

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
        if (job !== 'next') {
            html.removeClass(
                document.getElementById('compare-to-next-div'), 'hidden');

            requestData.job = 'next';
            deferred = r.get('/_ajax/boot', requestData);

            $.when(deferred)
                .fail(e.error, getCompareToNextFail)
                .done(getCompareToNextDone);
        } else {
            html.removeElement(
                document.getElementById('compare-to-next-div'));
        }

        html.removeElement(
            document.getElementById('boot-reports-compared-to-load'));
    }

    function getBisectCompareToMainlineFail() {
        html.removeElement(
            document.getElementById('bisect-compare-loading-div'));
        html.replaceContent(
            document.getElementById('bisect-compare-content'),
            html.errorDiv('Error loading bisect data.'));
    }

    function getBisectToMainline(bisectData, bBootId) {
        var deferred;
        var settings;

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

        setTimeout(function() {
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
        }, 10);
    }

    function getBisectCompareTo(response) {
        var bBootId;
        var bisectData;
        var result;

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
        var deferred;
        var lBootId;
        var result;
        var settings;

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

            setTimeout(function() {
                deferred = r.get(
                    '/_ajax/bisect?collection=boot&boot_id=' + lBootId, {});

                $.when(deferred)
                    .fail(e.error, getBisectDataFail)
                    .done(getBisectCompareTo)
                    .done(function(data) {
                        settings.data = data;
                        bisect(settings).draw();
                    });
            }, 10);
        }
    }

    function _createModal(data) {
        var buttonNode;
        var divNode;
        var frag;
        var hNode;
        var modalBody;
        var modalContent;
        var modalDivNode;
        var modalHeader;

        frag = document.createDocumentFragment();

        divNode = frag.appendChild(document.createElement('div'));
        divNode.className = 'modal fade';
        divNode.setAttribute('tabindex', '-1');
        divNode.setAttribute('role', 'dialog');
        divNode.setAttribute('aria-hidden', true);
        divNode.id = data.id;

        modalDivNode = divNode.appendChild(document.createElement('div'));
        modalDivNode.className = 'modal-dialog modal-lg';

        modalContent = modalDivNode.appendChild(document.createElement('div'));
        modalContent.className = 'modal-content';

        modalHeader = modalContent.appendChild(document.createElement('div'));
        modalHeader.className = 'modal-header';

        buttonNode = modalHeader.appendChild(document.createElement('button'));
        buttonNode.setAttribute('type', 'button');
        buttonNode.className = 'close';
        buttonNode.setAttribute('data-dismiss', 'modal');
        buttonNode.setAttribute('aria-hidden', true);
        buttonNode.insertAdjacentHTML('beforeend', '&times;');

        hNode = modalHeader.appendChild(document.createElement('h3'));
        hNode.className = 'modal-title';
        hNode.id = data.id + '-title';
        hNode.insertAdjacentHTML('beforeend', data.title);

        modalBody = modalContent.appendChild(document.createElement('div'));
        modalBody.className = 'modal-body';
        modalBody.appendChild(data.body);

        return frag;
    }

    function _createQemuCommand(data, command) {
        var bodyNode;
        var ddNode;
        var divNode;
        var dlNode;
        var dtNode;
        var fragNode;
        var hNode;
        var headerNode;
        var iNode;
        var qemuFrag;
        var rowNode;
        var spanNode;
        var textareaNode;
        var tooltipNode;

        qemuFrag = document.createDocumentFragment();
        divNode = qemuFrag.appendChild(document.createElement('div'));
        divNode.id = 'qemu-details';
        divNode.className = 'row';

        headerNode = divNode.appendChild(document.createElement('div'));
        headerNode.className = 'page-header';

        hNode = headerNode.appendChild(document.createElement('h4'));
        hNode.appendChild(document.createTextNode('Qemu details'));

        rowNode = divNode.appendChild(document.createElement('div'));
        rowNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

        dlNode = rowNode.appendChild(document.createElement('dl'));
        dlNode.className = 'dl-horizontal';

        dtNode = dlNode.appendChild(document.createElement('dt'));
        dtNode.appendChild(document.createTextNode('Binary'));
        ddNode = dlNode.appendChild(document.createElement('dd'));
        ddNode.appendChild(document.createTextNode(data));

        if (command) {
            dtNode = dlNode.appendChild(document.createElement('dt'));
            dtNode.appendChild(document.createTextNode('Command'));
            ddNode = dlNode.appendChild(document.createElement('dd'));

            spanNode = ddNode.appendChild(document.createElement('span'));

            if (command.length > 75) {
                ddNode.insertAdjacentHTML('beforeend', '&nbsp;');

                spanNode.appendChild(
                    document.createTextNode(
                        command.slice(0, 75).trimRight()));

                spanNode.insertAdjacentHTML('beforeend', '&hellip;');

                tooltipNode = ddNode.appendChild(html.tooltip());
                tooltipNode.setAttribute('title', 'View qemu command');
                tooltipNode.className = 'pointer details';
                iNode = tooltipNode.appendChild(document.createElement('i'));
                iNode.className = 'fa fa-eye';
                iNode.setAttribute('data-toggle', 'modal');
                iNode.setAttribute('data-target', '#qemu-command');

                fragNode = document.createDocumentFragment();
                bodyNode = fragNode.appendChild(document.createElement('div'));
                bodyNode.className = 'qemu-command';

                textareaNode = bodyNode.appendChild(
                    document.createElement('textarea'));
                textareaNode.setAttribute('readonly', true);
                textareaNode.className = 'form-control';
                textareaNode.appendChild(document.createTextNode(command));

                divNode.appendChild(_createModal({
                    id: 'qemu-command',
                    title: 'Qemu Command',
                    body: fragNode
                }));
            } else {
                spanNode.appendChild(document.createTextNode(command));
            }
        }

        return qemuFrag;
    }

    function getBootDataDone(response) {
        var aNode;
        var arch;
        var board;
        var boardInstance;
        var bootLog;
        var bootTime;
        var branch;
        var compiler;
        var compilerVersion;
        var compilerVersionFull;
        var createdOn;
        var crossCompile;
        var defconfigFull;
        var docFrag;
        var dtb;
        var dtbAddr;
        var endianness;
        var initrdAddr;
        var job;
        var kernel;
        var kernelImage;
        var kernelImageSize;
        var lab;
        var loadAddr;
        var pathURI;
        var qemuCommand;
        var qemuData;
        var result;
        var resultDescription;
        var serverURI;
        var serverURL;
        var smallNode;
        var soc;
        var spanNode;
        var statusNode;
        var str;
        var tooltipNode;
        var translatedURI;
        var warnings;

        // We only have one result.
        result = response.result[0];
        bootTime = new Date(result.time.$date);
        createdOn = new Date(result.created_on.$date);
        board = result.board;
        boardInstance = result.board_instance;
        job = result.job;
        branch = result.git_branch;
        kernel = result.kernel;
        defconfigFull = result.defconfig_full;
        arch = result.arch;
        lab = result.lab_name;
        serverURL = result.file_server_url;

        resultDescription = result.boot_result_description;
        endianness = result.endian;
        warnings = result.warnings;
        dtb = result.dtb;
        dtbAddr = result.dtb_addr;
        loadAddr = result.load_addr;
        initrdAddr = result.initrd_addr;
        kernelImage = result.kernel_image;
        kernelImageSize = result.kernel_image_size;
        qemuData = result.qemu;
        qemuCommand = result.qemu_command;
        soc = result.mach;

        compiler = result.compiler;
        compilerVersion = result.compiler_version;
        compilerVersionFull = result.compiler_version_full;
        crossCompile = result.cross_compile;

        if (!serverURL) {
            serverURL = gFileServer;
        }

        translatedURI = u.createFileServerURL(serverURL, result);
        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        // Body title.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        spanNode.insertAdjacentHTML('beforeend', '&#171;');
        spanNode.appendChild(document.createTextNode(board));
        spanNode.insertAdjacentHTML('beforeend', '&#187;');
        spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

        smallNode = spanNode.appendChild(document.createElement('small'));
        str = '(';
        str += lab;
        str += ')';
        smallNode.appendChild(document.createTextNode(str));

        document.getElementById('body-title').appendChild(docFrag);

        // Lab.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        str = 'Boot reports for lab&nbsp';
        str += lab;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/boot/all/lab/';
        str += lab;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(lab));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(document.getElementById('dd-lab-name'), docFrag);

        // Board.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        str = 'Boot reports for board&nbsp;';
        str += board;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/boot/';
        str += board;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(board));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        html.replaceContent(
            document.getElementById('dd-board-board'), docFrag);

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
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Boot reports for&nbsp;';
        str += job;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/boot/all/job/';
        str += job;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(job));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Details for tree&nbsp;';
        str += job;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/job/';
        str += job;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.tree());

        html.replaceContent(document.getElementById('dd-board-tree'), docFrag);

        // Branch.
        html.replaceContent(
            document.getElementById('dd-board-branch'),
            document.createTextNode(branch));

        // Kernel.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Boot reports for&nbsp;';
        str += job;
        str += '&nbsp;&dash;&nbsp;';
        str += kernel;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/boot/all/job/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(kernel));

        spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

        tooltipNode = spanNode.appendChild(html.tooltip());
        str = 'Build reports for&nbsp;';
        str += job;
        str += '&nbsp;&dash;&nbsp;';
        str += kernel;
        tooltipNode.setAttribute('title', str);

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/build/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.build());

        html.replaceContent(
            document.getElementById('dd-board-kernel'), docFrag);

        // Defconfig
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));
        tooltipNode = spanNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Boot reports');

        aNode = tooltipNode.appendChild(document.createElement('a'));
        str = '/boot/';
        str += board;
        str += '/job/';
        str += job;
        str += '/branch/';
        str += branch;
        str += '/kernel/';
        str += kernel;
        str += '/defconfig/';
        str += defconfigFull;
        str += '/';
        aNode.setAttribute('href', str);
        aNode.appendChild(document.createTextNode(defconfigFull));

        if (result.build_id) {
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', 'Build details');
            aNode = tooltipNode.appendChild(document.createElement('a'));
            str ='/build/id/';
            str += result.build_id.$oid;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.build());
        }

        html.replaceContent(
            document.getElementById('dd-board-defconfig'), docFrag);

        // Date.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('time'));
        spanNode.setAttribute('datetime', createdOn.toISOString());
        spanNode.appendChild(
            document.createTextNode(createdOn.toCustomISODateTime()));
        html.replaceContent(document.getElementById('dd-date'), docFrag);

        // Status.
        if (resultDescription && result.status !== 'PASS') {
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(tboot.statusNode(result.status));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

            resultDescription = html.escape(resultDescription);

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.setAttribute('title', resultDescription);
            smallNode = tooltipNode
                .appendChild(document.createElement('small'));
            smallNode.insertAdjacentHTML(
                'beforeend', html.sliceText(resultDescription, 40));

            html.replaceContent(
                document.getElementById('dd-board-status'), docFrag);
        } else {
            statusNode = tboot.statusNode(result.status);
            html.replaceContent(
                document.getElementById('dd-board-status'), statusNode);
        }

        // Arch.
        html.replaceContent(
            document.getElementById('dd-board-arch'),
            document.createTextNode(arch));

        // Soc.
        if (soc) {
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(document.createTextNode(soc));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Boot reports for SoC&nbsp;';
            str += soc;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/soc/';
            str += soc;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.soc());

            html.replaceContent(
                document.getElementById('dd-board-soc'), docFrag);
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
        bootLog = tboot.createBootLog(
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

        if (crossCompile) {
            html.replaceContent(
                document.getElementById('cross-compile'),
                document.createTextNode(crossCompile));
        } else {
            html.replaceContent(
                document.getElementById('cross-compile'),
                html.nonavail());
        }

        if (compiler) {
            html.replaceContent(
                document.getElementById('compiler'),
                document.createTextNode(compiler));
        } else {
            html.replaceContent(
                document.getElementById('compiler'), html.nonavail());
        }

        if (compilerVersion) {
            html.replaceContent(
                document.getElementById('compiler-version'),
                document.createTextNode(compilerVersion));
        } else {
            html.replaceContent(
                document.getElementById('compiler-version'),
                html.nonavail());
        }

        if (compilerVersionFull) {
            html.replaceContent(
                document.getElementById('compiler-version-full'),
                document.createTextNode(compilerVersionFull));
        } else {
            html.replaceContent(
                document.getElementById('compiler-version-full'),
                html.nonavail());
        }

        if (dtb) {
            docFrag = document.createDocumentFragment();
            aNode = docFrag.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', u.getHref(serverURI, [pathURI, dtb])
            );
            aNode.appendChild(document.createTextNode(dtb));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            html.replaceContent(
                document.getElementById('dd-board-dtb'), docFrag);
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

        // Kernel image.
        if (kernelImage) {
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute(
                'href', u.getHref(serverURI, [pathURI, kernelImage])
            );
            aNode.appendChild(document.createTextNode(kernelImage));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            if (kernelImageSize) {
                spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                smallNode = spanNode
                    .appendChild(document.createElement('small'));
                str = '(';
                str += format.bytes(kernelImageSize);
                str += ')';
                smallNode.appendChild(document.createTextNode(str));
            }

            html.replaceContent(
                document.getElementById('dd-board-kernel-image'), docFrag);
        } else {
            html.replaceContent(
                document.getElementById('dd-board-kernel-image'),
                html.nonavail());
        }

        // Boot retries.
        docFrag = document.createDocumentFragment();
        tooltipNode = docFrag.appendChild(html.tooltip());
        tooltipNode.setAttribute(
            'title', 'How many times the boot has been attempted');
        tooltipNode.appendChild(document.createTextNode(result.retries));
        html.replaceContent(
            document.getElementById('dd-retries'), docFrag);

        if (qemuData) {
            html.replaceContent(
                document.getElementById('other-details-div'),
                _createQemuCommand(qemuData, qemuCommand));
            html.removeClass(
                document.getElementById('other-details-div'), 'hidden');
        }
    }

    function getBootData() {
        $.when(r.get('/_ajax/boot', {id: gBootId}))
            .fail(e.error, getBootDataFail, getMultiLabDataFail)
            .done(
                getBootDataDone,
                getMultiLabData, getCompareData, getBisectData);
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

    setTimeout(getBootData, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
