/*! Kernel CI Dashboard v2015.8.2 | Licensed under the GNU GPL v3 (or later) */
define([
    'sprintf',
    'utils/base',
    'utils/urls',
    'utils/show-hide-btns'
], function(p, b, u, btns) {
    'use strict';
    var bisect,
        bisectBootComparisonDescription,
        bisectBuildComparisonDescription,
        bisectScriptElementF,
        bootTooltipTitleF,
        buildTooltipTitleF,
        commitCellF,
        // How many rows are too many?
        bisectMaxElements = 6;

    bisectBootComparisonDescription = 'The comparison with the ' +
        '&#171;%s&#187; tree is based on the boot reports with the same ' +
        'board, lab name, architecture and defconfig values.';
    bisectBuildComparisonDescription = 'The comparison with the ' +
        '&#171;%s&#187; tree is based on the build reports with the same ' +
        'architecture and defconfig values.';
    bootTooltipTitleF = 'Boot report details for %s &dash; %s';
    commitCellF = '<td class="%s"><a href="%s">%s&nbsp;' +
        '<i class="fa fa-external-link"></i></a></td>';
    bisectScriptElementF = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="%s"><a download="%s" href="%s">' +
        '<i class="fa fa-download"></i></a></span>';
    buildTooltipTitleF = 'Build details for %s &dash; %s';

    // Create a simple bash script for git bisection.
    // `bad`: The starting point for the bisect script.
    // `good`: The end point.
    function bisectShellScript(bad, good) {
        var bisectScript = '';
        if (bad !== null && good !== null) {
            bisectScript = '#!/bin/bash\n';
            bisectScript += 'git bisect start ' + bad + ' ' + good + '\n';
        }
        return 'data:text/plain;charset=UTF-8,' +
            encodeURIComponent(bisectScript);
    }

    // Create a bash script for git bisection for the compared one.
    // `bad`: The starting point for the bisect script.
    // `good`: The list of good commits.
    function bisectCompareShellScript(bad, good) {
        var bisectScript = '';
        if (bad !== null && good.length > 0) {
            bisectScript = '#!/bin/bash\ngit bisect start\n';
            bisectScript += 'git bisect bad ' + bad + '\n';
            good.forEach(function(element) {
                bisectScript += 'git bisect good ' + element + '\n';
            });
        }
        return 'data:text/plain;charset=UTF-8,' +
            encodeURIComponent(bisectScript);
    }

    function defaultBisectSummary(bad, good, elements, type) {
        if (bad !== null) {
            b.replaceById(
                elements.badCommitID,
                '<span class="text-danger">' + bad + '</span>');
        } else {
            b.replaceById(
                elements.badCommitID,
                '<span class="text-warning">No bad commit found</span>');
        }
        if (good !== null) {
            b.replaceById(
                elements.goodCommitID,
                '<span class="text-success">' + good + '</span>');
        } else {
            b.replaceById(
                elements.goodCommitID,
                '<span class="text-warning">No good commit found</span>');
        }

        if (bad !== null && good !== null) {
            b.removeClass(elements.bisectScriptContainerID, 'hidden');
            if (type === 'boot') {
                b.replaceById(
                    elements.bisectScriptContentID,
                    p.sprintf(
                        bisectScriptElementF,
                        'Download boot bisect script',
                        'bisect.sh',
                        bisectShellScript(bad, good)
                    )
                );
            } else if (type === 'build') {
                b.replaceById(
                    elements.bisectScriptContentID,
                    p.sprintf(
                        bisectScriptElementF,
                        'Download build bisect script',
                        'bisect.sh',
                        bisectShellScript(bad, good)
                    )
                );
            }
        } else {
            b.removeElement(elements.bisectScriptContainerID);
        }
    }

    function dataToRow(bisectData, job, bisectType) {
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
            goodCommit = null,
            board = null,
            lab = null,
            defconfigFull = null,
            docId = null;

        defconfigFull = bisectData.defconfig_full;
        if (bisectType === 'boot') {
            board = bisectData.board;
            lab = bisectData.lab_name;
            docId = bisectData.boot_id.$oid;
        } else {
            docId = bisectData._id.$oid;
        }

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
                tooltipLink = '<a href="/boot/' + board + '/job/' + job +
                    '/kernel/' + gitDescribeVal + '/defconfig/' +
                    defconfigFull + '/lab/' + lab +
                    '/?_id=' + docId + '">' + gitDescribeVal + '</a>';
                tooltipTitle = p.sprintf(
                    bootTooltipTitleF, job, gitDescribeVal);
            } else if (bisectType === 'build') {
                tooltipLink = '<a href="/build/' + job + '/kernel/' +
                    gitDescribeVal + '/defconfig/' + defconfigFull +
                    '/?_id=' + docId + '">' + gitDescribeVal + '</a>';
                tooltipTitle = p.sprintf(
                    buildTooltipTitleF, job, gitDescribeVal);
            } else {
                tooltipLink = gitDescribeVal;
            }

            gitDescribeCell = '<td><span class="bisect-tooltip"> ' +
                '<span rel="tooltip" data-toggle="tooltip" title="' +
                tooltipTitle + '"><span class="bisect-text">' + tooltipLink +
                '</span></span></span></td>';

            gitURLs = u.translateCommit(gitURL, gitCommit);

            switch (bisectStatus) {
                case 'PASS':
                    goodCommit = bisectData;
                    goodCommitCell = p.sprintf(
                        commitCellF, 'bg-success', gitURLs[1], gitCommit);
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                case 'FAIL':
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = p.sprintf(
                        commitCellF, 'bg-danger', gitURLs[1], gitCommit);
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                default:
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = p.sprintf(
                        commitCellF, 'bg-warning', gitURLs[1], gitCommit);
                    break;
            }

            row = '<tr>' + gitDescribeCell + badCommitCell +
                unknownCommitCell + goodCommitCell + '</tr>';
        }

        return [row, goodCommit];
    }

    function comparedBisectSummary(elements, type, comparedCommits) {
        var prevData = null,
            prevBadCommit = null,
            prevGoodCommit = null,
            prevGoodCommitDate = null,
            otherCommitDate = null,
            otherCommitsArray = [],
            prevCommitInserted = false;

        if (comparedCommits.length > 0) {
            prevData = elements.prevBisect;
            prevBadCommit = prevData.bad_commit;
            prevGoodCommit = prevData.good_commit;

            if (prevGoodCommit !== null) {
                prevGoodCommitDate = new Date(prevData.good_commit_date.$date);
            }

            comparedCommits.forEach(function(element) {
                if (type === 'boot') {
                    otherCommitDate = new Date(element.boot_created_on.$date);
                } else if (type === 'build') {
                    otherCommitDate = new Date(element.created_on.$date);
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

            if (type === 'boot') {
                b.replaceById(
                    elements.bisectScriptContentID,
                    p.sprintf(
                        bisectScriptElementF,
                        'Download boot bisect comparison script',
                        'bisect-compared.sh',
                        bisectCompareShellScript(
                            prevBadCommit, otherCommitsArray)
                    )
                );
            } else if (type === 'build') {
                b.replaceById(
                    elements.bisectScriptContentID,
                    p.sprintf(
                        bisectScriptElementF,
                        'Download build bisect comparison script',
                        'bisect-compared.sh',
                        bisectCompareShellScript(
                            prevBadCommit, otherCommitsArray)
                    )
                );
            }
            b.removeClass(elements.bisectScriptContainerID, 'hidden');
        } else {
            b.removeElement(elements.bisectScriptContainerID);
        }
    }

    function bisectSummary(
            bad, good, elements, type, comparedCommits, compared) {
        if (compared) {
            comparedBisectSummary(elements, type, comparedCommits);
        } else {
            defaultBisectSummary(bad, good, elements, type);
        }
    }

    bisect = function(data, elements, compared) {
        var result = data.result[0],
            localData = result.bisect_data,
            dataLen = localData.length,
            idx = 0,
            tableRows = '',
            bisectType = null,
            job = null,
            compareTo = null,
            badCommit = null,
            goodCommit = null,
            rowResult = null,
            button = null,
            // Contains the good commit for comparison purposes.
            compareGoodCommits = [];

        b.replaceById(elements.loadingContentID, elements.loadingContentText);

        badCommit = result.bad_commit;
        goodCommit = result.good_commit;
        bisectType = result.type;

        if (compared) {
            job = result.compare_to;
            compareTo = job;
        } else {
            job = result.job;
        }

        if (badCommit === '' || badCommit === undefined) {
            badCommit = null;
        }

        if (goodCommit === '' || goodCommit === undefined) {
            goodCommit = null;
        }

        // If it is a comparison bisect, add the description to the summary.
        if (compared) {
            if (bisectType === 'boot') {
                b.replaceById(
                    elements.bisectCompareDescriptionID,
                    '<p>' + p.sprintf(bisectBootComparisonDescription, job) +
                    '</p>'
                );
            } else if (bisectType === 'build') {
                b.replaceById(
                    elements.bisectCompareDescriptionID,
                    '<p>' + p.sprintf(bisectBuildComparisonDescription, job) +
                    '</p>'
                );
            } else {
                b.removeElement(elements.bisectCompareDescriptionID);
            }
        }

        if (dataLen === 0) {
            b.removeElement(elements.tableID);
            b.replaceById(
                elements.contentDivID,
                '<div class="pull-center"><strong>' +
                'No bisect data available.<strong></div>'
            );
        } else {
            for (idx; idx < dataLen; idx = idx + 1) {
                rowResult = dataToRow(localData[idx], job, bisectType);
                tableRows += rowResult[0];
                if (rowResult[1] !== null) {
                    compareGoodCommits.push(rowResult[1]);
                }
            }

            bisectSummary(
                badCommit,
                goodCommit,
                elements, bisectType, compareGoodCommits, compared
            );

            button = btns.createShowHideBisectBtn(
                elements.showHideID, elements.contentDivID, 'hide', compareTo);

            b.replaceById(elements.showHideID, button);
            b.replaceById(elements.tableBodyID, tableRows);

            if (dataLen > bisectMaxElements) {
                button = btns.createPlusMinBisectBtn(
                    dataLen, elements.tableID, compared);

                b.replaceById(elements.bisectShowHideID, button);
                b.addContent(
                    elements.tableDivID,
                    '<div class="pull-right bisect-back">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Go back to bisect summary">' +
                    '<small><a href="#' +
                    elements.contentDivID +
                    '">Back to Summary</a></small></span></div>'
                );
            }
        }
        b.removeElement(elements.loadingDivID);
        b.removeClass(elements.contentDivID, 'hidden');
    };

    return bisect;
});
