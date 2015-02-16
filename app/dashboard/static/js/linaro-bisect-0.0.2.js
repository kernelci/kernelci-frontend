// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var Bisect = (function() {
    'use strict';

    var bisectBootComparisonDescription,
        bisectBuildComparisonDescription,
        buildTooltipTitleF,
        buildTooltipLinkF,
        bootTooltipLinkF,
        bootTooltipTitleF,
        gitDescribeCellF,
        commitCellF,
        bisectScriptElementF,
        showBisectTooltip,
        hideBisectTooltip,
        showBisectComparedTooltip,
        hideBisectComparedTooltip,
        bisectHiddenText,
        bisectComparedHiddenText,
        BisectElements,
        // The number of columns in the bisect table.
        bisectColSpan = 4,
        // How many rows are too many?
        bisectMaxElements = 6,
        bisectHiddenHelpRowId = 'bisect-hidden-help',
        bisectCompareHiddenHelpRowId = 'bisect-comapre-hidden-help',
        bisectHiddenRowClass = 'bisect-hidden-row',
        bisectCompareHiddenRowClass = 'bisect-compare-hidden-row',
        bisectPlustButtonId = 'plus-button',
        bisectMinusButtonId = 'minus-button',
        bisectComparePlusButtonId = 'plus-compare-button',
        bisectCompareMinusButtonId = 'minus-compare-button';

    // Object prototype that should be passed to fillBisctTable function.
    BisectElements = {
        // The ID of the element to show/hide the bisect table.
        showHideID: null,
        // The ID of the div containing the bisect table.
        tableDivID: null,
        // The ID of the table element.
        tableID: null,
        // The ID of the table tbody element.
        tableBodyID: null,
        // The div element that contains all the bisect DOM.
        contentDivID: null,
        // The ID of the div with the loading content text.
        loadingDivID: null,
        // The ID of the element with the loading text.
        loadingContentID: null,
        // The text to substitute.
        loadingContentText: null,
        // The ID of the element that store the good commit.
        goodCommitID: null,
        // The ID of the element that store the bad commit.
        badCommitID: null,
        // The ID of the element that contains the bisect script.
        bisectScriptContainerID: null,
        // Where the bisect script should be placed.
        bisectScriptContentID: null,
        // The ID of the element that should contain the bisect comparison
        // description.
        bisectCompareDescriptionID: null,
        // The bisect data of the previous bisect (for comparison).
        prevBisect: null,
        // The ID of the div element where to put show/hide buttons for the
        // bisect table rows.
        bisectShowHideID: null
    };

    // Format strings used to build links, tooltips, labels...
    // They require the sprintf JavaScript library.
    bootTooltipTitleF = 'Boot report details for %s &dash; %s';
    bootTooltipLinkF = '<a href="/boot/all/job/%s/kernel/%s">%s</a>';
    buildTooltipLinkF = '<a href="/build/%s/kernel/%s">%s</a>';
    buildTooltipTitleF = 'Build details for %s &dash; %s';
    gitDescribeCellF = '<td><span class="bisect-tooltip"><span ' +
        'rel="tooltip" data-toggle="tooltip" title="%s"><span ' +
        'class="bisect-text">%s</span></span></span></td>';
    commitCellF = '<td class="%s"><a href="%s">%s&nbsp;' +
        '<i class="fa fa-external-link"></i></a></td>';

    bisectBootComparisonDescription = 'The comparison with the ' +
        '&#171;%s&#187; tree is based on the boot reports with the same ' +
        'board, lab name, architecture and defconfig values.';
    bisectBuildComparisonDescription = 'The comparison with the ' +
        '&#171;%s&#187; tree is based on the build reports with the same ' +
        'architecture and defconfig values.';

    bisectScriptElementF = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="%s"><a download="%s" href="%s">' +
        '<i class="fa fa-download"></i></a></span>';

    showBisectTooltip = 'Show content of default bisect';
    hideBisectTooltip = 'Hide content of default bisect';
    showBisectComparedTooltip = 'Show content of bisect ' +
        'compared to &#171;%s&#187;';
    hideBisectComparedTooltip = 'Hide content of bisect ' +
        'compared to &#171;%s&#187;';
    bisectHiddenText = 'Content of default bisection hidden. ' +
        'Use the <i class="fa fa-eye"></i> button to show it again.';
    bisectComparedHiddenText = 'Content of bisection compared to ' +
        '&#171;%s&#187; hidden. Use the ' +
        '<i class="fa fa-eye"></i> button to show it again.';

    // Create the "eye" button to show/hide the bisect table and summary.
    // `element`: The ID of the element that should contain the button.
    // `showHide`: The ID of the element that should be shown/hidden.
    // `action`: The action to take: can be 'show' or 'hide'.
    // `compareTo`: The name of the compare tree or null.
    function createShowHideButton(element, showHide, action, compareTo) {
        var faClass = 'fa fa-eye',
            tooltipTitle = showBisectTooltip;

        if (action === 'show' && compareTo !== null) {
            tooltipTitle = sprintf(showBisectComparedTooltip, compareTo);
        }

        if (action === 'hide') {
            faClass = 'fa fa-eye-slash';

            if (compareTo === null) {
                tooltipTitle = hideBisectTooltip;
            } else {
                tooltipTitle = sprintf(hideBisectComparedTooltip, compareTo);
            }
        }

        return '<span rel="tooltip" data-toggle="tooltip"' +
            'title="' + tooltipTitle + '"><i data-action="' + action + '" ' +
            'data-id="' + element + '" data-sh="' + showHide + '" ' +
            'data-compared="' + compareTo + '" ' +
            'class="' + faClass + '" ' +
            'onclick="Bisect.showHideBisect(this)"></i></span>';
    }

    // Show/Hide the bisect data based on the data attributes of the element.
    function showHideBisect(element) {
        var button = null,
            tElement = $(element),
            dataId = JSBase.checkIfNotID(tElement.data('id')),
            dataAction = tElement.data('action'),
            dataShowHide = tElement.data('sh'),
            dataCompared = tElement.data('compared');

        if (dataAction === 'hide') {
            button = createShowHideButton(
                dataId, dataShowHide, 'show', dataCompared);
            JSBase.hideElementByID(dataShowHide);
            JSBase.replaceContentByID(dataId, button);

            if (dataCompared === null) {
                JSBase.replaceContentByID(
                    '#view-' + dataId,
                    '<small>' + bisectHiddenText + '<small>');
            } else {
                JSBase.replaceContentByID(
                    '#view-' + dataId,
                    '<small>' +
                    sprintf(bisectComparedHiddenText, dataCompared) +
                    '<small>'
                );
            }
        } else {
            button = createShowHideButton(
                dataId, dataShowHide, 'hide', dataCompared);
            JSBase.showElementByID(dataShowHide);
            $('#view-' + dataId).empty();
            JSBase.replaceContentByID(dataId, button);
        }
    }

    // Create a simple bash script for git bisection.
    // `badCommit`: The starting point for the bisect script.
    // `goodCommit`: The end point.
    function bisectShellScript(badCommit, goodCommit) {
        var bisectScript = '';

        if (badCommit !== null && goodCommit !== null) {
            bisectScript = '#!/bin/bash\ngit bisect start ' +
                badCommit + ' ' + goodCommit + '\n';
        }
        return 'data:text/plain;charset=UTF-8,' +
            encodeURIComponent(bisectScript);
    }

    // Create a bash script for git bisection for the compared one.
    // `badCommit`: The starting point for the bisect script.
    // `goodCommits`: The list of good commits.
    function bisectCompareShellScript(badCommit, goodCommits) {
        var bisectScript = '';

        if (badCommit !== null && goodCommits.length > 0) {
            bisectScript = '#!/bin/bash\ngit bisect start\n';
            bisectScript += sprintf('git bisect bad %s\n', badCommit);
            goodCommits.forEach(function(element) {
                bisectScript += sprintf('git bisect good %s\n', element);
            });
        }

        return sprintf(
            'data:text/plain;charset=UTF-8,%s',
            encodeURIComponent(bisectScript));
    }

    function bisectComparedToSummary(
            bisectElements, bisectType, comparedCommits) {
        var prevData = null,
            prevBadCommit = null,
            prevGoodCommit = null,
            prevGoodCommitDate = null,
            otherCommitDate = null,
            otherCommitsArray = [],
            prevCommitInserted = false;

        if (comparedCommits.length > 0) {
            prevData = bisectElements.prevBisect;
            prevBadCommit = prevData.bad_commit;
            prevGoodCommit = prevData.good_commit;

            if (prevGoodCommit !== null) {
                prevGoodCommitDate = new Date(
                    prevData.good_commit_date.$date);
            }

            comparedCommits.forEach(function(element) {
                if (bisectType === 'boot') {
                    otherCommitDate = new Date(
                        element.boot_created_on.$date);
                } else if (bisectType === 'build') {
                    otherCommitDate = new Date(
                        element.created_on.$date);
                }

                if (!prevCommitInserted && prevGoodCommitDate !== null &&
                        prevGoodCommitDate < otherCommitDate) {
                    otherCommitsArray.push(prevGoodCommit);
                    otherCommitsArray.push(element.git_commit);
                    prevCommitInserted = true;
                } else {
                    otherCommitsArray.push(element.git_commit);
                }
            });

            if (bisectType === 'boot') {
                JSBase.replaceContentByID(
                    bisectElements.bisectScriptContentID,
                    sprintf(
                        bisectScriptElementF,
                        'Download boot bisect comparison script',
                        'bisect-compared.sh',
                        bisectCompareShellScript(
                            prevBadCommit, otherCommitsArray)
                    )
                );
            } else if (bisectType === 'build') {
                JSBase.replaceContentByID(
                    bisectElements.bisectScriptContentID,
                    sprintf(
                        bisectScriptElementF,
                        'Download build bisect comparison script',
                        'bisect-compared.sh',
                        bisectCompareShellScript(
                            prevBadCommit, otherCommitsArray)
                    )
                );
            }

            JSBase.removeCssClassForID(
                bisectElements.bisectScriptContainerID, 'hidden');
        } else {
            JSBase.removeElementByID(
                bisectElements.bisectScriptContainerID);
        }
    }

    function bisectSummary(badCommit, goodCommit, bisectElements, bisectType) {
        if (badCommit !== null) {
            JSBase.replaceContentByID(
                bisectElements.badCommitID,
                '<span class="text-danger">' + badCommit + '</span>');
        } else {
            JSBase.replaceContentByID(
                bisectElements.badCommitID,
                '<span class="text-warning">No bad commit found</span>');
        }
        if (goodCommit !== null) {
            JSBase.replaceContentByID(
                bisectElements.goodCommitID,
                '<span class="text-success">' + goodCommit + '</span>');
        } else {
            JSBase.replaceContentByID(
                bisectElements.goodCommitID,
                '<span class="text-warning">No good commit found</span>');
        }

        if (badCommit !== null && goodCommit !== null) {
            JSBase.removeCssClassForID(
                bisectElements.bisectScriptContainerID, 'hidden');
            if (bisectType === 'boot') {
                JSBase.replaceContentByID(
                    bisectElements.bisectScriptContentID,
                    sprintf(
                        bisectScriptElementF,
                        'Download boot bisect script',
                        'bisect.sh',
                        bisectShellScript(badCommit, goodCommit)
                    )
                );
            } else if (bisectType === 'build') {
                JSBase.replaceContentByID(
                    bisectElements.bisectScriptContentID,
                    sprintf(
                        bisectScriptElementF,
                        'Download build bisect script',
                        'bisect.sh',
                        bisectShellScript(badCommit, goodCommit)
                    )
                );
            }
        } else {
            JSBase.removeElementByID(
                bisectElements.bisectScriptContainerID);
        }
    }

    // Fill up the bisect summary element in a page.
    // `badCommit`: The bad commit value.
    // `goodCommit`: The good commit value.
    // `bisectElements`: The BisectElements object with DOM ids and other data.
    // `bisectType`: The type of the bisect (boot, build).
    // `compareGoodCommits`: The good commits for the comparison.
    // `isComparison`: If this is for a comparison bisect or not.
    function fillBisectSummary(
        badCommit,
        goodCommit,
        bisectElements,
        bisectType,
        compareGoodCommits,
        isComparison)
    {
        if (isComparison) {
            bisectComparedToSummary(
                bisectElements, bisectType, compareGoodCommits);
        } else {
            bisectSummary(badCommit, goodCommit, bisectElements, bisectType);
        }
    }

    function parseBisectDataToRow(bisectData, job, bisectType) {
        var bisectStatus = null,
            gitDescribeVal = bisectData.git_describe,
            gitCommit = bisectData.git_commit,
            gitURL = bisectData.git_url,
            tooltipTitle = '',
            tooltipLink = '',
            gitDescribeCell = '',
            gitURLs = '',
            goodCommitCell = '',
            badCommitCell = '',
            unknownCommitCell = '',
            row = '<tr></tr>',
            goodCommit = null;

        if (bisectData.hasOwnProperty('status')) {
            bisectStatus = bisectData.status;
        } else {
            bisectStatus = bisectData.boot_status;
        }

        if (gitCommit === '' || gitCommit === undefined) {
            gitCommit = null;
        }

        if (gitCommit !== null) {
            if (bisectType === 'boot') {
                tooltipLink = sprintf(
                    bootTooltipLinkF, job, gitDescribeVal, gitDescribeVal);
                tooltipTitle = sprintf(bootTooltipTitleF, job, gitDescribeVal);
            } else if (bisectType === 'build') {
                tooltipLink = sprintf(
                    buildTooltipLinkF, job, gitDescribeVal, gitDescribeVal);
                tooltipTitle = sprintf(buildTooltipTitleF, job, gitDescribeVal);
            } else {
                tooltipLink = gitDescribeVal;
            }

            gitDescribeCell = sprintf(
                gitDescribeCellF, tooltipTitle, tooltipLink);

            gitURLs = JSBase.translateCommitURL(gitURL, gitCommit);

            switch (bisectStatus) {
                case 'PASS':
                    goodCommit = bisectData;
                    goodCommitCell = sprintf(
                        commitCellF, 'bg-success', gitURLs[1], gitCommit);
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                case 'FAIL':
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = sprintf(
                        commitCellF, 'bg-danger', gitURLs[1], gitCommit);
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                default:
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = sprintf(
                        commitCellF, 'bg-warning', gitURLs[1], gitCommit);
                    break;
            }

            row = '<tr>' + gitDescribeCell + badCommitCell +
                unknownCommitCell + goodCommitCell + '</tr>';
        }

        return [row, goodCommit];
    }

    // Create the +/- buttons to show/hide bisect table rows.
    function createBisectShowHideButton(
            elNumber, elementID, tableID, isComparison) {
        var plusButton,
            minusButton,
            buttonLayout,
            dataType = 'default',
            plusId = bisectPlustButtonId,
            minusId = bisectMinusButtonId;

        if (isComparison) {
            dataType = 'compare';
            plusId = bisectComparePlusButtonId;
            minusId = bisectCompareMinusButtonId;
        }

        plusButton = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show all bisect results">' +
            '<button id="' + plusId + '" type="button" ' +
            'class="btn btn-default" ' +
            'onclick="Bisect.showMoreBisectRows(this)" ' +
            'data-table="' + tableID + '" data-rows="' + elNumber +
            '" data-type="' + dataType + '">' +
            '<i class="fa fa-plus"></i>' +
            '</button>' +
            '</span>';
        minusButton = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show less bisect results"' +
            '<button id="' + minusId + '" type="button" ' +
            'class="btn btn-default"' +
            'onclick="Bisect.showLessBisectRows(this)" ' +
            'data-table="' + tableID + '" data-rows="' + elNumber +
            '" data-type="' + dataType + '">' +
            '<i class="fa fa-minus"></i>' +
            '</button>' +
            '</span>';

        buttonLayout = sprintf('%s&nbsp;%s', plusButton, minusButton);

        JSBase.replaceContentByID(elementID, buttonLayout);
    }

    // Function called to hide bisect table rows.
    // `element`: The element that is triggering the function.
    function showLessBisectRows(element) {
        // The triggering element must contain the following data attributes:
        // data-table: the ID of the table element
        // data-rows: the total number of rows
        // data-type: the type of bisect (default or compare)
        // The other elements are provided by the closure.
        var tElement = $(element),
            tableID = tElement.data('table'),
            rowsNumber = tElement.data('rows'),
            bisectType = tElement.data('type'),
            helpRowId = bisectHiddenHelpRowId,
            bisectHiddenClass = bisectHiddenRowClass,
            row = null,
            rowIndex = 0,
            // Only show 4 rows and hide all the others.
            elementsToShow = [1, 2, rowsNumber - 1, rowsNumber],
            newRow = null,
            rowText = null,
            plusId = bisectPlustButtonId,
            minusId = bisectMinusButtonId,
            plusButton = '<i class="fa fa-plus"></i>';

        if (bisectType === 'compare') {
            helpRowId = bisectCompareHiddenHelpRowId;
            bisectHiddenClass = bisectCompareHiddenRowClass;
            plusId = bisectComparePlusButtonId;
            minusId = bisectCompareMinusButtonId;
        }

        rowText = sprintf(
            '%d out of %d rows hidden. Use the %s button on the right to ' +
            'show them.',
            (rowsNumber - 4), rowsNumber, plusButton);

        newRow = sprintf(
            '<tr id="' + helpRowId + '">' +
            '<td class="pull-center" colspan="' + bisectColSpan + '">' +
            '<small>%s</small></td></tr>',
            rowText
        );

        $(tableID + ' > tbody > tr').each(function() {
            row = $(this);
            rowIndex = row.context.rowIndex;

            if (elementsToShow.indexOf(rowIndex) === -1) {
                row.addClass('hidden').addClass(bisectHiddenClass);
            }
        });

        // Add the row with the help text as the 3rd row.
        $(tableID + ' tr:nth-child(2)').after(newRow);
        $(JSBase.checkIfID(plusId)).removeAttr('disabled');
        $(JSBase.checkIfID(minusId)).attr('disabled', 'disable');
    }

    // Function called to show again the hidden bisect row.
    // `element`: The element that is triggering the function.
    function showMoreBisectRows(element) {
        // The triggering element must contain at least the following data
        // attributes:
        // 'data-type': the type of bisect (default or compare)
        // The other elements are provided by the closure.
        var tElement = $(element),
            bisectType = tElement.data('type'),
            helpRowId = bisectHiddenHelpRowId,
            plusId = bisectPlustButtonId,
            minusId = bisectMinusButtonId,
            bisectHiddenClass = bisectHiddenRowClass;

        if (bisectType === 'compare') {
            helpRowId = bisectCompareHiddenHelpRowId;
            bisectHiddenClass = bisectCompareHiddenRowClass;
            plusId = bisectComparePlusButtonId;
            minusId = bisectCompareMinusButtonId;
        }

        JSBase.removeElementByID(helpRowId);
        JSBase.removeCssClassForClass(bisectHiddenClass, 'hidden');
        $(JSBase.checkIfID(minusId)).removeAttr('disabled');
        $(JSBase.checkIfID(plusId)).attr('disabled', 'disable');
    }

    // Populate the bisect elements based on the provided DOM elements.
    // `bisectData`: The bisect JSON data to analyze.
    // `bisectElements`: The BisectElements data structure that contains the
    // DOM element IDs and other necessary data.
    // `isComparison`: If the bisect is a comparison one or not.
    function initBisect(bisectData, bisectElements, isComparison) {
        JSBase.replaceContentByID(
            bisectElements.loadingContentID,
            bisectElements.loadingContentText);

        var localResult = bisectData.result[0],
            localData = localResult.bisect_data,
            localLen = localData.length,
            i = 0,
            tableRows = '',
            bisectType = null,
            job = null,
            compareTo = null,
            badCommit = null,
            goodCommit = null,
            rowResult = null,
            button = null,
            // Contain the good commits for comparison purposes.
            compareGoodCommits = [];

        badCommit = localResult.bad_commit;
        goodCommit = localResult.good_commit;
        bisectType = localResult.type;

        // Retrieve the job value in case the 'compare_to' field is empty.
        // It is empty in the case of a normal bisect.
        if (isComparison) {
            job = localResult.compare_to;
            compareTo = localResult.compare_to;
        } else {
            job = localResult.job;
        }

        if (badCommit === '' || badCommit === undefined) {
            badCommit = null;
        }

        if (goodCommit === '' || goodCommit === undefined) {
            goodCommit = null;
        }

        // If it is a comparison bisect, add the description to the summary.
        if (isComparison) {
            if (bisectType === 'boot') {
                JSBase.replaceContentByID(
                    bisectElements.bisectCompareDescriptionID,
                    '<p>' + sprintf(bisectBootComparisonDescription, job) +
                    '</p>'
                );
            } else if (bisectType === 'build') {
                JSBase.replaceContentByID(
                    bisectElements.bisectCompareDescriptionID,
                    '<p>' + sprintf(bisectBuildComparisonDescription, job) +
                    '</p>'
                );
            } else {
                JSBase.removeElementByID(
                    bisectElements.bisectCompareDescriptionID);
            }
        }

        if (localLen === 0) {
            JSBase.removeElementByID(bisectElements.tableID);
            JSBase.replaceContentByID(
                bisectElements.contentDivID,
                '<div class="pull-center"><strong>' +
                'No bisect data available.<strong></div>'
            );
        } else {
            for (i; i < localLen; i = i + 1) {
                rowResult = parseBisectDataToRow(
                    localData[i], job, bisectType);

                tableRows += rowResult[0];
                if (rowResult[1] !== null) {
                    compareGoodCommits.push(rowResult[1]);
                }
            }

            fillBisectSummary(
                badCommit,
                goodCommit,
                bisectElements,
                bisectType,
                compareGoodCommits,
                isComparison
            );

            button = createShowHideButton(
                bisectElements.showHideID,
                bisectElements.contentDivID,
                'hide',
                compareTo
            );

            JSBase.replaceContentByID(bisectElements.showHideID, button);
            JSBase.replaceContentByID(bisectElements.tableBodyID, tableRows);

            if (localLen > bisectMaxElements) {
                createBisectShowHideButton(
                    localLen,
                    bisectElements.bisectShowHideID,
                    bisectElements.tableID,
                    isComparison);

                if (isComparison) {
                    $(JSBase.checkIfID(bisectCompareMinusButtonId))
                        .trigger('click');
                } else {
                    $(JSBase.checkIfID(bisectMinusButtonId)).trigger('click');
                }
            }
        }

        JSBase.removeElementByID(bisectElements.loadingDivID);
        JSBase.showElementByID(bisectElements.contentDivID);
    }

    return {
        BisectElements: BisectElements,
        bisectCompareShellScript: bisectCompareShellScript,
        bisectShellScript: bisectShellScript,
        initBisect: initBisect,
        showHideBisect: showHideBisect,
        showLessBisectRows: showLessBisectRows,
        showMoreBisectRows: showMoreBisectRows
    };
}());
