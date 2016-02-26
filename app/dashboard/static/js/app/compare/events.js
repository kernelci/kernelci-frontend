/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/error',
    'utils/request',
    'utils/html',
    'compare/const'
], function($, e, r, html, constants) {
    'use strict';
    var gArchitectureStatus;
    var gCompareEvents;
    var gDataCache;
    var gDefconfigStatus;
    var gKernelStatus;

    gCompareEvents = {};

    // TODO: convert to localStorage API.
    // Local cache to hold retrieved values from the backend.
    gDataCache = {};
    gDataCache.trees = [];

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
            isValid = isValid && (gDataCache.trees.indexOf(treeName) !== -1);
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

            if (gDataCache.hasOwnProperty(treeTxt)) {
                isValid = isValid &&
                    (gDataCache[treeTxt].indexOf(kernelTxt) !== -1);
            } else {
                isValid = false;
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

            cacheKey = treeTxt + kernelTxt;
            if (gDataCache.hasOwnProperty(cacheKey)) {
                isValid = isValid &&
                    (gDataCache[cacheKey].indexOf(defconfigTxt) !== -1);
            } else {
                isValid = false;
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

            cacheKey = treeTxt + kernelTxt + defconfigTxt;
            if (gDataCache.hasOwnProperty(cacheKey)) {
                isValid = isValid &&
                    (gDataCache[cacheKey].indexOf(defconfigTxt) !== -1);
            } else {
                isValid = false;
            }
        }

        return [
            validDefconfig[0], validDefconfig[1], validDefconfig[2], isValid
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
            warningNode.setAttribute('data-toggle', 'popover');
            warningNode.setAttribute('data-container', 'body');
            warningNode.setAttribute('data-title', options.dataTitle);
            warningNode.setAttribute('data-content', options.dataContent);

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

        notifyNode = document.getElementById(options.element.id + '-notify');
        html.removeChildren(notifyNode);

        failNode = html.fail();
        failNode.setAttribute('data-toggle', 'popover');
        failNode.setAttribute('data-container', 'body');

        switch (status) {
            case 400:
                failNode.setAttribute('data-title', 'Wrong data');
                failNode.setAttribute(
                    'data-content', options.status['400'].content);
                break;
            case 404:
                failNode.setAttribute('data-title', 'Value not found');
                failNode.setAttribute(
                    'data-content', options.status['404'].content);
                break;
            default:
                failNode.setAttribute(
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

        html.removeChildren(element);
        failNode = html.fail();
        failNode.setAttribute('data-toggle', 'popover');
        failNode.setAttribute('data-container', 'body');
        failNode.setAttribute('data-title', title);
        failNode.setAttribute('data-content', content);

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
                // the job key.
                if (attribute === 'defconfig') {
                    data.defconfig_full = value;
                } else if (attribute === 'tree') {
                    data.job = value;
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
            container, ['tree', 'kernel', 'defconfig', 'arch']);

        postComparison('/_ajax/build/compare', '/compare/build/', data);
    }

    /**
     * Parse the compare form, create the data structure and send the request.
     *
     * @param {HTMLFormElement} form: The form element.
    **/
    function submitBootCompare(form) {
        throw 'Not implemented yet';
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
        var isInvalid;
        var notifyNode;

        isInvalid = false;
        if (element.required && !element.validity.valid) {
            html.addClass(element, 'invalid');
            notifyNode = document.getElementById(element.id + '-notify');
            html.removeChildren(notifyNode);

            failNode = html.fail();
            failNode.setAttribute('data-toggle', 'popover');
            failNode.setAttribute('data-container', 'body');

            if (element.validity.valueMissing) {
                failNode.setAttribute('data-title', 'Required field');
                failNode.setAttribute(
                    'data-content', 'Please fill out this field');
            } else if (element.validity.patternMismatch) {
                failNode.setAttribute('data-title', 'Invalid value');
                failNode.setAttribute(
                    'data-content', 'Please provide another value');
            } else {
                failNode.setAttribute('data-content', 'Wrong value');
            }

            notifyNode.appendChild(failNode);

            $(notifyNode).popover({
                selector: '[data-toggle="popover"]',
                trigger: 'hover',
                html: false
            });

            isInvalid = true;
        }

        return isInvalid;
    }

    /**
     * Get the unique tree values from the backend.
     *
     * @param {HTMLElement} bucket: The element where the retrieved data will
     * be appended as a datalist structure.
    **/
    gCompareEvents.getTrees = function(bucket) {
        var deferred;

        deferred = r.get('/_ajax/job/distinct/job');
        $.when(deferred)
            .fail(function(jqXHR) {
                e.customError(
                    jqXHR.status,
                    'Error retrieving tree values from server.');
            })
            .done(function(response) {
                getTreesDone(response, bucket);
            });
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

        target = event.target || event.srcElement;
        treeId = target.getAttribute('data-tree');
        treeInput = document.getElementById(treeId);

        if (isValidTree(treeInput)) {
            options = {
                element: target,
                cacheKey: treeInput.value,
                bucketId: 'datalist-' + treeInput.value,
                url: '/_ajax/job/distinct/kernel/',
                query: '?job=' + treeInput.value,
                dataTitle: 'No kernel values',
                dataContent: 'No kernel values found',
                status: gKernelStatus
            };

            getValues(options);
        } else {
            target.removeAttribute('list');
            html.addClass(treeInput, 'invalid');
            wrongValue(
                document.getElementById(treeId + '-notify'),
                'Invalid value', 'Specified tree value is not valid or empty'
            );
        }
    };

    /**
     * When the defconfig field gets the focus, trigger a search for the valid
     * values based on the tree and kernel inputs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.defconfigInputFocus = function(event) {
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
            treeName = treeInput.value;
            kernelName = kernelInput.value;

            options = {
                bucketId: 'datalist-' + treeName + kernelName,
                cacheKey: treeName + kernelName,
                element: target,
                url: '/_ajax/build/distinct/defconfig_full/',
                query: '?job=' + treeName + '&kernel=' + kernelName,
                dataTitle: 'No defconfig values',
                dataContent: 'No defconfig values found',
                status: gDefconfigStatus
            };

            getValues(options);
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    'Invalid value',
                    'Specified tree value is not valid or empty'
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    'Invalid value',
                    'Specified kernel value is not valid or empty'
                );
            }
        }
    };


    /**
     * When the arch field gets the focus, trigger a search for the valid
     * values based on the tree, kernel and defconfig inputs.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.archInputFocus = function(event) {
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
            defconfig: defconfigInput
        });

        if (isValid[0] && isValid[1] && isValid[2]) {
            treeTxt = html.escape(treeInput.value);
            kernelTxt = html.escape(kernelInput.value);
            defconfigTxt = html.escape(defconfigInput.value);

            options = {
                bucketId: 'datalist-' + treeTxt + kernelTxt + defconfigTxt,
                cacheKey: treeTxt + kernelTxt + defconfigTxt,
                element: target,
                url: '/_ajax/build/distinct/arch/',
                query: '?job=' + treeTxt + '&kernel=' + kernelTxt +
                    '&defconfig_full=' + defconfigTxt,
                dataTitle: 'No architecture values',
                dataContent: 'No architecture values found',
                status: gArchitectureStatus
            };

            getValues(options);
        } else {
            target.removeAttribute('list');

            if (!isValid[0]) {
                html.addClass(treeInput, 'invalid');
                wrongValue(
                    document.getElementById(treeId + '-notify'),
                    'Invalid value',
                    'Specified tree value is not valid or empty'
                );
            }

            if (!isValid[1]) {
                html.addClass(kernelInput, 'invalid');
                wrongValue(
                    document.getElementById(kernelId + '-notify'),
                    'Invalid value',
                    'Specified tree value is not valid or empty'
                );
            }

            if (!isValid[2]) {
                html.addClass(defconfigInput, 'invalid');
                wrongValue(
                    document.getElementById(defconfigId + '-notify'),
                    'Invalid value',
                    'Specified tree value is not valid or empty'
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

    /**
     * Event for the compare submit button.
     *
     * @param {Event} event: The triggering event.
    **/
    gCompareEvents.submitCompare = function(event) {
        var compareType;
        var formNode;
        var target;

        target = event.target || event.srcElement;
        compareType = target.getAttribute('data-type');
        formNode = document.getElementById(constants.FORM_ID);

        // Make sure the form does not submit anything.
        event.preventDefault();

        if (formNode.checkValidity()) {
            // TODO: need to perform double checks here!
            // form.checkValidity() only checks the basic "logic", like the
            // pattern matching. Need more tests.
            switch (compareType) {
                case 'job':
                    submitJobCompare(formNode);
                    break;
                case 'build':
                    submitBuildCompare(formNode);
                    break;
                case 'boot':
                    submitBootCompare(formNode);
                    break;
            }
        } else {
            // Peform custom validity on the elements, stopping at the first
            // not valid one.
            Array.prototype.some.call(
                formNode.querySelectorAll('input'), customValidity);
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
