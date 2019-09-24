/*!
 * Copyright (C) Linaro Limited 2015,2016,2017,2019
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
    'utils/html',
    'compare/events',
    'compare/const'
], function(html, cevents, constants) {
    'use strict';
    var gArchData;
    var gBoardData;
    var gCommonCompare;
    var gDefconfigData;
    var gJobData;
    var gKernelData;
    var gLabData;

    gCommonCompare = {};

    // These data structures hold configuration parameters for the various
    // input types.
    // label {String}: The label that will be used for the input field.
    // title {String}: A title for the input field, a tooltip.
    // pattern {String}: The accepted pattern to validate the values.
    // list {String}: (Optional) The data list ID to use for the valid values.
    // focusEvent {Function}: The function that will be triggered when the
    // input element receives focus.
    gJobData = {
        label: 'Tree',
        title: 'Choose a tree name',
        pattern: '[A-Za-z0-9_.-]*',
        list: 'trees',
        focusEvent: null
    };

    gKernelData = {
        label: 'Kernel',
        title: 'Choose a kernel value',
        pattern: '[A-Za-z0-9_.-]*',
        focusEvent: cevents.kernelInputFocus
    };

    gArchData = {
        label: 'Architecture',
        title: 'Choose an architecture',
        pattern: '[xarm468-_]*',
        focusEvent: cevents.archInputFocus
    };

    gDefconfigData = {
        label: 'Defconfig',
        title: 'Choose a defconfig',
        pattern: '[A-Za-z0-9_.-+=]*',
        focusEvent: cevents.defconfigInputFocus
    };

    gBoardData = {
        label: 'Board',
        title: 'Choose a board',
        pattern: '[A-Za-z-0-9_.-+]*',
        focusEvent: cevents.boardInputFocus
    };

    gLabData = {
        label: 'Lab',
        title: 'Choose a lab',
        pattern: '[A-Za-z-0-9-]*',
        focusEvent: cevents.labInputFocus
    };

    /**
     * Create an input control.
     *
     * @param {Object} options: The configuration parameters.
     * @return {HTMLElement} A div node.
    **/
    function createInputControl(options) {
        var wrapperNode;
        var divNode;
        var inputNode;
        var labelNode;

        if (!options.hasOwnProperty('required')) {
            options.required = false;
        } else {
            options.required = Boolean(options.required);
        }

        wrapperNode = document.createElement('div');
        wrapperNode.className = 'choice-wrapper';

        divNode = document.createElement('div');
        divNode.className = 'input-group input-group-sm input-choice';

        labelNode = document.createElement('label');
        labelNode.className = 'input-group-addon';
        labelNode.id = options.elementId + '-label';
        labelNode.for = options.elementId;
        labelNode.appendChild(document.createTextNode(options.label));

        divNode.appendChild(labelNode);

        inputNode = document.createElement('input');
        inputNode.id = options.elementId;
        inputNode.name = options.elementId;

        if (options.hasOwnProperty('className') && options.className) {
            inputNode.className = 'form-control ' + options.className;
        } else {
            inputNode.className = 'form-control';
        }

        inputNode.required = options.required;
        inputNode.type = 'text';
        inputNode.inputmode = 'verbatim';
        inputNode.pattern = options.pattern;
        inputNode.title = options.title;

        inputNode.setAttribute('data-type', options.type);
        Object.keys(options.data).forEach(function(key) {
            inputNode.setAttribute('data-' + key, options.data[key]);
        });

        if (options.hasOwnProperty('list') && options.list) {
            inputNode.setAttribute('list', options.list);
        }

        inputNode.setAttribute(
            'aria-describedby', options.elementId + '-label');

        if (options.hasOwnProperty('bucketId') && options.bucketId) {
            inputNode.setAttribute('data-bucket', options.bucketId);
        } else {
            inputNode.setAttribute('data-bucket', constants.DATA_BUCKET_ID);
        }

        inputNode.addEventListener('focus', cevents.removeInvalid, true);

        if (options.hasOwnProperty('focusEvent') && options.focusEvent) {
            inputNode.addEventListener('focus', options.focusEvent, true);
        }

        divNode.appendChild(inputNode);
        wrapperNode.appendChild(divNode);

        divNode = document.createElement('div');
        divNode.id = options.elementId + '-notify';
        divNode.className = 'input-notify';

        wrapperNode.appendChild(divNode);

        return wrapperNode;
    }

    /**
     * Create the job targets choice.
     *
     * @param {Object} options: The configuration parameters.
     * @return {HTMLElement} A div node.
    **/
    function createJobMultiChoice(options) {
        var divNode;

        divNode = document.createElement('div');
        divNode.className = 'choice-group';

        options.treeId = 'compare-tree' + options.idx;
        options.kernelId = 'compare-kernel' + options.idx;

        options.data.tree = options.treeId;
        options.data.kernel = options.kernelId;

        // The tree choice.
        options.elementId = options.treeId;
        options.className = 'tree';
        Object.keys(gJobData).forEach(function(key) {
            options[key] = gJobData[key];
        });

        divNode.appendChild(createInputControl(options));
        // Force the 'list' value to null to not pollute other input fields.
        options.list = null;
        options.className = null;

        // The kernel choice.
        options.elementId = options.kernelId;
        Object.keys(gKernelData).forEach(function(key) {
            options[key] = gKernelData[key];
        });

        divNode.appendChild(createInputControl(options));

        return divNode;
    }

    /**
     * Create the baseline choice for job comparison.
     *
     * @param {Object} options: The configuration parameters.
     * @return {HTMLElement} A div node.
    **/
    function createJobChoice(options) {
        var divNode;

        divNode = document.createElement('div');
        divNode.className = 'choice-group';

        if (!options.hasOwnProperty('treeId')) {
            options.treeId = 'baseline-tree';
        }

        if (!options.hasOwnProperty('kernelId')) {
            options.kernelId = 'baseline-kernel';
        }

        if (!options.hasOwnProperty('data')) {
            options.data = {};
        }

        options.data.tree = options.treeId;
        options.data.kernel = options.kernelId;

        // The tree choice.
        options.elementId = options.treeId;
        Object.keys(gJobData).forEach(function(key) {
            options[key] = gJobData[key];
        });

        divNode.appendChild(createInputControl(options));
        // Force the 'list' value to null to not pollute other input fields.
        options.list = null;

        // The kernel choice.
        options.elementId = options.kernelId;
        Object.keys(gKernelData).forEach(function(key) {
            options[key] = gKernelData[key];
        });

        divNode.appendChild(createInputControl(options));

        return divNode;
    }

    /**
     * Create the compare targets multi-choice elements.
     *
     * @param {Object} options: The configuration parameters.
     * @return {HTMLElement} A div node.
    **/
    function createBuildMultiChoice(options) {
        var divNode;

        options.defconfigId = 'compare-defconfig' + options.idx;
        options.archId = 'compare-arch' + options.idx;
        options.data.defconfig = options.defconfigId;
        options.data.arch = options.archId;

        // Start from the base of tree-kernel.
        divNode = createJobMultiChoice(options);

        // Then defconfig choice.
        options.elementId = options.defconfigId;
        Object.keys(gDefconfigData).forEach(function(key) {
            options[key] = gDefconfigData[key];
        });

        divNode.appendChild(createInputControl(options));

        // The architecture choice.
        options.elementId = options.archId;
        Object.keys(gArchData).forEach(function(key) {
            options[key] = gArchData[key];
        });

        divNode.appendChild(createInputControl(options));

        return divNode;
    }

    /**
     * Create the baseline choice for build comparisons.
     *
     * @param {Object} options: The configuration parameters.
    **/
    function createBuildChoice(options) {
        var divNode;

        options.defconfigId = 'baseline-defconfig';
        options.archId = 'baseline-arch';
        options.data.defconfig = options.defconfigId;
        options.data.arch = options.archId;

        // Start from the base of tree-kernel.
        divNode = createJobChoice(options);

        // The defconfig choice.
        options.elementId = options.defconfigId;
        Object.keys(gDefconfigData).forEach(function(key) {
            options[key] = gDefconfigData[key];
        });

        divNode.appendChild(createInputControl(options));

        // The architecture choice.
        options.elementId = options.archId;
        Object.keys(gArchData).forEach(function(key) {
            options[key] = gArchData[key];
        });

        divNode.appendChild(createInputControl(options));

        return divNode;
    }

    function createBootMultiChoice(options) {
        var divNode;
        var oldArchFunc;
        var oldDefconfigFunc;

        options.boardId = 'compare-board' + options.idx;
        options.labId = 'compare-lab' + options.idx;
        options.data.board = options.boardId;
        options.data.lab = options.labId;

        // Keep a reference of the default focus events for defconfig and arch
        // since we need to override them.
        oldArchFunc = gArchData.focusEvent;
        oldDefconfigFunc = gDefconfigData.focusEvent;

        gDefconfigData.focusEvent = cevents.defconfigBootInputFocus;
        gArchData.focusEvent = cevents.archBootInputFocus;

        divNode = createBuildMultiChoice(options);

        // The board choice.
        options.elementId = options.boardId;
        Object.keys(gBoardData).forEach(function(key) {
            options[key] = gBoardData[key];
        });

        divNode.appendChild(createInputControl(options));

        // The lab choice.
        options.elementId = options.labId;
        Object.keys(gLabData).forEach(function(key) {
            options[key] = gLabData[key];
        });

        divNode.appendChild(createInputControl(options));

        // Restore the old focus events.
        gDefconfigData.focusEvent = oldDefconfigFunc;
        gArchData.focusEvent = oldArchFunc;

        return divNode;
    }

    function createBootChoice(options) {
        var divNode;
        var oldArchFunc;
        var oldDefconfigFunc;

        options.boardId = 'baseline-board';
        options.labId = 'baseline-lab';
        options.data.board = options.boardId;
        options.data.lab = options.labId;

        // Keep a reference of the default focus events for defconfig and arch
        // since we need to override them.
        oldArchFunc = gArchData.focusEvent;
        oldDefconfigFunc = gDefconfigData.focusEvent;

        gDefconfigData.focusEvent = cevents.defconfigBootInputFocus;
        gArchData.focusEvent = cevents.archBootInputFocus;

        // Start from the base defconfing selection.
        divNode = createBuildChoice(options);

        // The board choice.
        options.elementId = options.boardId;
        Object.keys(gBoardData).forEach(function(key) {
            options[key] = gBoardData[key];
        });

        divNode.appendChild(createInputControl(options));

        // The lab choice.
        options.elementId = options.labId;
        Object.keys(gLabData).forEach(function(key) {
            options[key] = gLabData[key];
        });

        divNode.appendChild(createInputControl(options));

        // Restore the old focus events.
        gDefconfigData.focusEvent = oldDefconfigFunc;
        gArchData.focusEvent = oldArchFunc;

        return divNode;
    }

    /**
     * Wrapper aroung the multi-choice targets creation.
     *
     * @param {Object} options: The necessary options to setup the selection
     * targets.
     * @return {HTMLElement} A div node containing all the necessary targets.
    **/
    function createMultiChoice(options) {
        var choiceNode;
        var divNode;
        var numberDivNode;
        var tooltipNode;

        divNode = document.createElement('div');
        divNode.id = 'compare-choice' + options.idx;

        if (!options.hasOwnProperty('required')) {
            options.required = false;
        } else {
            options.required = Boolean(options.required);
        }

        numberDivNode = document.createElement('div');
        numberDivNode.className = 'choice-group-number ' + options.type;

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Compare target ' + options.idx);
        tooltipNode.appendChild(document.createTextNode(options.idx));

        numberDivNode.appendChild(tooltipNode);
        divNode.appendChild(numberDivNode);

        // Set up the data structure to hold HTML data-* attributes.
        // The key will be used for the data-* name.
        options.data = {};

        switch (options.type) {
            case 'job':
                choiceNode = createJobMultiChoice(options);
                break;
            case 'build':
                choiceNode = createBuildMultiChoice(options);
                break;
            default:
                choiceNode = createBootMultiChoice(options);
                break;
        }

        divNode.appendChild(choiceNode);

        return divNode;
    }

    /**
     * Create the multiple comparison targets choice.
     *
     * Accepts a configuration object consisting of the following attributes:
     *
     * type {String}: The type of the target choice [job, build, boot].
     * idx {Number}: The index number of the choice.
     * required {Boolean}: If the input fields are required.
     * bucketId {String}: The ID of the datalist container bucket.
     * data {Object}: A data structure to hold data-* attributes.
     *
     * @param {Object} options: The configuration object.
     *
    **/
    gCommonCompare.multiChoice = function(options) {
        return createMultiChoice(options);
    };

    /**
     * Create an HTML form element.
     *
     * @return {HTMLForm} An HTML form element.
    **/
    gCommonCompare.form = function() {
        var formNode;

        formNode = document.createElement('form');
        formNode.acceptCharset = 'UTF-8';
        formNode.enctype = 'text/plain';
        formNode.autocomplete = 'off';
        formNode.method = 'POST';

        return formNode;
    };

    /**
     * Create a div element that should contain datalist data.
     *
     * @param {String} bucketId: The id the new element should have. If not
     * specified it will default to 'data-bucket'.
    **/
    gCommonCompare.dataBucket = function(bucketId) {
        var divNode;

        divNode = document.createElement('div');

        if (bucketId === undefined || bucketId === null) {
            divNode.id = constants.DATA_BUCKET_ID;
        } else {
            divNode.id = bucketId;
        }

        return divNode;
    };

    gCommonCompare.bootChoice = function(options) {
        return createBootChoice(options);
    };

    /**
     * Create the basic build choice target.
     *
     * @param {Object} options: The configuration parameters.
    **/
    gCommonCompare.buildChoice = function(options) {
        return createBuildChoice(options);
    };

    /**
     * Create the basic job choice target.
     *
     * @param {Object} options: The configuration parameters.
    **/
    gCommonCompare.jobChoice = function(options) {
        return createJobChoice(options);
    };

    /**
     * Create a div element with +/- buttons to add/remove compare targets.
     *
     * @param {String} containerId: The ID of the container element that will
     * hold new compare target selections.
     * @param {String} type: The type of the compare choice.
    **/
    gCommonCompare.addRemoveButtons = function(containerId, type, bucketId) {
        var buttonGroupNode;
        var buttonNode;
        var container;
        var divNode;

        container = document.createElement('div');
        container.id = 'choice-add-buttons';
        container.className = 'choice-buttons';

        divNode = document.createElement('div');
        divNode.className = 'compare-add-buttons pull-right';

        buttonGroupNode = document.createElement('div');
        buttonGroupNode.className = 'btn-group btn-group-xs';
        buttonGroupNode.setAttribute('role', 'group');
        buttonGroupNode.setAttribute(
            'aria-label', 'Add/Remove compare targets');

        // The remove button.
        buttonNode = document.createElement('button');
        buttonNode.id = 'remove-button';
        buttonNode.type = 'button';
        buttonNode.className = 'btn btn-default';
        buttonNode.setAttribute('data-index', 1);
        buttonNode.setAttribute('data-container', containerId);
        buttonNode.setAttribute('title', 'Remove last compare target added');
        buttonNode.insertAdjacentHTML('beforeend', '&#8722;');
        buttonNode.disabled = true;

        buttonNode.addEventListener('click', cevents.removeTarget);

        buttonGroupNode.appendChild(buttonNode);

        // The add button.
        buttonNode = document.createElement('button');
        buttonNode.id = 'add-button';
        buttonNode.type = 'button';
        buttonNode.className = 'btn btn-default';
        buttonNode.setAttribute('data-index', 1);
        buttonNode.setAttribute('data-container', containerId);
        buttonNode.setAttribute('data-type', type);
        buttonNode.setAttribute('data-bucket', bucketId);
        buttonNode.setAttribute('title', 'Add a new compare target');
        buttonNode.insertAdjacentHTML('beforeend', '&#43;');

        buttonNode.addEventListener('click', function(event) {
            cevents.addTarget(event, createMultiChoice);
        });

        buttonGroupNode.appendChild(buttonNode);

        divNode.appendChild(buttonGroupNode);
        container.appendChild(divNode);

        return container;
    };

    /**
     * Create the DOM structure to hold the baseline selection.
    **/
    gCommonCompare.baseline = function() {
        var divNode;
        var numberDivNode;

        divNode = document.createElement('div');
        divNode.id = 'baseline-choice';

        numberDivNode = document.createElement('div');
        numberDivNode.className = 'choice-group-number';

        divNode.appendChild(numberDivNode);
        return divNode;
    };

    /**
     * Create the compare button for the submit action.
     *
     * @param {String} type: The type of comparison to submit.
    **/
    gCommonCompare.submitButton = function(type) {
        var buttonDivNode;
        var buttonNode;
        var divNode;

        divNode = document.createElement('div');
        divNode.className = 'col-xs-6 col-sm-6 col-md-6 col-lg-6';

        buttonDivNode = document.createElement('div');
        buttonDivNode.className = 'form-submit pull-right';

        buttonNode = document.createElement('button');
        buttonNode.id = 'compare-button';
        buttonNode.type = 'submit';
        buttonNode.className = 'btn btn-default';
        buttonNode.setAttribute('data-type', type);
        buttonNode.title = 'Launch the comparison';
        buttonNode.appendChild(document.createTextNode('Compare'));

        buttonNode.addEventListener('click', cevents.submitCompare, false);

        buttonDivNode.appendChild(buttonNode);
        divNode.appendChild(buttonDivNode);

        return divNode;
    };

    return gCommonCompare;
});
