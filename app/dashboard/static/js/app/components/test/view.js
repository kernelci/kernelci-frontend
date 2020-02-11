/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * Copyright (C) 2020  Collabora Ltd.
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
    'utils/format',
    'utils/html',
    'utils/urls',
    'buttons/lab',
    'buttons/common',
    'components/test/common',
], function(format, html, urls, labBtns, commonBtns, common) {
    'use strict';
    var gViews;
    var kciView;

    gViews = {};

    kciView = {
        accordionElement: null,
        allLabs: null,
        buttonAll: document.getElementById('all-btn'),
        buttonFail: document.getElementById('fail-btn'),
        buttonSuccess: document.getElementById('success-btn'),
        buttonUnknown: document.getElementById('unknown-btn'),
        element: null,
        fileServer: null,
        lastPressedButton: null,
        hasFail: false,
        hasSuccess: false,
        hasUnknown: false,
        results: null,
    };

    function showHideBind(element) {
        element.addEventListener('click', commonBtns.showHideElements, true);
    }

    function bindButtonsEvents() {
        Array.prototype.forEach.call(
            document.getElementsByClassName('click-btn'), showHideBind);
    }

    kciView.createDataIndex = function(result) {
        var dataIndex;

        dataIndex =
            result.name + '-' +
            result.lab_name + '-' +
            result.device_type + '-' +
            result.build_environment + '-' +
            result.defconfig_full;

        return dataIndex;
    }

    kciView.createLabSection = function(lab) {
        var buttonNode;
        var divNode;
        var otherDivNode;
        var hNode;
        var ruleNode;
        var spanNode;

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
        spanNode.id = 'test-count-' + lab;

        otherDivNode.appendChild(spanNode);
        otherDivNode.insertAdjacentHTML('beforeend', '&nbsp;');

        spanNode = document.createElement('span');
        spanNode.className = 'pull-right';
        spanNode.id = 'view-eye-' + lab;

        buttonNode = labBtns.createShowHideLabBtn(lab, 'hide');
        buttonNode.addEventListener('click', labBtns.showHideLab, true);

        spanNode.appendChild(buttonNode);

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
        this.accordionElement.appendChild(divNode);
    };

    kciView.createStatusNode = function(status) {
        var statusNode;

        switch (status) {
            case 'FAIL':
                this.hasFail = true;
                statusNode = html.fail();
                break;
            case 'PASS':
                this.hasSuccess = true;
                statusNode = html.success();
                break;
            default:
                this.hasUnknown = true;
                statusNode = html.unknown();
                break;
        }
        html.addClass(statusNode.firstElementChild, 'pull-right');
        return statusNode;
    }

    kciView.addFilterClass = function(panelNode, status) {
        var filterClass;

        switch (status) {
            case 'FAIL':
                filterClass = 'df-failed';
                break;
            case 'PASS':
                filterClass = 'df-success';
                break;
            default:
                filterClass = 'df-unknown';
                break;
        }
        html.addClass(panelNode, filterClass);
    };

    kciView.createPanels = function(result, index) {
        var aNode;
        var arch;
        var buildEnv;
        var colNode;
        var collapseBodyNode;
        var collapseId;
        var collapseNode;
        var dataIndex;
        var ddNode;
        var defconfigFull;
        var deviceType;
        var divNode;
        var dlNode;
        var docId;
        var dtNode;
        var hNode;
        var headingNode;
        var htmlLog;
        var job;
        var kernel;
        var kernelImage;
        var kernelImageSize;
        var labName;
        var mach;
        var panelNode;
        var pathURI;
        var rowNode;
        var serverURI;
        var serverURL;
        var smallNode;
        var statusParent;
        var statusSpinner;
        var tooltipNode;
        var translatedURI;
        var txtLog;
        var warnings;

        job = result.job;
        kernel = result.kernel;
        docId = result._id.$oid;
        serverURL = result.file_server_url;
        defconfigFull = result.defconfig_full;
        arch = result.arch;
        buildEnv = result.build_environment;
        labName = result.lab_name;
        deviceType = result.device_type;
        warnings = result.warnings;
        txtLog = result.boot_log;
        htmlLog = result.boot_log_html;
        kernelImage = result.kernel_image;
        kernelImageSize = result.kernel_image_size;
        mach = result.mach;
        dataIndex = this.createDataIndex(result);

        if (!serverURL) {
            serverURL = this.fileServer;
        }

        translatedURI = urls.createFileServerURL(serverURL, result);

        serverURI = translatedURI[0];
        pathURI = translatedURI[1];

        panelNode = document.createElement('div');
        panelNode.className = 'panel panel-default searchable ';

        collapseId = 'collapse-test-' + index;

        headingNode = document.createElement('div');
        headingNode.className = 'panel-heading collapsed';
        headingNode.id = 'panel-test-' + index;
        headingNode.setAttribute('aria-expanded', false);
        headingNode.setAttribute('data-parent', '#accordion-' + labName);
        headingNode.setAttribute('data-toggle', 'collapse');
        headingNode.setAttribute('data-target', '#' + collapseId);
        headingNode.setAttribute('aria-controls', '#' + collapseId);

        hNode = document.createElement('h5');
        hNode.id = dataIndex;
        hNode.className = 'panel-title';

        aNode = document.createElement('a');
        aNode.setAttribute('data-parent', '#accordion-' + labName);
        aNode.setAttribute('data-toggle', 'collapse');
        aNode.setAttribute('href', '#' + collapseId);
        aNode.setAttribute('aria-controls', '#' + collapseId);
        aNode.appendChild(document.createTextNode(deviceType));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');

        smallNode = document.createElement('small');
        smallNode.appendChild(document.createTextNode(defconfigFull));

        aNode.appendChild(smallNode);
        hNode.appendChild(aNode);

        if (arch) {
            var archNode;

            archNode = document.createElement('span');
            archNode.className = 'arch-label';
            archNode.appendChild(document.createTextNode(arch));
            hNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
            hNode.appendChild(archNode);
        }

        if (buildEnv) {
            var buildEnvNode;

            buildEnvNode = document.createElement('span');
            buildEnvNode.className = 'build-env-label';
            buildEnvNode.appendChild(document.createTextNode(buildEnv));
            hNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
            hNode.appendChild(buildEnvNode);
        }

        statusParent = document.createElement('i');
        statusParent.id = dataIndex + '-status';
        statusSpinner = document.createElement('i');
        statusSpinner.className =
            'fa fa-circle-o-notch fa-spin fa-fw pull-right';
        statusParent.appendChild(statusSpinner);
        hNode.appendChild(statusParent);

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

        /* SoC */
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

        /* Endianness */
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

        /* Kernel image */
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Kernel image'));
        ddNode = document.createElement('dd');
        if (kernelImage) {
            aNode = document.createElement('a');
            aNode.href =
                serverURI + result.file_server_resource + '/' + kernelImage;
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
                        '(' + format.bytes(kernelImageSize) + ')'));
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

        /* Job time */
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Job time'));
        ddNode = document.createElement('dd');

        if (result.time && result.time.$date) {
            var jobTime;

            jobTime = new Date(result.time.$date);
            ddNode.appendChild(
                document.createTextNode(jobTime.toCustomTime()));
        } else {
            ddNode.appendChild(html.nonavail());
        }

        dlNode.appendChild(dtNode);
        dlNode.appendChild(ddNode);

        /* Job logs */
        if (txtLog || htmlLog) {
            dtNode = document.createElement('dt');
            dtNode.appendChild(document.createTextNode('Full log'));

            ddNode = document.createElement('dd');
            ddNode.appendChild(
                common.logsNode(txtLog, htmlLog, labName, serverURI, pathURI));

            dlNode.appendChild(dtNode);
            dlNode.appendChild(ddNode);
        }

        colNode.appendChild(dlNode);
        rowNode.appendChild(colNode);

        /* Regressions */
        colNode = document.createElement('div');
        colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
        divNode = document.createElement('div');
        divNode.id = dataIndex + '-regression';
        colNode.appendChild(divNode);
        rowNode.appendChild(colNode);

        /* Detailed report link */
        colNode = document.createElement('div');
        colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

        divNode = document.createElement('div');
        divNode.className = 'pull-center';

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Test report details');
        aNode = document.createElement('a');
        aNode.setAttribute(
            'href', urls.createPathHref(['/test/plan/id/', docId, '/']));
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

        /* Set the data-index attribute to filter the results */
        panelNode.setAttribute('data-index', dataIndex);
        panelNode.id = dataIndex + '-panel';

        if (this.allLabs.hasOwnProperty(labName)) {
            this.allLabs[labName].push(panelNode);
        } else {
            this.allLabs[labName] = [];
            this.allLabs[labName].push(panelNode);
        }

        return this;
    };

    kciView.createLabs = function() {
        html.removeChildren(this.accordionElement);
        Object.keys(this.allLabs).sort()
            .forEach(this.createLabSection.bind(this));

        return this;
    };

    kciView.draw = function() {
        this.results.forEach(this.createPanels.bind(this));
        this.createLabs();
        commonBtns.hideAllByClass('panel');
        return this;
    };

    kciView.enableButtons = function() {
        if (this.hasFail) {
            this.buttonFail.removeAttribute('disabled');
        }

        if (this.hasSuccess) {
            this.buttonSuccess.removeAttribute('disabled');
        }

        if (this.hasUnknown) {
            this.buttonUnknown.removeAttribute('disabled');
        }

        this.buttonAll.removeAttribute('disabled');

        this.buttonSuccess.addEventListener(
            'click', commonBtns.showHideElements, true);
        this.buttonFail.addEventListener(
            'click', commonBtns.showHideElements, true);
        this.buttonUnknown.addEventListener(
            'click', commonBtns.showHideElements, true);
        this.buttonAll.addEventListener(
            'click', commonBtns.showHideElements, true);

        bindButtonsEvents();

        return this;
    };

    gViews = function(results, fileServer) {
        var newObject;

        newObject = Object.create(kciView);
        newObject.results = results;
        newObject.fileServer = fileServer || '';
        newObject.allLabs = {};
        newObject.accordionElement =
            document.getElementById('accordion-container');

        return newObject;
    };

    return gViews;
});
