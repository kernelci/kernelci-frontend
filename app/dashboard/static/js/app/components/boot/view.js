/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/base',
    'utils/html',
    'utils/urls',
    'buttons/boot',
    'components/boot/common',
    'utils/date'
], function(base, html, urls, buttons, common) {
    'use strict';
    var gBootViews,
        kciView;

    gBootViews = {};

    kciView = {
        element: null,
        allLabs: null,
        fileServer: null,
        hasFail: false,
        hasSuccess: false,
        hasUnknown: false
    };

    function createDataIndex(result) {
        var dataIndex;

        dataIndex = '';
        dataIndex += result.job.toLowerCase();
        dataIndex += result.kernel.toLowerCase();
        dataIndex += result.arch.toLowerCase();

        if (result.defconfig_full) {
            dataIndex += result.defconfig_full.toLowerCase();
        } else {
            dataIndex += result.defconfig.toLowerCase();
        }
        if (result.status) {
            dataIndex += result.status.toLowerCase();
        }
        if (result.board) {
            dataIndex += result.board.toLowerCase();
        }
        if (result.board_instance) {
            dataIndex += result.board_instance.toLowerCase();
        }
        if (result.mach) {
            dataIndex += result.mach.toLowerCase();
        }
        if (result.endian) {
            dataIndex += result.endian.toLowerCase();
        }

        return dataIndex;
    }

    kciView.createLabSection = function(lab) {
        var divNode,
            otherDivNode,
            hNode,
            ruleNode,
            spanNode;

        divNode = document.createElement('div');
        divNode.id = lab;

        otherDivNode = document.createElement('div');
        otherDivNode.className = 'other-header';

        hNode = document.createElement('h4');
        hNode.insertAdjacentHTML(
            'beforeend', sprintf('Lab &#171;%s&#187;', lab));

        otherDivNode.appendChild(hNode);
        otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

        spanNode = document.createElement('span');
        spanNode.id = 'boot-count-' + lab;

        otherDivNode.appendChild(spanNode);
        otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

        spanNode = document.createElement('span');
        spanNode.id = 'unique-count-' + lab;

        otherDivNode.appendChild(spanNode);
        otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'pull-right';
        spanNode.id = 'view-eye-' + lab;
        spanNode.insertAdjacentHTML(
            'beforeend', buttons.createShowHideLabBtn(lab, 'hide'));

        otherDivNode.appendChild(spanNode);

        ruleNode = document.createElement('hr');
        ruleNode.className = 'blurred subheader';

        otherDivNode.appendChild(ruleNode);
        divNode.appendChild(otherDivNode);

        otherDivNode = document.createElement('div');
        otherDivNode.className = 'pull-center';
        otherDivNode.id = 'view-' + lab;

        divNode.appendChild(otherDivNode);

        otherDivNode = document.createElement('div');
        otherDivNode.className = 'panel-group';
        otherDivNode.id = 'accordion-' + lab;

        this.allLabs[lab].forEach(function(node) {
            otherDivNode.appendChild(node);
        });

        divNode.appendChild(otherDivNode);
        this.element.appendChild(divNode);
    };

    kciView.createPanels = function(result, index, fileServer) {
        var aNode,
            arch,
            board,
            bootTime,
            colNode,
            collapseBodyNode,
            collapseId,
            collapseNode,
            ddNode,
            defconfigFull,
            divNode,
            dlNode,
            docId,
            dtNode,
            filterClass,
            hNode,
            headingNode,
            htmlLog,
            job,
            kernel,
            kernelImage,
            kernelImageSize,
            labName,
            mach,
            panelNode,
            pathURI,
            rowNode,
            serverResource,
            serverURI,
            serverURL,
            smallNode,
            spanNode,
            statusNode,
            tooltipNode,
            translatedURI,
            txtLog,
            warnings;

        job = result.job;
        kernel = result.kernel;
        docId = result._id.$oid;
        serverURL = result.file_server_url;
        serverResource = result.file_server_resource;
        defconfigFull = result.defconfig_full;
        arch = result.arch;
        labName = result.lab_name;
        board = result.board;
        warnings = result.warnings;
        txtLog = result.boot_log;
        htmlLog = result.boot_log_html;
        kernelImage = result.kernel_image;
        kernelImageSize = result.kernel_image_size;
        mach = result.mach;

        if (!serverURL) {
            serverURL = fileServer;
        }

        translatedURI = urls.translateServerURL(
            serverURL,
            serverResource, [job, kernel, arch + '-' + defconfigFull]);

        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        switch (result.status) {
            case 'FAIL':
                this.hasFail = true;
                statusNode = html.fail();
                filterClass = 'df-failed';
                break;
            case 'PASS':
                this.hasSuccess = true;
                statusNode = html.success();
                filterClass = 'df-success';
                break;
            default:
                this.hasUnknown = true;
                statusNode = html.unknown();
                filterClass = 'df-unknown';
                break;
        }
        html.addClass(statusNode, 'pull-right');

        panelNode = document.createElement('div');
        panelNode.className = 'panel panel-default searchable ' +
            filterClass;

        collapseId = 'collapse-boot-' + index;

        headingNode = document.createElement('div');
        headingNode.className = 'panel-heading collapsed';
        headingNode.id = 'panel-boot-' + index;
        headingNode.setAttribute('aria-expanded', false);
        headingNode.setAttribute('data-parent', '#accordion-' + labName);
        headingNode.setAttribute('data-toggle', 'collapse');
        headingNode.setAttribute('data-target', '#' + collapseId);
        headingNode.setAttribute('aria-controls', '#' + collapseId);

        hNode = document.createElement('h4');
        hNode.className = 'panel-title';

        aNode = document.createElement('a');
        aNode.setAttribute('data-parent', '#accordion-' + labName);
        aNode.setAttribute('data-toggle', 'collapse');
        aNode.setAttribute('href', '#' + collapseId);
        aNode.setAttribute('aria-controls', '#' + collapseId);
        aNode.appendChild(document.createTextNode(board));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');

        smallNode = document.createElement('small');
        smallNode.appendChild(document.createTextNode(defconfigFull));

        aNode.appendChild(smallNode);
        hNode.appendChild(aNode);

        if (arch) {
            spanNode = document.createElement('span');
            spanNode.className = 'arch-label';
            spanNode.appendChild(document.createTextNode(arch));
            hNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
            hNode.appendChild(spanNode);
        }

        hNode.appendChild(statusNode);
        headingNode.appendChild(hNode);
        panelNode.appendChild(headingNode);

        collapseNode = document.createElement('div');
        collapseNode.id = collapseId;
        collapseNode.className = 'panel-collapse collapse';
        collapseNode.setAttribute('aria-expanded', false);

        collapseBodyNode = document.createElement('div');
        collapseBodyNode.className = 'panel-body';

        rowNode = document.createElement('div');
        rowNode.className = 'row';

        colNode = document.createElement('div');
        colNode.className = 'col-xs-6 col-sm-6 col-md-6 col-lg-6';

        dlNode = document.createElement('dl');
        dlNode.className = 'dl-horizontal';

        // SoC.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('SoC'));
        ddNode = document.createElement('dd');
        if (mach) {
            ddNode.appendChild(document.createTextNode(mach));
        } else {
            ddNode.appendChild(html.nonavail());
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        // Endianness.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Endianness'));
        ddNode = document.createElement('dd');
        if (result.endian) {
            ddNode.appendChild(document.createTextNode(result.endian));
        } else {
            ddNode.appendChild(html.nonavail());
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        // Kernel image.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Kernel image'));
        ddNode = document.createElement('dd');
        if (kernelImage) {
            aNode = document.createElement('a');
            aNode.setAttribute(
                'href',
                serverURI
                    .path(pathURI + '/' + kernelImage)
                    .normalizePath().href()
            );
            aNode.appendChild(
                document.createTextNode(kernelImage));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());
            ddNode.appendChild(aNode);

            if (kernelImageSize) {
                ddNode.insertAdjacentHTML('beforeend', '&nbsp;');
                smallNode = document.createElement('small');
                smallNode.appendChild(
                    document.createTextNode(
                        base.bytesToHuman(kernelImageSize)));
                ddNode.appendChild(smallNode);
            }
        } else {
            ddNode.appendChild(html.nonavail());
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        colNode.appendChild(dlNode);
        rowNode.appendChild(colNode);

        colNode = document.createElement('div');
        colNode.className = 'col-xs-6 col-sm-6 col-md-6 col-lg-6';

        dlNode = document.createElement('dl');
        dlNode.className = 'dl-horizontal';

        // Warnings.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Warnings'));
        ddNode = document.createElement('dd');
        if (warnings !== null && warnings !== undefined) {
            ddNode.appendChild(
                document.createTextNode(
                    base.formatNumber(parseInt(warnings, 10))));
        } else {
            ddNode.appendChild(document.createTextNode('0'));
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        // Boot time.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Boot time'));
        ddNode = document.createElement('dd');

        if (result.time !== null || result.time !== undefined) {
            bootTime = new Date(result.time.$date);
            ddNode.appendChild(
                document.createTextNode(bootTime.toCustomTime()));
        } else {
            ddNode.appendChild(html.nonavail());
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        // Boot logs.
        if (txtLog || htmlLog) {
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Boot log'));

            ddNode = document.createElement('dd');
            ddNode.appendChild(
                common.logsNode(txtLog, htmlLog, labName, serverURI, pathURI));

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);
        }

        colNode.appendChild(dlNode);
        rowNode.appendChild(colNode);

        // More info link.
        colNode = document.createElement('div');
        colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

        divNode = document.createElement('div');
        divNode.className = 'pull-center';

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Boot report details');
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href',
            '/boot/' + board + '/job/' + job + '/kernel/' + kernel +
            '/defconfig/' + defconfigFull + '/lab/' + labName +
            '/?_id=' + docId
        );
        aNode.appendChild(document.createTextNode('More info'));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);
        divNode.appendChild(tooltipNode);

        colNode.appendChild(divNode);
        rowNode.appendChild(colNode);

        collapseBodyNode.appendChild(rowNode);
        collapseNode.appendChild(collapseBodyNode);
        panelNode.appendChild(collapseNode);

        // Set the data-index attribute to filter the results.
        panelNode.setAttribute('data-index', createDataIndex(result));

        if (this.allLabs.hasOwnProperty(labName)) {
            this.allLabs[labName].push(panelNode);
        } else {
            this.allLabs[labName] = [];
            this.allLabs[labName].push(panelNode);
        }

        return this;
    };

    kciView.createLabs = function() {
        html.removeChildren(this.element);
        Object.keys(this.allLabs).sort()
            .forEach(this.createLabSection.bind(this));

        return this;
    };

    kciView.draw = function(results) {
        function _draw(result, index) {
            this.createPanels(result, index, this.fileServer);
        }

        results.forEach(_draw.bind(this));
        this.createLabs();

        return this;
    };

    gBootViews = function(containerId, fileServer) {
        var newObject;

        newObject = Object.create(kciView);
        newObject.element = document.getElementById(containerId);
        newObject.fileServer = fileServer || '';
        newObject.allLabs = {};

        return newObject;
    };

    return gBootViews;
});
