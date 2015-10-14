/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/error',
    'utils/request',
    'utils/html',
    'compare/const'
], function($, e, r, html, constants) {
    'use strict';
    var compareEvents,
        dataCache;

    compareEvents = {};
    // TODO: convert to localStorage API.
    dataCache = {};

    function getKernelValuesFail(element, status) {
        var notifyNode,
            failNode;

        notifyNode = document.getElementById(element.id + '-notify');
        html.removeChild(notifyNode);

        failNode = html.fail();
        failNode.setAttribute('data-toggle', 'popover');
        failNode.setAttribute('data-container', 'body');

        switch (status) {
            case 400:
                failNode.setAttribute('data-title', 'Wrong data');
                failNode.setAttribute(
                    'data-content',
                    'Wrong data passed looking for kernel values');
                break;
            case 404:
                failNode.setAttribute('data-title', 'Tree not found');
                failNode.setAttribute(
                    'data-content', 'No kernel values found for chosen tree');
                break;
            default:
                failNode.setAttribute(
                    'data-content', 'Error retrieving kernel values');
                break;
        }

        notifyNode.appendChild(failNode);

        $(notifyNode).popover({
            selector: '[data-toggle="popover"]',
            trigger: 'hover',
            html: false
        });
    }

    function getKernelValuesDone(response, element, bucketId, treeName) {
        var bucketContainer,
            bucketContainerId,
            dataBucket,
            notifyNode,
            option,
            results,
            treeCache,
            warningNode;

        results = response.result;
        if (results.length > 0) {
            bucketContainerId = element.getAttribute('data-bucket');
            bucketContainer = document.getElementById(bucketContainerId);

            dataBucket = document.createElement('datalist');
            dataBucket.id = bucketId;

            treeCache = dataCache[treeName];
            results.forEach(function(value) {
                option = document.createElement('option');
                option.value = value;
                treeCache.push(value);
                dataBucket.appendChild(option);
            });

            bucketContainer.appendChild(dataBucket);
            element.setAttribute('list', bucketId);
        } else {
            notifyNode = document.getElementById(element.id + '-notify');
            html.removeChildren(notifyNode);

            warningNode = html.unknown();
            warningNode.setAttribute('data-toggle', 'popover');
            warningNode.setAttribute('data-container', 'body');
            warningNode.setAttribute('data-title', 'No kernel values');
            warningNode.setAttribute('data-content', 'No kernel values found');

            notifyNode.appendChild(warningNode);

            $(notifyNode).popover({
                selector: '[data-toggle="popover"]',
                trigger: 'hover',
                html: false
            });
        }
    }

    function getKernelValues(treeName, element, bucketId) {
        var deferred;

        deferred = r.get('/_ajax/job/distinct/kernel?job=' + treeName);

        if (!dataCache.hasOwnProperty(treeName)) {
            dataCache[treeName] = [];
        }

        $.when(deferred)
            .fail(function(jqXHR) {
                getKernelValuesFail(element, jqXHR.status);
            })
            .done(function(response) {
                getKernelValuesDone(response, element, bucketId, treeName);
            });
    }

    function getTreesDone(response, bucket) {
        var dataBucket,
            option,
            results;

        results = response.result;
        if (results.length > 0) {
            dataBucket = document.createElement('datalist');
            dataBucket.id = constants.TREES_DATA_LIST;

            dataCache.trees = [];
            results.forEach(function(value) {
                option = document.createElement('option');
                option.value = value;
                dataCache.trees.push(value);
                dataBucket.appendChild(option);
            });

            bucket.appendChild(dataBucket);
        }
    }

    function wrongTreeValue(notifyNode, title, errorTxt) {
        var failNode;

        html.removeChildren(notifyNode);
        failNode = html.fail();
        failNode.setAttribute('data-toggle', 'popover');
        failNode.setAttribute('data-container', 'body');
        failNode.setAttribute('data-title', title);
        failNode.setAttribute('data-content', errorTxt);

        notifyNode.appendChild(failNode);

        $(notifyNode).popover({
            selector: '[data-toggle="popover"]',
            trigger: 'hover',
            html: false
        });
    }

    function correctTreeValue(element, treeName) {
        var bucketId;

        bucketId = 'datalist-' + treeName;
        if (document.getElementById(bucketId) === null) {
            getKernelValues(treeName, element, bucketId);
        } else {
            element.setAttribute('list', bucketId);
        }
    }

    /**
     * Parse the compare form, create the data structure and send the request.
     *
     * @param {HTMLFormElement} form: The form element.
    **/
    function submitBuildCompare(form) {
        throw 'Not implemented yet';
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
        var data,
            choiceContainer,
            treeValue,
            kernelId,
            kernelValue,
            compareTo,
            deferred;

        choiceContainer = form
            .querySelector('#' + constants.COMPARE_TO_CONTAINER_ID);

        // Get the baseline data.
        data = {
            job: form.querySelector('#baseline-tree').value,
            kernel: form.querySelector('#baseline-kernel').value
        };

        compareTo = [];

        [].forEach.call(
            choiceContainer.querySelectorAll('input.tree'),
            function(element) {
                treeValue = element.value;
                kernelId = element.getAttribute('data-kernel');

                kernelValue = choiceContainer
                    .querySelector('#' + kernelId).value;

                if (treeValue !== '' && kernelValue !== '') {
                    compareTo.push({
                        job: treeValue,
                        kernel: kernelValue
                    });
                }
            }
        );

        data.compare_to = compareTo;

        // TODO: handle errors.
        deferred = r.post('/_ajax/job/compare', JSON.stringify(data));
        $.when(deferred)
            .fail(e.error)
            .done(function(response, ignore, jqXHR) {
                var compId = jqXHR
                    .getResponseHeader(constants.KERNEL_CI_COMPARE_ID_HEADER);
                window.location = '/compare/job/' + compId;
            });
    }

    /**
     * Perform custom validation checkes on the form elements.
     *
     * @param {Element} element: The element on which to perfrom the
     * validity checks.
    **/
    function customValidity(element) {
        var isInvalid,
            notifyNode,
            failNode;

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
    compareEvents.getTrees = function(bucket) {
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
    compareEvents.kernelInputFocus = function(event) {
        var notifyNode,
            target,
            treeId,
            treeInput,
            treeName;

        target = event.target || event.srcElement;
        treeId = target.getAttribute('data-tree');
        treeInput = document.getElementById(treeId);
        notifyNode = document.getElementById(treeId + '-notify');

        if (treeInput.checkValidity()) {
            treeName = html.escape(treeInput.value);

            if (dataCache.hasOwnProperty('trees')) {
                if (dataCache.trees.indexOf(treeName) !== -1) {
                    correctTreeValue(target, treeName);
                } else {
                    target.removeAttribute('list');
                    html.addClass(treeInput, 'invalid');
                    wrongTreeValue(
                        notifyNode,
                        'Invalid value', 'Specified tree value is not known'
                    );
                }
            } else {
                if (treeName === treeInput.value) {
                    correctTreeValue(target, treeName);
                } else {
                    target.removeAttribute('list');
                    html.addClass(treeInput, 'invalid');
                    wrongTreeValue(
                        notifyNode,
                        'Invalid value', 'Specified tree value is not valid'
                    );
                }
            }
        } else {
            target.removeAttribute('list');
            html.addClass(treeInput, 'invalid');
            wrongTreeValue(
                notifyNode,
                'Invalid value',
                'Specified tree value is not valid and/or empty'
            );
        }
    };

    /**
     * Add a new compare target selection.
     *
     * @param {event} event: The event triggering the action.
     * @param {function} addCallback: Function that gets called to add a new
     * compare target selection.
    **/
    compareEvents.addTarget = function(event, addCallback) {
        var target,
            oldIndex,
            newIndex,
            compareContainer,
            removeButton;

        target = event.target || event.srcElement;

        oldIndex = parseInt(target.getAttribute('data-index'), 10);
        newIndex = oldIndex + 1;

        removeButton = target
            .parentElement.querySelector('#remove-button');

        if (oldIndex < constants.MAX_COMPARE_TARGETS) {
            compareContainer = document.getElementById(
                target.getAttribute('data-container'));

            compareContainer.appendChild(
                addCallback(
                    target.getAttribute('data-type'),
                    newIndex,
                    false,
                    target.getAttribute('data-bucket')
                )
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
    compareEvents.removeTarget = function(event) {
        var addButton,
            compareContainer,
            newIndex,
            oldIndex,
            target,
            toRemove;

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
    compareEvents.submitCompare = function(event) {
        var compareType,
            formNode,
            target;

        target = event.target || event.srcElement;
        compareType = target.getAttribute('data-type');
        formNode = document.getElementById(constants.FORM_ID);

        // Make sure the form does not submit anything.
        event.preventDefault();

        if (formNode.checkValidity()) {
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
            [].some.call(formNode.querySelectorAll('input'), customValidity);
        }
    };

    /**
     * Remove the invalid CSS class from an element and its associated
     * notifications if any.
     *
     * @param {Event} event: The triggering event.
    **/
    compareEvents.removeInvalid = function(event) {
        var element;

        element = event.target || event.srcElement;
        html.removeClass(element, 'invalid');
        html.removeChildren(document.getElementById(element.id + '-notify'));
    };

    return compareEvents;
});
