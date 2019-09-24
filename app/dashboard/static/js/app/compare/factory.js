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
    'compare/common',
    'compare/const'
], function(common, constants) {
    'use strict';
    var compareFactory;

    compareFactory = {};

    /**
     * Factory function to create multiple compare targets choice.
     *
     * @param {string} type: The type of the compare choice to create. Can be:
     * job, build, boot.
     * @param {boolean} required: If the choice should be required or not.
    **/
    compareFactory.multiCompare = function(type, required, bucketId) {
        var choiceContainer;
        var compareNode;
        var compareToContainer;
        var groupNode;
        var headingNode;
        var labelNode;

        compareToContainer = document.createElement('div');
        compareToContainer.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';
        compareToContainer.id = constants.COMPARE_TO_CONTAINER_ID;

        headingNode = document.createElement('h5');
        headingNode.appendChild(
            document.createTextNode('Which targets should be compared?'));

        compareToContainer.appendChild(headingNode);

        groupNode = document.createElement('div');
        groupNode.id = 'compare-group';
        groupNode.className = 'comparison-group';

        labelNode = document.createElement('label');
        labelNode.setAttribute('for', 'compare-choice-container');
        labelNode.appendChild(
            document.createTextNode(
                'Select the targets to comapre against (max. 20):')
        );

        groupNode.appendChild(labelNode);

        compareNode = document.createElement('div');
        compareNode.id = 'compare-choice-container';

        choiceContainer = document.createElement('div');
        choiceContainer.id = 'choice-container';
        choiceContainer.className = 'comparison-choice-container';

        // Create the starting choice group.
        choiceContainer.appendChild(
            common.multiChoice({
                idx: 1,
                type: type,
                required: required,
                bucketId: bucketId
            })
        );

        compareNode.appendChild(choiceContainer);

        // Create the remove/add button.
        compareNode.appendChild(
            common.addRemoveButtons('choice-container', type, bucketId));

        groupNode.appendChild(compareNode);
        compareToContainer.appendChild(groupNode);

        return compareToContainer;
    };

    /**
     * Factory function to create the baseline selection.
     *
     * @param {string} type: The type of the compare choice to create. Can be:
     * job, build, boot.
    **/
    compareFactory.baseline = function(type, bucketId) {
        var baselineContainer;
        var baselineGroupNode;
        var choiceNode;
        var divNode;
        var headingNode;
        var labelNode;
        var options;

        baselineContainer = document.createElement('div');
        baselineContainer.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

        headingNode = document.createElement('h5');
        headingNode.appendChild(
            document.createTextNode(
                'Which is the starting point of the comparison?')
        );

        baselineContainer.appendChild(headingNode);

        baselineGroupNode = document.createElement('div');
        baselineGroupNode.className = 'comparison-group';

        labelNode = document.createElement('label');
        labelNode.setAttribute('for', 'baseline-choice');
        labelNode.appendChild(
            document.createTextNode(
                'Select the baseline for the comparison:')
        );

        baselineGroupNode.appendChild(labelNode);

        divNode = common.baseline();

        options = {
            bucketId: bucketId,
            data: {},
            required: true,
            type: type
        };

        switch (type) {
            case 'job':
                choiceNode = common.jobChoice(options);
                break;
            case 'build':
                choiceNode = common.buildChoice(options);
                break;
            default:
                choiceNode = common.bootChoice(options);
                break;
        }

        divNode.appendChild(choiceNode);

        baselineGroupNode.appendChild(divNode);
        baselineContainer.appendChild(baselineGroupNode);

        return baselineContainer;
    };

    /**
     * Create a div element that should contain datalist data.
     *
     * @param {string} bucketId: The id the new element should have. If not
     * specified it will default to 'data-bucket'.
    **/
    compareFactory.dataBucket = function(bucketId) {
        return common.dataBucket(bucketId);
    };

    /**
     * Create the compare button for the submit action.
     *
     * @param {string} type: The type of comparison to submit.
    **/
    compareFactory.submitButton = function(type) {
        return common.submitButton(type);
    };

    return compareFactory;
});
