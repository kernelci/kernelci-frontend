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
    'jquery',
    'utils/error',
    'utils/request',
    'utils/html',
    'compare/const'
], function($, e, r, html, constants) {
    'use strict';
    var gArchitectureStatus;
    var gBoardStatus;
    var gCompareEvents;
    var gDataCache;
    var gDefconfigStatus;
    var gKernelStatus;
    var gNonValidStrings;
    var gNonValidValue;
    var gSupportDataList;

    gCompareEvents = {};

    // Hack to check if the browser supports the datalist element, otherwise
    // we don't even hit the server with requests to create the drop-down
    // selection list.
    gSupportDataList = (
        Boolean(window.HTMLDataListElement) &&
        'list' in document.createElement('input')
    );

    // TODO: convert to localStorage API.
    // Local cache to hold retrieved values from the backend.
    gDataCache = {};
    gDataCache.trees = [];

    gNonValidStrings = {
        arch: 'Specified architecture value is not valid or empty',
        board: 'Specified board value is not valid or empty',
        defconfig: 'Specified defconfig value is not valid or empty',
        kernel: 'Specified kernel value is not valid or empty',
        lab: 'Specified lab value is not valid or empty',
        tree: 'Specified tree value is not valid or empty'
    };

    gNonValidValue = 'Invalid value';

    // Data structures to hold messages based on backend status code.
    gKernelStatus = {
        '400': {
            content: 'Wrong data provided looking for kernel values'
        },
        '404': {
            content: 'No kernel values found for chosen tree'
        }
    };

    gDefconfigStatus = {
        '400': {
            content: 'Wrong data provided looking for defconfig values'
        },
        '404': {
            content: 'No defconfig values found'
        }
    };

    gArchitectureStatus = {
        '400': {
            content: 'Wrong data provided looking for architecture values'
        },
        '404': {
            content: 'No architecture values found'
        }
    };

    gBoardStatus = {
        '400': {
            content: 'Wrong data provided looking for board values'
        },
        '404': {
            content: 'No board values found'
        }
    };

    /**
     * Check if the tree input value is valid.
     * If we cannot check against the backend if the tree name exists, it will
     * be considered not valid.
     *
     * @return {Boolean} If the tree value is valid or not.
    **/
    function isValidTree(element) {
        var isValid;
        var treeName;

        isValid = element.checkValidity();

        if (isValid) {
            treeName = html.escape(element.value);

            isValid = isValid && (treeName === element.value);
            if (gSupportDataList) {
                isValid = isValid &&
                    (gDataCache.trees.indexOf(treeName) !== -1);
            }
        }

        return isValid;
    }

    /**
     * Check if a kernel input value is valid.
     * To be valid, the tree input value and the kernel one must be all valid.
     *
     * If we cannot check against the backend data, the kernel value will be
     * considered invalid.
     *
     * @param {Object} elements: An object containing the tree and kernel input
     * elements:
     * {
     *   tree: treeInputElement,
     *   kernel: kernelInputElement
     * }
     *
     * @return {Array} A 2-boolean elements array with the tree and kernel
     * fields validity, in that order.
    **/
    function isValidKernel(elements) {
        var isValid;
        var kernelTxt;
        var treeTxt;
        var validTree;

        validTree = isValidTree(elements.tree);
        isValid = elements.kernel.checkValidity();

        if (isValid) {
            treeTxt = html.escape(elements.tree.value);
            kernelTxt = html.escape(elements.kernel.value);

            isValid = isValid && (kernelTxt === elements.kernel.value);

            if (gSupportDataList) {
                if (gDataCache.hasOwnProperty(treeTxt)) {
                    isValid = isValid &&
                        (gDataCache[treeTxt].indexOf(kernelTxt) !== -1);
                } else {
                    isValid = false;
                }
            }
        }

        return [validTree, isValid];
    }

    // function isValidDefconfig(treeElement, kernelElement, defconfigElement) {
    /**
     * Check if a defconfig input value is valid.
     * To be valid, the tree input value and the kernel one must also be valid.
     *
     * If we cannot check against the backend data, the defconfig value will be
     * considered invalid.
     *
     * @param {Object} elements: An object containing the tree, kernel and
     * defconfig input elements:
     * {
     *   tree: treeInputElement,
     *   kernel: kernelInputElement,
     *   defconfig: defconfigInputElement
     * }
     *
     * @return {Array} A 3-boolean elements array with the tree, kernel and
     * defconfig fields validity, in that order.
    **/
    function isValidDefconfig(elements) {
        var cacheKey;
        var defconfigTxt;
        var isValid;
        var kernelTxt;
        var treeTxt;
        var validKernel;

        validKernel = isValidKernel(elements);

        isValid = elements.defconfig.checkValidity();
        if (isValid) {
            treeTxt = html.escape(elements.tree.value);
            kernelTxt = html.escape(elements.kernel.value);
            defconfigTxt = html.escape(elements.defconfig.value);

            isValid = isValid && (defconfigTxt === elements.defconfig.value);

            if (gSupportDataList) {
                cacheKey = treeTxt + kernelTxt;
                if (elements.hasOwnProperty('cachePrefix') &&
                        elements.cachePrefix) {
                    cacheKey = elements.cachePrefix + cacheKey;
                }

                if (gDataCache.hasOwnProperty(cacheKey)) {
                    isValid = isValid &&
                        (gDataCache[cacheKey].indexOf(defconfigTxt) !== -1);
                } else {
                    isValid = false;
                }
            }
        }

        return [validKernel[0], validKernel[1], isValid];
    }

    function isValidArch(elements) {
        var archTxt;
        var cacheKey;
        var defconfigTxt;
        var isValid;
        var kernelTxt;
        var treeTxt;
        var validDefconfig;

        validDefconfig = isValidDefconfig(elements);

        isValid = elements.arch.checkValidity();
        if (isValid) {
            treeTxt = html.escape(elements.tree.value);
            kernelTxt = html.escape(elements.kernel.value);
            defconfigTxt = html.escape(elements.defconfig.value);
            archTxt = html.escape(elements.arch.value);

            isValid = isValid && (archTxt === elements.arch.value);

            if (gSupportDataList) {
                cacheKey = treeTxt + kernelTxt + defconfigTxt;
                if (elements.hasOwnProperty('cachePrefix') &&
                        elements.cachePrefix) {
                    cacheKey = elements.cachePrefix + cacheKey;
                }

                if (gDataCache.hasOwnProperty(cacheKey)) {
                    isValid = isValid &&
                        (gDataCache[cacheKey].indexOf(archTxt) !== -1);
                } else {
                    isValid = false;
                }
            }
        }

        return [
            validDefconfig[0], validDefconfig[1], validDefconfig[2], isValid
        ];
    }

    function isValidBoard(elements) {
        var archTxt;
        var boardTxt;
        var cacheKey;
        var defconfigTxt;
        var isValid;
        var kernelTxt;
        var treeTxt;
        var validArch;

        validArch = isValidArch(elements);

        isValid = elements.board.checkValidity();
        if (isValid) {
            treeTxt = html.escape(elements.tree.value);
            kernelTxt = html.escape(elements.kernel.value);
            defconfigTxt = html.escape(elements.defconfig.value);
            archTxt = html.escape(elements.arch.value);
            boardTxt = html.escape(elements.board.value);

            isValid = isValid && (boardTxt === elements.board.value);

            if (gSupportDataList) {
                cacheKey = treeTxt + kernelTxt + defconfigTxt + archTxt;
                if (elements.hasOwnProperty('cachePrefix') &&
                        elements.cachePrefix) {
                    cacheKey = elements.cachePrefix + cacheKey;
                }

                if (gDataCache.hasOwnProperty(cacheKey)) {
                    isValid = isValid &&
                        (gDataCache[cacheKey].indexOf(boardTxt) !== -1);
                } else {
                    isValid = false;
                }
            }
        }

        return [
            validArch[0], validArch[1], validArch[2], validArch[3], isValid
        ];
    }

    function isValidLab(elements) {
        var archTxt;
        var boardTxt;
        var cacheKey;
        var defconfigTxt;
        var isValid;
        var kernelTxt;
        var treeTxt;
        var validBoard;
        var labTxt;

        validBoard = isValidBoard(elements);

        isValid = elements.lab.checkValidity();
        if (isValid) {
            treeTxt = html.escape(elements.tree.value);
            kernelTxt = html.escape(elements.kernel.value);
            defconfigTxt = html.escape(elements.defconfig.value);
            archTxt = html.escape(elements.arch.value);
            boardTxt = html.escape(elements.board.value);
            labTxt = html.escape(elements.lab.value);

            isValid = isValid && (labTxt === elements.lab.value);

            if (gSupportDataList) {
                cacheKey = treeTxt +
                    kernelTxt + defconfigTxt + archTxt + boardTxt;
                if (elements.hasOwnProperty('cachePrefix') &&
                        elements.cachePrefix) {
                    cacheKey = elements.cachePrefix + cacheKey;
                }

                if (gDataCache.hasOwnProperty(cacheKey)) {
                    isValid = isValid &&
                        (gDataCache[cacheKey].indexOf(labTxt) !== -1);
                } else {
                    isValid = false;
                }
            }
        }

        return [
            validBoard[0],
            validBoard[1], validBoard[2], validBoard[3], validBoard[4], isValid
        ];
    }

    /**
     * Handle the response from the API.
     *
     * @param {Object} response: The response object from the API.
     * @param {Object} options: The object containing the necessary parameters.
    **/
    function getValuesDone(response, options) {
        var bucketContainer;
        var dataBucket;
        var dataCache;
        var node;
        var notifyNode;
        var option;
        var results;
        var warningNode;

        /**
         * Create the option element for the datalist and append it.
         *
         * @param {string} value: The option value.
        **/
        function _createAndAddOption(value) {
            option = document.createElement('option');
            option.value = value;
            dataCache.push(value);
            dataBucket.appendChild(option);
        }

        results = response.result;
        if (results.length > 0) {
            bucketContainer = document.getElementById(
                options.element.getAttribute('data-bucket'));

            dataBucket = document.createElement('datalist');
            dataBucket.id = options.bucketId;

            dataCache = gDataCache[options.cacheKey];
            results = results.sort();
            results.forEach(_createAndAddOption);

            bucketContainer.appendChild(dataBucket);
            options.element.setAttribute('list', options.bucketId);

            if (results.length === 1) {
                options.element.value = results[0];
            }
        } else {
            notifyNode = document.getElementById(
                options.element.id + '-notify');
            html.removeChildren(notifyNode);

            warningNode = html.unknown();
            node = warningNode.firstElementChild;
            node.setAttribute('data-toggle', 'popover');
            node.setAttribute('data-container', 'body');
            node.setAttribute('data-title', options.dataTitle);
            node.setAttribute('data-content', options.dataContent);

            notifyNode.appendChild(warningNode);

            $(notifyNode).popover({
                selector: '[data-toggle="popover"]',
                trigger: 'hover',
                html: false
            });
        }
    }

    /**
     * Handle the failed response from the API.
     *
     * @param {Number} status: The HTTP status code.
     * @param {Object} options: The object containing the necessary parameters.
    **/
    function getValuesFail(status, options) {
        var failNode;
        var notifyNode;
        var node;

        notifyNode = document.getElementById(options.element.id + '-notify');
        html.removeChildren(notifyNode);

        failNode = html.fail();
        node = failNode.firstElementChild;
        node.setAttribute('data-toggle', 'popover');
        node.setAttribute('data-container', 'body');

        switch (status) {
            case 400:
                node.setAttribute('data-title', 'Wrong data');
                node.setAttribute(
                    'data-content', options.status['400'].content);
                break;
            case 404:
                node.setAttribute('data-title', 'Value not found');
                node.setAttribute(
                    'data-content', options.status['404'].content);
                break;
            default:
                node.setAttribute(
                    'data-content', 'Error retrieving values');
                break;
        }

        notifyNode.appendChild(failNode);

        $(notifyNode).popover({
            selector: '[data-toggle="popover"]',
            trigger: 'hover',
            html: false
        });
    }

    /**
     * Get the values from the backend, or use the one from the cache.
     *
     * Needed parameters are:
     * {
     *   bucketId,
     *   element,
     *   cacheKey,
     *   url,
     *   query,
     *   dataTitle,
     *   dataContent,
     *   status
     * }
     *
     * @param {Object} options: The object containing the necessary parameters.
    **/
    function getValues(options) {
        var deferred;

        if (document.getElementById(options.bucketId)) {
            options.element.setAttribute('list', options.bucketId);

            if (gDataCache.hasOwnProperty(options.cacheKey)) {
                if (gDataCache[options.cacheKey].length === 1) {
                    options.element.value = gDataCache[options.cacheKey][0];
                }
            }
        } else {
            if (!gDataCache.hasOwnProperty(options.cacheKey)) {
                gDataCache[options.cacheKey] = [];
            }

            deferred = r.get(options.url + options.query);

            $.when(deferred)
                .fail(function(jqXHR) {
                    getValuesFail(jqXHR.status, options);
                })
                .done(function(response) {
                    getValuesDone(response, options);
                });
        }
    }

    /**
     * Handle backend data for the trees.
     *
     * @param {Object} response: The response object from the backend.
     * @param {Element} bucket: The data-list bucket element to add the values.
    **/
    function getTreesDone(response, bucket) {
        var dataBucket;
        var option;
        var results;

        results = response.result;
        if (results.length > 0) {
            dataBucket = document.createElement('datalist');
            dataBucket.id = constants.TREES_DATA_LIST;

            results.forEach(function(value) {
                option = document.createElement('option');
                option.value = value;
                gDataCache.trees.push(value);
                dataBucket.appendChild(option);
            });

            bucket.appendChild(dataBucket);
        }
    }

    /**
     * Handle "notifications" for a node.
     *
     * @param {Element} element: The node that will hold the notification.
     * @param {String} title: The title of the notification.
     * @param {String} content: The content of the notification.
    **/
    function wrongValue(element, title, content) {
        var failNode;
        var node;

        html.removeChildren(element);

        failNode = html.fail();
        node = failNode.firstElementChild;
        node.setAttribute('data-toggle', 'popover');
        node.setAttribute('data-container', 'body');
        node.setAttribute('data-title', title);
        node.setAttribute('data-content', content);

        element.appendChild(failNode);

        $(element).popover({
            selector: '[data-toggle="popover"]',
            trigger: 'hover',
            html: false
        });
    }

    /**
     * Extract from the form, all the comparison targers.
     *
     * @param {HTMLForm} form: The form.
     * @param {Array} attributes: The name of the data attributes to extract
     * the values of. This is a list of the key names that will be appended to
     * 'data-' to look for the values. The same keys will be used to create the
     * data structure for the POST request.
    **/
    function getCompareTargets(form, attributes) {
        var compareTo;
        var data;
        var elementId;
        var value;

        compareTo = [];

        function _getValues(element) {
            data = {};

            attributes.forEach(function(attribute) {
                elementId = element.getAttribute('data-' + attribute);
                value = form.querySelector('#' + elementId).value;

                // Map the defconfig key to defconfig_full, since that is what
                // we actually need to look in the backend. Also map tree to
                // the job key, and lab to lab_name.
                if (attribute === 'defconfig') {
                    data.defconfig_full = value;
                } else if (attribute === 'tree') {
                    data.job = value;
                } else if (attribute === 'lab') {
                    data.lab_name = value;
                } else {
                    data[attribute] = value;
                }
            });

            compareTo.push(data);
        }

        Array.prototype.forEach.call(
            form.querySelectorAll('input.tree'), _getValues
        );

        return compareTo;
    }

    /**
     * POST the data to perform the comparison.
     *
     * @param {String} url: The URL where to POST the data.
     * @param {String} location: The location to redirect to when the response
     * arrives.
     * @param {Object} data: The JSON data object to send.
    **/
    function postComparison(url, location, data) {
        var deferred;

        deferred = r.post(url, JSON.stringify(data));

        if (location[location.length - 1] !== '/') {
            location = location + '/';
        }

        // TODO: handle errors.
        $.when(deferred)
            .fail(e.error)
            .done(function(response, ignore, jqXHR) {
                // TODO: use local storage to store the response.
                var compId = jqXHR
                    .getResponseHeader(constants.KERNEL_CI_COMPARE_ID_HEADER);
                window.location = location + compId + '/';
            });
    }

    /**
     * Parse the compare form, create the data structure and send the request.
     *
     * @param {HTMLFormElement} form: The form element.
    **/
    function submitBuildCompare(form) {
        var container;
        var data;

        container = form
            .querySelector('#' + constants.COMPARE_TO_CONTAINER_ID);

        // Get the baseline data.
        data = {
            job: form.querySelector('#baseline-tree').value,
            kernel: form.querySelector('#baseline-kernel').value,
            defconfig_full: form.querySelector('#baseline-defconfig').value,
            arch: form.querySelector('#baseline-arch').value
        };
        // Get the comparison data.
        data.compare_to = getCompareTargets(
            container, ['tree', 'kernel', 'defconfig', 'arch']
        );

        postComparison('/_ajax/build/compare', '/compare/build/', data);
    }

    /**
     * Parse the compare form, create the data structure and send the request.
     *
     * @param {HTMLFormElement} form: The form element.
    **/
    function submitBootCompare(form) {
        var container;
        var data;

        container = form
            .querySelector('#' + constants.COMPARE_TO_CONTAINER_ID);

        data = {
            job: form.querySelector('#baseline-tree').value,
            kernel: form.querySelector('#baseline-kernel').value,
            defconfig_full: form.querySelector('#baseline-defconfig').value,
            arch: form.querySelector('#baseline-arch').value,
            board: form.querySelector('#baseline-board').value,
            lab_name: form.querySelector('#baseline-lab').value
        };

        data.compare_to = getCompareTargets(
            container,
            ['tree', 'kernel', 'defconfig', 'arch', 'board', 'lab']
        );

        postComparison('/_ajax/boot/compare', '/compare/boot/', data);
    }

    /**
     * Parse the compare form, create the data structure and send the request.
     *
     * @param {HTMLFormElement} form: The form element.
    **/
    function submitJobCompare(form) {
        var container;
        var data;

        container = form
            .querySelector('#' + constants.COMPARE_TO_CONTAINER_ID);

        // Get the baseline data.
        data = {
            job: form.querySelector('#baseline-tree').value,
            kernel: form.querySelector('#baseline-kernel').value
        };
        // Get the comparison data.
        data.compare_to = getCompareTargets(container, ['tree', 'kernel']);

        postComparison('/_ajax/job/compare', '/compare/job/', data);
    }

    /**
     * Perform custom validation checkes on the form elements.
     *
     * @param {Element} element: The element on which to perfrom the
     * validity checks.
    **/
    function customValidity(element) {
        var failNode;
        var isValid;
        var node;
        var notifyNode;

        isValid = true;
        if (element.required && !element.validity.valid) {
            html.addClass(element, 'invalid');
            notifyNode = document.getElementById(element.id + '-notify');
            html.removeChildren(notifyNode);

            failNode = html.fail();
            node = failNode.firstElementChild;
            node.setAttribute('data-toggle', 'popover');
            node.setAttribute('data-container', 'body');

            if (element.validity.valueMissing) {
                node.setAttribute('data-title', 'Required field');
                node.setAttribute(
                    'data-content', 'Please fill out this field');
            } else if (element.validity.patternMismatch) {
                node.setAttribute('data-title', gNonValidValue);
                node.setAttribute(
                    'data-content', 'Please provide another value');
            } else {
                node.setAttribute('data-content', 'Wrong value');
            }

            notifyNode.appendChild(failNode);

            $(notifyNode).popover({
                selector: '[data-toggle="popover"]',
                trigger: 'hover',
                html: false
            });

            isValid = false;
        }

        return isValid;
    }

    /**
     * Get the unique tree values from the backend.
     *
     * @param {HTMLElement} bucket: The element where the retrieved data will
     * be appended as a datalist structure.
    **/
    gCompareEvents.getTrees = function(bucket) {
        var deferred;

        if (gSupportDataList && gDataCache.trees.length === 0) {
            deferred = r.get('/_ajax/job/distinct/job/');
            $.when(deferred)
                .fail(function(jqXHR) {
                    e.customError(
                        jqXHR.status,
                        'Error retrieving tree values from server.');
                })
                .done(function(response) {
                    getTreesDone(response, bucket);
                });
        }
    };

    /**
     * When the kernel field gets the focus, trigger a search for the valid
     * values based on the tree input.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.kernelInputFocus = function(event) {
        var options;
        var target;
        var treeId;
        var treeInput;
        var treeName;

        target = event.target || event.srcElement;
        treeId = target.getAttribute('data-tree');
        treeInput = document.getElementById(treeId);

        if (isValidTree(treeInput)) {
            if (gSupportDataList) {
                treeName = treeInput.value;
                options = {
                    element: target,
                    cacheKey: treeName,
                    bucketId: 'datalist-' + treeName,
                    url: '/_ajax/job/distinct/kernel/',
                    query: '?job=' + encodeURIComponent(treeName),
                    dataTitle: 'No kernel values',
                    dataContent: 'No kernel values found',
                    status: gKernelStatus
                };

                getValues(options);
            }
        } else {
            target.removeAttribute('list');
            html.addClass(treeInput, 'invalid');
            wrongValue(
                document.getElementById(treeId + '-notify'),
                gNonValidValue, gNonValidStrings.tree
            );
        }
    };

    /**
     * When the defconfig field gets the focus, trigger a search for the valid
     * values based on the tree and kernel inputs.
     *
     * @param {Event} event: The triggering event.
     * @param {String} qURL: The URL to use for the query.
     * @param {String} cachePrefix: The prefix for the cache key.
    **/
    function defconfigFocus(event, qURL, cachePrefix) {
        var isValid;
        var kernelId;
        var kernelInput;
        var kernelName;
        var options;
        var target;
        var treeId;
        var treeInput;
        var treeName;

        target = event.target || event.srcElement;

        treeId = target.getAttribute('data-tree');
        kernelId = target.getAttribute('data-kernel');
        treeInput = document.getElementById(treeId);
        kernelInput = document.getElementById(kernelId);

        isValid = isValidKernel({tree: treeInput, kernel: kernelInput});

        if (isValid[0] && isValid[1]) {
            if (gSupportDataList) {
                treeName = treeInput.value;
                kernelName = kernelInput.value;

                options = {
                    bucketId: 'datalist-' + treeName + kernelName,
                    cacheKey: treeName + kernelName,
                    url: '/_ajax/build/distinct/defconfig_full/',
                    element: target,
                    query: '?job=' + encodeURIComponent(treeName) +
                        '&kernel=' + encodeURIComponent(kernelName),
                    dataTitle: 'No defconfig values',
                    dataContent: 'No defconfig values found',
                    status: gDefconfigStatus
                };

                if (cachePrefix) {
                    options.cacheKey = cachePrefix + options.cacheKey;
                    options.bucketId = cachePrefix + options.bucketId;
                }

                if (qURL) {
                    options.url = qURL;
                }

                getValues(options);
            }
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    gNonValidValue, gNonValidStrings.tree
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    gNonValidValue, gNonValidStrings.kernel
                );
            }
        }
    }

    /**
     * When the defconfig field gets the focus, trigger a search for the valid
     * values based on the tree and kernel inputs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.defconfigInputFocus = function(event) {
        defconfigFocus(event);
    };

    /**
     * When the defconfig field gets the focus, trigger a search for the valid
     * values based on the tree and kernel inputs.
     *
     * This is a special case for the boot comparison type: we cannot search
     * defconfig field in the build collection, since we are not testing all
     * the defconfigs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.defconfigBootInputFocus = function(event) {
        defconfigFocus(
            event,
            '/_ajax/boot/distinct/defconfig_full/',
            constants.BOOT_CACHE_PREFIX
        );
    };

    /**
     * When the board field gets the focus, trigger a search for the valid
     * values based on the tree, kernel, defconfig and arch inputs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.boardInputFocus = function(event) {
        var isValid;
        var kernelId;
        var kernelInput;
        var kernelName;
        var options;
        var target;
        var treeId;
        var defconfigId;
        var treeInput;
        var treeName;
        var archId;
        var archInput;
        var defconfigInput;
        var defconfigName;
        var archName;
        var cachePrefix;
        var dataKey;

        cachePrefix = constants.BOOT_CACHE_PREFIX;
        target = event.target || event.srcElement;

        treeId = target.getAttribute('data-tree');
        kernelId = target.getAttribute('data-kernel');
        defconfigId = target.getAttribute('data-defconfig');
        archId = target.getAttribute('data-arch');
        treeInput = document.getElementById(treeId);
        kernelInput = document.getElementById(kernelId);
        defconfigInput = document.getElementById(defconfigId);
        archInput = document.getElementById(archId);

        isValid = isValidArch({
            tree: treeInput,
            kernel: kernelInput,
            defconfig: defconfigInput,
            arch: archInput,
            cachePrefix: cachePrefix
        });

        if (isValid[0] && isValid[1] && isValid[2] && isValid[3]) {
            if (gSupportDataList) {
                treeName = treeInput.value;
                kernelName = kernelInput.value;
                defconfigName = defconfigInput.value;
                archName = archInput.value;

                dataKey = treeName + kernelName + defconfigName + archName;

                options = {
                    bucketId: cachePrefix + 'datalist-' + dataKey,
                    cacheKey: cachePrefix + dataKey,
                    element: target,
                    url: '/_ajax/boot/distinct/board/',
                    query: '?job=' + encodeURIComponent(treeName) +
                        '&kernel=' + encodeURIComponent(kernelName) +
                        '&defconfig_full=' + encodeURIComponent(defconfigName) +
                        '&arch=' + encodeURIComponent(archName),
                    dataTitle: 'No board values',
                    dataContent: 'No board values found',
                    status: gBoardStatus
                };

                getValues(options);
            }
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    gNonValidValue, gNonValidStrings.tree
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    gNonValidValue, gNonValidStrings.kernel
                );
            }

            if (!isValid[2]) {
                html.addClass(defconfigInput, 'invalid');
                wrongValue(
                    document.getElementById(defconfigId + '-notify'),
                    gNonValidValue, gNonValidStrings.defconfig
                );
            }

            if (!isValid[3]) {
                html.addClass(archInput, 'invalid');
                wrongValue(
                    document.getElementById(archId + '-notify'),
                    gNonValidValue, gNonValidStrings.arch
                );
            }
        }
    };

    function archFocus(event, qURL, cachePrefix) {
        var defconfigId;
        var defconfigInput;
        var defconfigTxt;
        var isValid;
        var kernelId;
        var kernelInput;
        var kernelTxt;
        var options;
        var target;
        var treeId;
        var treeInput;
        var treeTxt;

        target = event.target || event.srcElement;

        treeId = target.getAttribute('data-tree');
        kernelId = target.getAttribute('data-kernel');
        defconfigId = target.getAttribute('data-defconfig');
        treeInput = document.getElementById(treeId);
        kernelInput = document.getElementById(kernelId);
        defconfigInput = document.getElementById(defconfigId);

        isValid = isValidDefconfig({
            tree: treeInput,
            kernel: kernelInput,
            defconfig: defconfigInput,
            cachePrefix: cachePrefix
        });

        if (isValid[0] && isValid[1] && isValid[2]) {
            if (gSupportDataList) {
                treeTxt = html.escape(treeInput.value);
                kernelTxt = html.escape(kernelInput.value);
                defconfigTxt = html.escape(defconfigInput.value);

                options = {
                    bucketId: 'datalist-' + treeTxt + kernelTxt + defconfigTxt,
                    cacheKey: treeTxt + kernelTxt + defconfigTxt,
                    element: target,
                    url: '/_ajax/build/distinct/arch/',
                    query: '?job=' + encodeURIComponent(treeTxt) +
                        '&kernel=' + encodeURIComponent(kernelTxt) +
                        '&defconfig_full=' + encodeURIComponent(defconfigTxt),
                    dataTitle: 'No architecture values',
                    dataContent: 'No architecture values found',
                    status: gArchitectureStatus
                };

                if (cachePrefix) {
                    options.cacheKey = cachePrefix + options.cacheKey;
                    options.bucketId = cachePrefix + options.bucketId;
                }

                if (qURL) {
                    options.url = qURL;
                }

                getValues(options);
            }
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    gNonValidValue, gNonValidStrings.tree
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    gNonValidValue, gNonValidStrings.kernel
                );
            }

            if (!isValid[2]) {
                html.addClass(defconfigInput, 'invalid');
                wrongValue(
                    document.getElementById(defconfigId + '-notify'),
                    gNonValidValue, gNonValidStrings.defconfig
                );
            }
        }
    }

    /**
     * When the arch field gets the focus, trigger a search for the valid
     * values based on the tree, kernel and defconfig inputs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.archInputFocus = function(event) {
        archFocus(event);
    };

    /**
     * When the arch field gets the focus, trigger a search for the valid
     * values based on the tree, kernel and defconfig inputs.
     *
     * This is a special case for the boot comparison type: we cannot search
     * arch field in the build collection, since we are not testing all
     * the defconfigs and might only have a subset of architectures.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.archBootInputFocus = function(event) {
        archFocus(
            event, '/_ajax/boot/distinct/arch/', constants.BOOT_CACHE_PREFIX);
    };

    /**
     *
    **/
    gCompareEvents.labInputFocus = function(event) {
        var archId;
        var archInput;
        var archName;
        var boardId;
        var boardInput;
        var boardName;
        var cachePrefix;
        var dataKey;
        var defconfigId;
        var defconfigInput;
        var defconfigName;
        var isValid;
        var kernelId;
        var kernelInput;
        var kernelName;
        var options;
        var target;
        var treeId;
        var treeInput;
        var treeName;

        cachePrefix = constants.BOOT_CACHE_PREFIX;
        target = event.target || event.srcElement;

        treeId = target.getAttribute('data-tree');
        kernelId = target.getAttribute('data-kernel');
        defconfigId = target.getAttribute('data-defconfig');
        archId = target.getAttribute('data-arch');
        boardId = target.getAttribute('data-board');
        treeInput = document.getElementById(treeId);
        kernelInput = document.getElementById(kernelId);
        defconfigInput = document.getElementById(defconfigId);
        archInput = document.getElementById(archId);
        boardInput = document.getElementById(boardId);

        isValid = isValidBoard({
            tree: treeInput,
            kernel: kernelInput,
            defconfig: defconfigInput,
            arch: archInput,
            board: boardInput,
            cachePrefix: cachePrefix
        });

        if (isValid[0] &&
                isValid[1] && isValid[2] && isValid[3] && isValid[4]) {
            if (gSupportDataList) {
                treeName = treeInput.value;
                kernelName = kernelInput.value;
                defconfigName = defconfigInput.value;
                archName = archInput.value;
                boardName = boardInput.value;

                dataKey = treeName +
                    kernelName + defconfigName + archName + boardName;

                options = {
                    bucketId: cachePrefix + 'datalist-' + dataKey,
                    cacheKey: cachePrefix + dataKey,
                    element: target,
                    url: '/_ajax/boot/distinct/lab_name/',
                    query: '?job=' + encodeURIComponent(treeName) +
                        '&kernel=' + encodeURIComponent(kernelName) +
                        '&defconfig_full=' + encodeURIComponent(defconfigName) +
                        '&arch=' + encodeURIComponent(archName) +
                        '&board=' + encodeURIComponent(boardName),
                    dataTitle: 'No lab values',
                    dataContent: 'No lab values found',
                    status: gBoardStatus
                };

                // TODO: need a placeholder for "all".
                getValues(options);
            }
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    gNonValidValue, gNonValidStrings.tree
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    gNonValidValue, gNonValidStrings.kernel
                );
            }

            if (!isValid[2]) {
                html.addClass(defconfigInput, 'invalid');
                wrongValue(
                    document.getElementById(defconfigId + '-notify'),
                    gNonValidValue, gNonValidStrings.defconfig
                );
            }

            if (!isValid[3]) {
                html.addClass(archInput, 'invalid');
                wrongValue(
                    document.getElementById(archId + '-notify'),
                    gNonValidValue, gNonValidStrings.arch
                );
            }

            if (!isValid[4]) {
                html.addClass(boardInput, 'invalid');
                wrongValue(
                    document.getElementById(boardId + '-notify'),
                    gNonValidValue, gNonValidStrings.board
                );
            }
        }
    };

    /**
     * Add a new compare target selection.
     *
     * @param {event} event: The event triggering the action.
     * @param {function} addCallback: Function that gets called to add a new
     * compare target selection.
    **/
    gCompareEvents.addTarget = function(event, addCallback) {
        var compareContainer;
        var newIndex;
        var oldIndex;
        var removeButton;
        var target;

        target = event.target || event.srcElement;

        oldIndex = parseInt(target.getAttribute('data-index'), 10);
        newIndex = oldIndex + 1;

        removeButton = target
            .parentElement.querySelector('#remove-button');

        if (oldIndex < constants.MAX_COMPARE_TARGETS) {
            compareContainer = document.getElementById(
                target.getAttribute('data-container'));

            compareContainer.appendChild(
                addCallback({
                    bucketId: target.getAttribute('data-bucket'),
                    data: {},
                    idx: newIndex,
                    required: false,
                    type: target.getAttribute('data-type')
                })
            );

            removeButton.setAttribute('data-index', newIndex);
            target.setAttribute('data-index', newIndex);

            compareContainer.querySelector('#compare-tree' + newIndex).focus();
        }

        if (newIndex === constants.MAX_COMPARE_TARGETS) {
            target.disabled = true;
        }

        if (removeButton.disabled && oldIndex === 1) {
            removeButton.disabled = false;
        }
    };

    /**
     * Remove the last inserted compare target.
     * Event for the - button.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.removeTarget = function(event) {
        var addButton;
        var compareContainer;
        var newIndex;
        var oldIndex;
        var target;
        var toRemove;

        target = event.target || event.srcElement;

        oldIndex = parseInt(target.getAttribute('data-index'), 10);
        newIndex = oldIndex - 1;

        addButton = target.parentElement.querySelector('#add-button');

        if (oldIndex > 1) {
            compareContainer = document.getElementById(
                target.getAttribute('data-container'));

            toRemove = compareContainer
                .querySelector('#compare-choice' + oldIndex);

            if (toRemove !== null) {
                compareContainer.removeChild(toRemove);
            }

            addButton.setAttribute('data-index', newIndex);
            target.setAttribute('data-index', newIndex);
        }

        if (newIndex === 1) {
            target.disabled = true;
        }

        if (newIndex < constants.MAX_COMPARE_TARGETS && addButton.disabled) {
            addButton.disabled = false;
        }
    };

    function validateJobSubmit(container) {
        var elements;
        var isValid;
        var treeId;
        var treeInput;
        var validSubmit;

        function _validateKernel(element) {
            validSubmit = true;

            treeId = element.getAttribute('data-tree');
            treeInput = container.querySelector('#' + treeId);

            elements = {
                tree: treeInput,
                kernel: element
            };

            isValid = isValidKernel(elements);

            if (!(isValid[0] && isValid[1])) {
                if (!isValid[0]) {
                    html.addClass(treeInput, 'invalid');
                    wrongValue(
                        document.getElementById(treeId + '-notify'),
                        gNonValidValue, gNonValidStrings.tree
                    );
                }

                if (!isValid[1]) {
                    html.addClass(element, 'invalid');
                    wrongValue(
                        document.getElementById(element.id + '-notify'),
                        gNonValidValue, gNonValidStrings.kernel
                    );
                }

                validSubmit = false;
            }

            return validSubmit;
        }

        return Array.prototype.every.call(
            container.querySelectorAll('input[id*="-kernel"]'), _validateKernel
        );
    }

    function validateBuildSubmit(container) {
        var defconfigId;
        var defconfigInput;
        var elements;
        var isValid;
        var kernelId;
        var kernelInput;
        var treeId;
        var treeInput;
        var validSubmit;

        function _validateArch(element) {
            validSubmit = true;

            treeId = element.getAttribute('data-tree');
            kernelId = element.getAttribute('data-kernel');
            defconfigId = element.getAttribute('data-defconfig');
            treeInput = container.querySelector('#' + treeId);
            kernelInput = container.querySelector('#' + kernelId);
            defconfigInput = container.querySelector('#' + defconfigId);

            elements = {
                tree: treeInput,
                kernel: kernelInput,
                defconfig: defconfigInput,
                arch: element
            };

            isValid = isValidArch(elements);

            if (!(isValid[0] && isValid[1] && isValid[2] && isValid[3])) {
                if (!isValid[0]) {
                    html.addClass(treeInput, 'invalid');
                    wrongValue(
                        document.getElementById(treeId + '-notify'),
                        gNonValidValue, gNonValidStrings.tree
                    );
                }

                if (!isValid[1]) {
                    html.addClass(kernelInput, 'invalid');
                    wrongValue(
                        document.getElementById(kernelId + '-notify'),
                        gNonValidValue, gNonValidStrings.kernel
                    );
                }

                if (!isValid[2]) {
                    html.addClass(defconfigInput, 'invalid');
                    wrongValue(
                        document.getElementById(defconfigId + '-notify'),
                        gNonValidValue, gNonValidStrings.defconfig
                    );
                }

                if (!isValid[3]) {
                    html.addClass(element, 'invalid');
                    wrongValue(
                        document.getElementById(element.id + '-notify'),
                        gNonValidValue, gNonValidStrings.arch
                    );
                }

                validSubmit = false;
            }

            return validSubmit;
        }

        return Array.prototype.every.call(
            container.querySelectorAll('input[id*="-arch"]'), _validateArch
        );
    }

    function validateBootSubmit(container) {
        var archId;
        var archInput;
        var boardId;
        var boardInput;
        var defconfigId;
        var defconfigInput;
        var elements;
        var isValid;
        var kernelId;
        var kernelInput;
        var treeId;
        var treeInput;
        var validSubmit;

        function _validateLab(element) {
            validSubmit = true;

            treeId = element.getAttribute('data-tree');
            kernelId = element.getAttribute('data-kernel');
            defconfigId = element.getAttribute('data-defconfig');
            archId = element.getAttribute('data-arch');
            boardId = element.getAttribute('data-board');
            treeInput = container.querySelector('#' + treeId);
            kernelInput = container.querySelector('#' + kernelId);
            defconfigInput = container.querySelector('#' + defconfigId);
            archInput = container.querySelector('#' + archId);
            boardInput = container.querySelector('#' + boardId);

            elements = {
                tree: treeInput,
                kernel: kernelInput,
                defconfig: defconfigInput,
                arch: archInput,
                board: boardInput,
                lab: element,
                cachePrefix: constants.BOOT_CACHE_PREFIX
            };

            isValid = isValidLab(elements);

            if (!(isValid[0] && isValid[1] && isValid[2] && isValid[3] &&
                    isValid[4] && isValid[5]))
            {
                if (!isValid[0]) {
                    html.addClass(treeInput, 'invalid');
                    wrongValue(
                        document.getElementById(treeId + '-notify'),
                        gNonValidValue, gNonValidStrings.tree
                    );
                }

                if (!isValid[1]) {
                    html.addClass(kernelInput, 'invalid');
                    wrongValue(
                        document.getElementById(kernelId + '-notify'),
                        gNonValidValue, gNonValidStrings.kernel
                    );
                }

                if (!isValid[2]) {
                    html.addClass(defconfigInput, 'invalid');
                    wrongValue(
                        document.getElementById(defconfigId + '-notify'),
                        gNonValidValue, gNonValidStrings.defconfig
                    );
                }

                if (!isValid[3]) {
                    html.addClass(archInput, 'invalid');
                    wrongValue(
                        document.getElementById(archId + '-notify'),
                        gNonValidValue, gNonValidStrings.arch
                    );
                }

                if (!isValid[4]) {
                    html.addClass(boardInput, 'invalid');
                    wrongValue(
                        document.getElementById(boardId + '-notify'),
                        gNonValidValue, gNonValidStrings.board
                    );
                }

                if (!isValid[5]) {
                    html.addClass(element, 'invalid');
                    wrongValue(
                        document.getElementById(element.id + '-notify'),
                        gNonValidValue, gNonValidStrings.lab
                    );
                }

                validSubmit = false;
            }

            return validSubmit;
        }

        return Array.prototype.every.call(
            container.querySelectorAll('input[id*="-lab"]'), _validateLab
        );
    }

    /**
     * Perform an extra form validation before sending it.
     *
     * @param {HTMLFormElement} form: The form element from the DOM.
     * @param {Function} callback: Function that will be called to perform
     * validation on the form input elements. This will be a special function
     * based on the type of the form submission.
     * @return {Boolean} True or false.
    **/
    function validateForm(form, callback) {
        var container;
        var inputElements;
        var validForm;

        validForm = false;

        container = form
            .querySelector('#' + constants.COMPARE_CONTAINER_ID);
        inputElements = container.querySelectorAll('input');

        Array.prototype.forEach.call(inputElements, function(element) {
            element.disabled = true;
        });

        // Perform fist a normal check on the fields.
        if (Array.prototype.every.call(inputElements, customValidity)) {
            // Then check that the values in each field are valid.
            validForm = callback(container);
        }

        Array.prototype.forEach.call(inputElements, function(element) {
            element.disabled = false;
        });

        return validForm;
    }

    /**
     * Event for the compare submit button.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.submitCompare = function(event) {
        var compareType;
        var form;
        var target;

        form = document.getElementById(constants.FORM_ID);
        target = event.target || event.srcElement;
        compareType = target.getAttribute('data-type');

        // Make sure the form does not submit anything.
        event.preventDefault();

        if (form.checkValidity()) {
            // form.checkValidity() only checks the basic "logic".
            // Do a more robust check on the inserted values.
            switch (compareType) {
                case 'job':
                    if (validateForm(form, validateJobSubmit)) {
                        submitJobCompare(form);
                    }
                    break;
                case 'build':
                    if (validateForm(form, validateBuildSubmit)) {
                        submitBuildCompare(form);
                    }
                    break;
                case 'boot':
                    if (validateForm(form, validateBootSubmit)) {
                        submitBootCompare(form);
                    }
                    break;
            }
        } else {
            // Peform custom validity on the elements, stopping at the first
            // not valid one.
            Array.prototype.every.call(
                form.querySelectorAll('input'), customValidity);
        }
    };

    /**
     * Remove the invalid CSS class from an element and its associated
     * notifications if any.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.removeInvalid = function(event) {
        var element;

        element = event.target || event.srcElement;
        html.removeClass(element, 'invalid');
        html.removeChildren(document.getElementById(element.id + '-notify'));
    };

    return gCompareEvents;
});
