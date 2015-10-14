/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'compare/job',
    'compare/common',
    'compare/const'
], function(job, common, constants) {
    'use strict';
    var chooseCompare,
        compareContainer,
        compareTypeContainer,
        dataBucket;

    /**
     * Launch the function to setup the correct comparison type.
     *
     * @param {Element} element: The element triggering the action.
    **/
    function compareTypeChoose(element) {
        var type;

        type = element.getAttribute('data-type');
        switch (type) {
            case 'job':
                job(compareTypeContainer, dataBucket).create();
                break;
            case 'build':
                throw 'Not implemented yet';
            case 'boot':
                throw 'Not implemented yet';
            default:
                throw 'Wrong comparison type';
        }
    }

    function createRadioLabel(forElementId, dataContainer) {
        var labelNode;

        labelNode = document.createElement('label');
        labelNode.className = 'radio-description';
        labelNode.setAttribute('data-toggle', 'popover');
        labelNode.setAttribute('data-trigger', 'hover');
        labelNode.setAttribute('data-container', dataContainer);
        labelNode.for = forElementId;

        return labelNode;
    }

    function createRadioElement() {
        var inputNode;

        inputNode = document.createElement('input');
        inputNode.name = 'comp-radio-type';
        inputNode.className = 'compare-type';
        inputNode.type = 'radio';
        inputNode.required = true;

        return inputNode;
    }

    /**
     * Create the comparison type chooser.
     *
     * @param {string} formId: The ID of the form.
    **/
    function createTypeWidget(formId) {
        var compareDivNode,
            contentNode,
            divNode,
            headingNode,
            inputNode,
            labelNode,
            liNode,
            ulNode;

        divNode = document.createElement('div');
        divNode.id = 'compare-type-choose';

        headingNode = document.createElement('h5');
        headingNode.appendChild(
            document.createTextNode('Which type of comparison to perform?'));

        divNode.appendChild(headingNode);

        contentNode = document.createElement('div');
        contentNode.className = 'comparison-group';

        labelNode = document.createElement('label');
        labelNode.setAttribute('for', 'comparison-type');
        labelNode.appendChild(
            document.createTextNode('Select the comparison type:'));

        contentNode.appendChild(labelNode);

        compareDivNode = document.createElement('div');
        compareDivNode.id = 'comparison-type';
        compareDivNode.className = 'comparison-choice';

        ulNode = document.createElement('ul');
        ulNode.className = 'list-unstyled';

        liNode = document.createElement('li');

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-tree-input';
        inputNode.value = 'job';
        inputNode.setAttribute('data-type', 'job');

        inputNode.addEventListener('click', function() {
            compareTypeChoose(this);
        });

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-tree-input', '#comparison-type');
        labelNode.appendChild(document.createTextNode('job'));
        labelNode.setAttribute(
            'data-content',
            'Compare on a job basis choosing tree, kernel and ' +
            'branch'
        );

        liNode.appendChild(labelNode);
        ulNode.appendChild(liNode);

        liNode = document.createElement('li');

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-build-input';
        inputNode.value = 'build';
        inputNode.disabled = true;
        inputNode.setAttribute('data-type', 'build');

        inputNode.addEventListener('click', function() {
            compareTypeChoose(this);
        });

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-build-input', '#comparison-type');
        labelNode.appendChild(document.createTextNode('build'));
        labelNode.setAttribute(
            'data-content',
            'Compare on a build basis choosing tree, kernel and ' +
            'branch, and defconfig'
        );

        liNode.appendChild(labelNode);
        ulNode.appendChild(liNode);

        liNode = document.createElement('li');

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-boot-input';
        inputNode.value = 'boot';
        inputNode.disabled = true;
        inputNode.setAttribute('data-type', 'boot');

        inputNode.addEventListener('click', function() {
            compareTypeChoose(this);
        });

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-boot-input', '#comparison-type');
        labelNode.appendChild(document.createTextNode('boot'));
        labelNode.setAttribute(
            'data-content',
            'Compare on a boot basis choosing tree, kernel and ' +
            'branch, defconfig and board'
        );

        liNode.appendChild(labelNode);
        ulNode.appendChild(liNode);

        compareDivNode.appendChild(ulNode);
        contentNode.appendChild(compareDivNode);
        divNode.appendChild(contentNode);

        compareTypeContainer = document.createElement('div');
        compareTypeContainer.id = 'compare-container';

        divNode.appendChild(compareTypeContainer);

        return divNode;
    }

    /**
     * Set up a new choose selection container to choose the comparison.
     * It will create also the default data bucket.
     *
     * @param {HTMLDivElement} container: The container element where the
     * comparison choice elements should be appended.
    **/
    chooseCompare = function(container) {
        compareContainer = container;
        dataBucket = common.dataBucket();
        return chooseCompare;
    };

    /**
     * Return the associated bucket element.
    **/
    chooseCompare.bucket = function() {
        return dataBucket;
    };

    /**
     * Create the compare form DOM structure.
    **/
    chooseCompare.create = function() {
        var formNode,
            typeNode;

        formNode = common.form();
        formNode.id = constants.FORM_ID;

        typeNode = createTypeWidget(constants.FORM_ID);
        typeNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
        formNode.appendChild(typeNode);

        formNode.appendChild(dataBucket);
        compareContainer.appendChild(formNode);
    };

    return chooseCompare;
});
