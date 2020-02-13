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
    'utils/format',
    'utils/html',
    'utils/urls',
    'buttons/lab',
    'buttons/common',
    'components/boot/common',
    'utils/date'
], function(format, html, urls, labBtns, commonBtns, common) {
    'use strict';
    var gBootViews;
    var kciView;

    gBootViews = {};

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
        results: null
    };

    function showHideBind(element) {
        element.addEventListener('click', commonBtns.showHideElements, true);
    }

    function bindButtonsEvents() {
        Array.prototype.forEach.call(
            document.getElementsByClassName('click-btn'), showHideBind);
    }

    function createConflictIndex(result) {
        var conflictIndex;

        conflictIndex = result.arch.toLowerCase();

        if (result.defconfig_full) {
            conflictIndex += result.defconfig_full.toLowerCase();
        } else {
            conflictIndex += result.defconfig.toLowerCase();
        }
        if (result.board) {
            conflictIndex += result.board.toLowerCase();
        }

        return conflictIndex;
    }

    function createDataIndex(result) {
        var dataIndex;

        dataIndex = '';
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

    kciView.createPanels = function(result, index) {
        var aNode;
        var arch;
        var board;
        var bootTime;
        var colNode;
        var collapseBodyNode;
        var collapseId;
        var collapseNode;
        var ddNode;
        var defconfigFull;
        var divNode;
        var dlNode;
        var docId;
        var dtNode;
        var filterClass;
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
        var spanNode;
        var statusNode;
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
        labName = result.lab_name;
        board = result.board;
        warnings = result.warnings;
        txtLog = result.boot_log;
        htmlLog = result.boot_log_html;
        kernelImage = result.kernel_image;
        kernelImageSize = result.kernel_image_size;
        mach = result.mach;

        if (!serverURL) {
            serverURL = this.fileServer;
        }

        translatedURI = urls.createFileServerURL(serverURL, result);

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
        html.addClass(statusNode.firstElementChild, 'pull-right');

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

        hNode = document.createElement('h5');
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
                'href', urls.getHref(serverURI, [pathURI, kernelImage]));
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

        // Warnings.
        dtNode = document.createElement('dt');
        dtNode.appendChild(document.createTextNode('Warnings'));
        ddNode = document.createElement('dd');
        if (warnings !== null && warnings !== undefined) {
            ddNode.appendChild(
                document.createTextNode(
                    format.number(parseInt(warnings, 10))));
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
            'href', urls.createPathHref(['/boot/id/', docId, '/']));
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
        // Set the data-conflict attribute to filter possible boot conflicts.
        panelNode.setAttribute('data-conflict', createConflictIndex(result));

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

    kciView.conflictSelectEvent = function(event) {
        var inputGroup;
        var selector;
        var target;

        target = event.target || event.srcElement;

        /**
         * Check if an element has the "checked" attribute set.
         * The element must be different from the event target one.
         *
         * @param {NodeList} elements: The list of DOM nodes.
         * @return {Boolean}
        **/
        function _anyChecked(elements) {
            var elementsLen;
            var idx;

            elementsLen = elements.length;
            for (idx = 0; idx < elementsLen; idx = idx + 1) {
                if (elements[idx] !== target && elements[idx].checked) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Hide an element.
         * Apply a "style: none;" to a DOM element.
         *
         * @param {HTMLElement} element: The DOM element.
        **/
        function _hide(element) {
            element.style.display = 'none';
        }

        /**
         * Uncheck an input element.
         *
         * @param {HTMLElement} element: The DOM element.
        **/
        function _unchecked(element) {
            element.checked = false;
        }

        if (target.checked) {
            selector = 'input.checkbox[name="';
            selector += target.name;
            selector += '"]';

            inputGroup = document.querySelectorAll(selector);

            if (!_anyChecked(inputGroup)) {
                if (html.classed(this.buttonAll, 'active')) {
                    this.lastPressedButton = this.buttonAll;
                } else if (html.classed(this.buttonFail, 'active')) {
                    this.lastPressedButton = this.buttonFail;
                } else if (html.classed(this.buttonSuccess, 'active')) {
                    this.lastPressedButton = this.buttonSuccess;
                } else {
                    this.lastPressedButton = this.buttonUnknown;
                }
            }

            Array.prototype.forEach.call(inputGroup, _unchecked);

            target.checked = true;
            selector = 'div.searchable:not([data-conflict="';
            selector += target.getAttribute('data-arch');
            selector += target.getAttribute('data-defconfig');
            selector += target.getAttribute('data-board') + '"])';

            // Fake a click on the all button prior to filtering so we have
            // all the elements as "display: block".
            this.buttonAll.click();
            Array.prototype.forEach.call(
                this.accordionElement.querySelectorAll(selector), _hide);
        } else {
            target.checked = false;
            this.lastPressedButton.click();
        }
    };

    kciView.checkConflictsDone = function(message) {
        var arch;
        var board;
        var cellNode;
        var conflicts;
        var conflictsDiv;
        var count;
        var defconfig;
        var divNode;
        var headCell;
        var headRow;
        var htmlNode;
        var inputNode;
        var splitKey;
        var tableBody;
        var tableHead;
        var tableNode;
        var tableRow;

        function _createRow(key) {
            splitKey = key.split('|');
            arch = splitKey[0];
            defconfig = splitKey[1];
            board = splitKey[2];

            tableRow = tableBody.insertRow(-1);

            cellNode = tableRow.insertCell();
            cellNode.appendChild(document.createTextNode(arch));

            cellNode = tableRow.insertCell();
            cellNode.appendChild(document.createTextNode(defconfig));

            cellNode = tableRow.insertCell();
            cellNode.appendChild(document.createTextNode(board));

            cellNode = tableRow.insertCell();
            cellNode.className = 'pull-center';

            htmlNode = html.tooltip();
            htmlNode.setAttribute('title', 'Number of conflicting labs');
            htmlNode.appendChild(
                document.createTextNode(conflicts[key].length));

            cellNode.appendChild(htmlNode);

            // The select cell.
            cellNode = tableRow.insertCell();
            cellNode.className = 'pull-middle';

            htmlNode = html.tooltip();
            htmlNode.setAttribute('title', 'Show/Hide this conflict');

            inputNode = document.createElement('input');
            inputNode.setAttribute('type', 'checkbox');
            inputNode.className = 'checkbox';
            inputNode.setAttribute('autocomplete', 'off');
            inputNode.name = 'conflict-checkbox';
            inputNode.setAttribute('data-arch', arch.toLowerCase());
            inputNode.setAttribute('data-defconfig', defconfig.toLowerCase());
            inputNode.setAttribute('data-board', board.toLowerCase());

            /* jshint ignore: start */
            // Here "this" is bound to our object.
            inputNode.addEventListener(
                'click', this.conflictSelectEvent.bind(this));
            /* jshint ignore: end */

            htmlNode.appendChild(inputNode);
            cellNode.appendChild(htmlNode);
        }

        count = message.data[0];
        conflicts = message.data[1];

        if (count > 0) {
            // Set the header first.
            divNode = document.getElementById('conflicts-header');

            htmlNode = document.createElement('h4');
            htmlNode.appendChild(
                document.createTextNode('Conflicting Boot Reports'));

            divNode.appendChild(htmlNode);

            htmlNode = document.createElement('hr');
            htmlNode.className = 'blurred subheader';

            divNode.appendChild(htmlNode);

            // Then get the content.
            conflictsDiv = document.getElementById('conflicts-div');

            divNode = document.createElement('div');
            htmlNode = document.createElement('p');
            htmlNode.appendChild(
                document.createTextNode(
                    'Boot report conflicts have been detected.'));

            divNode.appendChild(htmlNode);
            htmlNode = document.createElement('p');
            htmlNode.appendChild(
                document.createTextNode(
                    'These are likely not failures since other boot labs ' +
                    'are reporting a successful state: they need to ' +
                    'be reviewed.'));

            divNode.appendChild(htmlNode);
            conflictsDiv.appendChild(divNode);

            divNode = document.createElement('div');
            divNode.className = 'table';

            tableNode = document.createElement('table');
            tableNode.className =
                'table table-condensed table-striped conflicts-table';

            tableHead = tableNode.createTHead();
            headRow = tableHead.insertRow();

            headCell = headRow.insertCell();
            headCell.appendChild(document.createTextNode('Architecture'));

            headCell = headRow.insertCell();
            headCell.appendChild(document.createTextNode('Defconfig'));

            headCell = headRow.insertCell();
            headCell.appendChild(document.createTextNode('Board'));

            headCell = headRow.insertCell();
            headCell.className = 'pull-center';

            htmlNode = html.tooltip();
            htmlNode.setAttribute('title', 'Number of conflicting labs');
            htmlNode.appendChild(document.createTextNode('Results'));

            headCell.appendChild(htmlNode);

            // Empty cell for the checkbox column.
            headRow.insertCell();

            divNode.appendChild(tableNode);

            conflictsDiv.appendChild(divNode);

            tableBody = document.createElement('tbody');
            tableNode.appendChild(tableBody);

            Object.keys(conflicts).forEach(_createRow.bind(this));
        }
    };

    kciView.checkConflicts = function() {
        var worker;
        if (window.Worker) {
            worker = new Worker('/static/js/worker/boot-conflicts.js');

            worker.onmessage = this.checkConflictsDone.bind(this);
            worker.postMessage(this.results);
        }
    };

    kciView.draw = function() {
        this.checkConflicts();

        this.results.forEach(this.createPanels.bind(this));
        this.createLabs();

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

    gBootViews = function(results, fileServer) {
        var newObject;

        newObject = Object.create(kciView);
        newObject.results = results;
        newObject.fileServer = fileServer || '';
        newObject.allLabs = {};
        newObject.accordionElement =
            document.getElementById('accordion-container');

        return newObject;
    };

    return gBootViews;
});
