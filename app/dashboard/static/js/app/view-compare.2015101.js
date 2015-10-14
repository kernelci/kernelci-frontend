/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request'
], function($, b, e, i, r) {
    'use strict';
    var dataListBucket;

    function submitComparison(event) {
        var compareTo,
            compareType,
            compareTypeElements,
            data,
            deferred,
            elementsLen,
            idx,
            kernelId,
            target,
            treeEl,
            treeElements;

        data = {};
        compareTo = [];
        // Make sure the form does not submit anything.
        event.preventDefault();

        target = event.target || event.srcElement;
        compareTypeElements = target
            .getElementsByClassName('compare-type');

        data.job = document.getElementById('baseline-tree').value;
        data.kernel = document.getElementById('baseline-kernel').value;

        elementsLen = compareTypeElements.length;
        for (idx = 0; idx < elementsLen; idx = idx + 1) {
            if (compareTypeElements[idx].checked) {
                compareType = compareTypeElements[idx].value;
                break;
            }
        }

        treeElements = target.getElementsByClassName('tree-compare');
        elementsLen = treeElements.length;
        for (idx = 0; idx < elementsLen; idx = idx + 1) {
            treeEl = treeElements[idx];
            if (treeEl.value !== '') {
                kernelId = treeEl.getAttribute('data-kernel');
                compareTo.push({
                    job: treeEl.value,
                    kernel: document.getElementById(kernelId).value
                });
            }
        }
        data.compare_to = compareTo;

        deferred = r.post('/_ajax/job/compare', JSON.stringify(data));
        $.when(deferred)
            .done(function(response, ignore, jqXHR) {
                var compareId = jqXHR.getResponseHeader('X-Kernelci-Compare-Id');
                window.location = '/compare/job/' + compareId;
            });
    }

    function createdDataList(result, dataListId) {
        var dataList,
            option;

        dataList = document.createElement('datalist');
        dataList.id = dataListId;

        result.forEach(function(value) {
            option = document.createElement('option');
            option.value = value;
            dataList.appendChild(option);
        });

        dataListBucket.appendChild(dataList);
    }

    function kernelInputDone(response, inputElement, dataListId) {
        var result,
            resLen;

        result = response.result;
        resLen = result.length;

        if (resLen > 0) {
            createdDataList(result, dataListId);
            inputElement.setAttribute('list', dataListId);
        } else {
            // tODO
        }
    }

    function kernelInputFocus(event) {
        var target,
            deferred,
            treeInput,
            treeInputId,
            treeValue,
            dataListId;

        target = event.target || event.srcElement;
        treeInputId = target.getAttribute('data-tree');

        if (treeInputId !== null) {
            treeInput = document.getElementById(treeInputId);

            if (treeInput.checkValidity()) {
                treeValue = b.escapeHtml(treeInput.value);

                if (treeValue === treeInput.value) {
                    dataListId = 'datalist-' + treeValue;

                    if (document.getElementById(dataListId) === null) {
                        deferred = r.get(
                            '/_ajax/job/distinct/kernel?job=' + treeValue);

                        $.when(deferred)
                            .fail()
                            .done(function(response) {
                                kernelInputDone(response, target, dataListId);
                            });
                    } else {
                        target.setAttribute('list', dataListId);
                    }
                } else {
                    // TODO: wrong tree value inserted
                }
            } else {
                // TODO: need to select a tree name
            }
        } else {
            // TODO: select a tree name first
        }
    }

    function getTreesFail() {
        // TODO
    }

    function getTreesDone(response) {
        var result = response.result,
            resLen = result.length;

        if (resLen > 0) {
            createdDataList(result, 'trees');
        } else {
            // TODO
        }
    }

    $(document).ready(function() {
        var deferred,
            kernelInputs,
            idx;

        document.getElementById('li-compare').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        dataListBucket = document.getElementById('data-list-bucket');
        kernelInputs = document.querySelectorAll('.kernel');

        for (idx = 0; idx < kernelInputs.length; idx = idx + 1) {
            kernelInputs[idx].addEventListener('focus', kernelInputFocus);
        }

        document.getElementById('comparison')
            .addEventListener('submit', submitComparison);


        deferred = r.get('/_ajax/job/distinct/job');
        $.when(deferred)
            .fail(e.error, getTreesFail)
            .done(getTreesDone);
    });
});
