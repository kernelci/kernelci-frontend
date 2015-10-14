/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'compare/events',
    'compare/const'
], function(html, cevents, constants) {
    'use strict';
    var commonCompare;

    commonCompare = {};

    function createKernelChoice(kernelId, treeId, required, bucketId) {
        var wrapperNode,
            divNode,
            inputNode,
            labelNode;

        if (required === undefined || required === null) {
            required = false;
        } else {
            required = Boolean(required);
        }

        wrapperNode = document.createElement('div');
        wrapperNode.className = 'choice-wrapper';

        divNode = document.createElement('div');
        divNode.className = 'input-group input-group-sm input-choice';

        labelNode = document.createElement('label');
        labelNode.className = 'input-group-addon';
        labelNode.id = kernelId + '-label';
        labelNode.for = kernelId;
        labelNode.appendChild(document.createTextNode('Kernel'));

        divNode.appendChild(labelNode);

        inputNode = document.createElement('input');
        inputNode.id = kernelId;
        inputNode.name = kernelId;
        inputNode.className = 'form-control kernel';
        inputNode.required = required;
        inputNode.type = 'text';
        inputNode.inputmode = 'verbatim';
        inputNode.pattern = '[A-Za-z0-9_.-]*';
        inputNode.title = 'Choose a kernel name';
        inputNode.setAttribute('data-tree', treeId);
        inputNode.setAttribute('aria-describedby', kernelId + '-label');

        if (bucketId !== undefined && bucketId !== null && bucketId !== '') {
            inputNode.setAttribute('data-bucket', bucketId);
        } else {
            inputNode.setAttribute('data-bucket', constants.DATA_BUCKET_ID);
        }

        inputNode.addEventListener('focus', cevents.removeInvalid, true);
        inputNode.addEventListener('focus', cevents.kernelInputFocus, true);

        divNode.appendChild(inputNode);
        wrapperNode.appendChild(divNode);

        divNode = document.createElement('div');
        divNode.id = kernelId + '-notify';
        divNode.className = 'input-notify';

        wrapperNode.appendChild(divNode);

        return wrapperNode;
    }

    function createTreeChoice(treeId, kernelId, required) {
        var wrapperNode,
            divNode,
            inputNode,
            labelNode;

        if (required === undefined || required === null) {
            required = false;
        } else {
            required = Boolean(required);
        }

        wrapperNode = document.createElement('div');
        wrapperNode.className = 'choice-wrapper';

        divNode = document.createElement('div');
        divNode.className = 'input-group input-group-sm input-choice';

        labelNode = document.createElement('label');
        labelNode.className = 'input-group-addon';
        labelNode.id = treeId + '-label';
        labelNode.for = treeId;
        labelNode.appendChild(document.createTextNode('Tree'));

        divNode.appendChild(labelNode);

        inputNode = document.createElement('input');
        inputNode.id = treeId;
        inputNode.name = treeId;
        inputNode.className = 'form-control tree';
        inputNode.required = required;
        inputNode.type = 'text';
        inputNode.inputmode = 'verbatim';
        inputNode.pattern = '[A-Za-z0-9_.-]*';
        inputNode.title = 'Choose a tree name';
        inputNode.setAttribute('list', 'trees');
        inputNode.setAttribute('data-kernel', kernelId);
        inputNode.setAttribute('aria-describedby', treeId + '-label');

        inputNode.addEventListener('focus', cevents.removeInvalid, true);

        divNode.appendChild(inputNode);
        wrapperNode.appendChild(divNode);

        divNode = document.createElement('div');
        divNode.id = treeId + '-notify';
        divNode.className = 'input-notify';

        wrapperNode.appendChild(divNode);

        return wrapperNode;
    }

    function createJobMultiChoice(idx, required, bucketId) {
        var divNode,
            inputChoiceNode,
            kernelId,
            treeId;

        treeId = 'compare-tree' + idx;
        kernelId = 'compare-kernel' + idx;

        divNode = document.createElement('div');
        divNode.className = 'choice-group';

        // The tree choice.
        inputChoiceNode = createTreeChoice(treeId, kernelId, required);
        divNode.appendChild(inputChoiceNode);

        // The kernel choice.
        inputChoiceNode = createKernelChoice(
            kernelId, treeId, required, bucketId);
        divNode.appendChild(inputChoiceNode);

        return divNode;
    }

    function createJobChoice(bucketId) {
        var divNode;

        divNode = document.createElement('div');
        divNode.className = 'choice-group';

        // The tree choice.
        divNode.appendChild(
            createTreeChoice('baseline-tree', 'baseline-kernel', true));

        // The kernel choice.
        divNode.appendChild(createKernelChoice(
            'baseline-kernel', 'baseline-tree', true, bucketId));

        return divNode;
    }

    function createMultiChoice(type, idx, required, bucketId) {
        var choiceNode,
            divNode,
            numberDivNode,
            tooltipNode;

        divNode = document.createElement('div');
        divNode.id = 'compare-choice' + idx;

        if (required === undefined || required === null) {
            required = false;
        } else {
            required = Boolean(required);
        }

        numberDivNode = document.createElement('div');
        numberDivNode.className = 'choice-group-number';

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'Compare target ' + idx);
        tooltipNode.appendChild(document.createTextNode(idx));

        numberDivNode.appendChild(tooltipNode);
        divNode.appendChild(numberDivNode);

        switch (type) {
            case 'job':
                choiceNode = createJobMultiChoice(idx, required, bucketId);
                break;
            default:
                choiceNode = document.createElement('div');
                break;
        }

        divNode.appendChild(choiceNode);

        return divNode;
    }

    /**
     * Create the multiple comparison targets choice.
     *
     * @param {string} type: The type of the target choice.
     * @param {number} idx: The number of the choice.
     * @param {boolean} required: If the input fields are required.
     * @param {string} bucketId: The ID of the datalist container bucket.
    **/
    commonCompare.multiChoice = function(type, idx, required, bucketId) {
        return createMultiChoice(type, idx, required, bucketId);
    };

    /**
     * Create an HTML form element.
    **/
    commonCompare.form = function() {
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
     * @param {string} bucketId: The id the new element should have. If not
     * specified it will default to 'data-bucket'.
    **/
    commonCompare.dataBucket = function(bucketId) {
        var divNode;

        divNode = document.createElement('div');

        if (bucketId === undefined || bucketId === null) {
            divNode.id = constants.DATA_BUCKET_ID;
        } else {
            divNode.id = bucketId;
        }

        return divNode;
    };

    /**
     * Create the tree input selection.
     * The returned HTML structure is an HTML div node that wraps the tree
     * input selection:
     *
     * <div>
     *   <div>
     *     <label for="treeId" id="treeId-label">Tree</label>
     *     <input id="treeId">
     *   </div>
     *   <div id="treeId-notify"></div>
     * </div>
     *
     * @param {string} treeId: The ID the input element should have.
     * @param {string} kernelId: The ID the kernel element bound to this.
     * @param {boolean} required: If the input is required for validation.
     * Default to false.
    **/
    commonCompare.treeChoice = function(treeId, kernelId, required) {
        return createTreeChoice(treeId, kernelId, required);
    };

    /**
     * Create the kernel input selection.
     * The returned HTML structure is an HTML div node that wraps the kernel
     * input selection:
     *
     * <div>
     *   <div>
     *     <label for="kernelId" id="kernelId-label">Kernel</label>
     *     <input id="kernelId">
     *   </div>
     *   <div id="kernelId-notify"></div>
     * </div>
     *
     * @param {string} kernelId: The ID the input element should have.
     * @param {string} treeId: The ID of the tree element bound to this.
     * @param {boolean} required: If the input is required for validation.
     * @param {string} bucketId: The ID of the data bucket element where to add
     * data-list elements.
     * Default to false.
    **/
    commonCompare.kernelChoice = function(
            kernelId, treeId, required, bucketId) {
        return createKernelChoice(kernelId, treeId, required, bucketId);
    };

    /**
     * Create the basic job choice target.
     *
     * @param {string} bucketId: The ID of the datalist bucket element.
    **/
    commonCompare.jobChoice = function(bucketId) {
        return createJobChoice(bucketId);
    };

    /**
     * Create a div element with +/- buttons to add/remove compare targets.
     *
     * @param {string} containerId: The ID of the container element that will
     * hold new compare target selections.
     * @param {string} type: The type of the compare choice.
    **/
    commonCompare.addRemoveButtons = function(containerId, type, bucketId) {
        var buttonGroupNode,
            buttonNode,
            container,
            divNode;

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
    commonCompare.baseline = function() {
        var divNode,
            numberDivNode;

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
     * @param {string} type: The type of comparison to submit.
    **/
    commonCompare.submitButton = function(type) {
        var buttonDivNode,
            buttonNode,
            divNode;

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

    return commonCompare;
});
