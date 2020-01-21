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
    'compare/job',
    'compare/build',
    'compare/boot',
    'compare/common',
    'compare/const'
], function(job, build, boot, common, constants) {
    'use strict';
    var chooseCompare;
    var compareContainer;
    var compareTypeContainer;
    var dataBucket;

    /**
     * Launch the function to setup the correct comparison type.
     *
     * @param {Element} element: The element triggering the action.
    **/
    function compareTypeChoose(element) {
        // Force the radio button to be checked.
        element.querySelector('input').checked = true;

        switch (element.getAttribute('data-type')) {
            case 'job':
                job(compareTypeContainer, dataBucket).create();
                break;
            case 'build':
                build(compareTypeContainer, dataBucket).create();
                break;
            default:
                boot(compareTypeContainer, dataBucket).create();
                break;
        }
    }

    function createListNode() {
        var liNode;

        liNode = document.createElement('li');

        liNode.setAttribute('data-toggle', 'popover');
        liNode.setAttribute('data-trigger', 'hover');
        liNode.setAttribute('data-container', '#comparison-type');

        liNode.addEventListener('click', function() {
            compareTypeChoose(this);
        });

        return liNode;
    }

    function createRadioLabel(forElementId) {
        var labelNode;

        labelNode = document.createElement('label');
        labelNode.className = 'radio-description';
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
        var compareDivNode;
        var contentNode;
        var divNode;
        var headingNode;
        var inputNode;
        var labelNode;
        var liNode;
        var ulNode;

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

        liNode = createListNode();
        liNode.setAttribute('data-type', 'job');
        liNode.setAttribute(
            'data-content', 'Compare on a job basis choosing tree and kernel');

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-tree-input';
        inputNode.value = 'job';

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-tree-input');
        labelNode.appendChild(document.createTextNode('job'));

        liNode.appendChild(labelNode);
        ulNode.appendChild(liNode);

        liNode = createListNode();
        liNode.setAttribute('data-type', 'build');
        liNode.setAttribute(
            'data-content',
            'Compare on a build basis choosing tree, kernel, defconfig ' +
            'and architecture'
        );

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-build-input';
        inputNode.value = 'build';

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-build-input');
        labelNode.appendChild(document.createTextNode('build'));

        liNode.appendChild(labelNode);
        ulNode.appendChild(liNode);

        // Boot comparison still disabled.
        liNode = createListNode();
        liNode.setAttribute('data-type', 'boot');
        liNode.setAttribute(
            'data-content',
            'Compare on a boot basis choosing tree, kernel, defconfig, ' +
            'architecture, board and lab'
        );

        inputNode = createRadioElement(formId);
        inputNode.id = 'radio-boot-input';
        inputNode.value = 'boot';

        liNode.appendChild(inputNode);

        labelNode = createRadioLabel('radio-boot-input');
        labelNode.appendChild(document.createTextNode('boot'));

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
        var formNode;
        var typeNode;

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
