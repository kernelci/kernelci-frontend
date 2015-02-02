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
        BisectElements;

    // Object prototype that should be passed to fillBisctTable function.
    BisectElements = {
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
        prevBisect: null
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
        'board, lab name and defconfig values.';
    bisectBuildComparisonDescription = 'The comparison with the ' +
        '&#171;%s&#187; tree is based on the build reports with the same ' +
        'defconfig value.';

    bisectScriptElementF = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="%s"><a download="%s" href="%s">' +
        '<i class="fa fa-download"></i></a></span>';

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
                        element.defconfig_created.$date);
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
    // `isBisectComparison`: If this is for a comparison bisect or not.
    function fillBisectSummary(
        badCommit,
        goodCommit,
        bisectElements,
        bisectType,
        compareGoodCommits,
        isBisectComparison)
    {
        if (isBisectComparison) {
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

    // Populate a bisect table based on the provided DOM elements.
    // `bisectData`: The bisect JSON data to analyze.
    // `bisectElements`: The BisectElements data structure that contains the
    // DOM element IDs and other necessary data.
    // `isBisectComparison`: If the bisect is a comparison one or not.
    function fillBisectTable(bisectData, bisectElements, isBisectComparison) {
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
            badCommit = null,
            goodCommit = null,
            rowResult = null,
            // Contain the good commits for comparison purposes.
            compareGoodCommits = [];

        badCommit = localResult.bad_commit;
        goodCommit = localResult.good_commit;
        bisectType = localResult.type;

        // Retrieve the job value in case the 'compare_to' field is empty.
        // It is empty in the case of a normal bisect.
        if (isBisectComparison) {
            job = localResult.compare_to;
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
        if (isBisectComparison) {
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
                isBisectComparison
            );

            JSBase.replaceContentByID(bisectElements.tableBodyID, tableRows);
        }

        JSBase.removeElementByID(bisectElements.loadingDivID);
        JSBase.showElementByID(bisectElements.contentDivID);
    }

    return {
        BisectElements: BisectElements,
        bisectCompareShellScript: bisectCompareShellScript,
        bisectShellScript: bisectShellScript,
        fillBisectTable: fillBisectTable
    };
}());
