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

    // Fill up the bisect summary element in a page.
    // `badCommit`: The bad commit value.
    // `goodCommit`: The good commit value.
    // `badCommitEl`: The DOM element ID where the bad commit should be shown.
    // `goodCommitEl`: The DOM element ID where the good commit should be shown.
    // `bisectScriptEl`: The DOM element ID where the bisect script should be
    // placed.
    // `bisectScriptElContainer`: The DOM element ID that contains the bisect
    // script.
    function fillBisectSummary(
        badCommit,
        goodCommit,
        badCommitEl,
        goodCommitEl,
        bisectScriptEl,
        bisectScriptElContainer)
    {
        if (badCommit !== null) {
            JSBase.replaceContentByID(
                badCommitEl,
                '<span class="text-danger">' + badCommit + '</span>'
            );
        } else {
            JSBase.replaceContentByID(
                badCommitEl,
                '<span class="text-warning">' +
                'No corresponding bad commit found</span>'
            );
        }
        if (goodCommit !== null) {
            JSBase.replaceContentByID(
                goodCommitEl,
                '<span class="text-success">' + goodCommit + '</span>'
            );
        } else {
            JSBase.replaceContentByID(
                goodCommitEl,
                '<span class="text-warning">No good commit found</span>'
            );
        }

        if (badCommit !== null && goodCommit !== null) {
            JSBase.removeCssClassForID('hidden');
            JSBase.replaceContentByID(
                bisectScriptEl,
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Download boot bisect script">' +
                '<a download="bisect.sh" href="' +
                bisectShellScript(badCommit, goodCommit) +
                '"><i class="fa fa-download"></i></a></span>'
            );
        } else {
            JSBase.removeContentByID(bisectScriptElContainer);
        }
    }

    function createBisectTableRow(bisectData, job) {
        var status = bisectData.boot_status,
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
            row = '<tr></tr>';

        if (gitCommit === '' || gitCommit === undefined) {
            gitCommit = null;
        }

        if (gitCommit !== null) {
            tooltipLink = '<a href="/boot/all/job/' + job +
                '/kernel/' + gitDescribeVal + '">' +
                gitDescribeVal + '</a>';

            tooltipTitle = 'Boot report details for&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + gitDescribeVal;

            gitDescribeCell = '<td><span class="bisect-tooltip">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="' + tooltipTitle + '">' +
                '<span class="bisect-text">' + tooltipLink +
                '</span></span></span></td>';

            gitURLs = JSBase.translateCommitURL(
                gitURL, gitCommit);

            switch (status) {
                case 'PASS':
                    goodCommitCell = '<td class="bg-success">' +
                        '<a href="' + gitURLs[1] + '">' + gitCommit +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></td>';
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                case 'FAIL':
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = '<td class="bg-danger"><a href="' +
                        gitURLs[1] + '">' + gitCommit +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></td>';
                    unknownCommitCell = '<td class="bg-warning"></td>';
                    break;
                default:
                    goodCommitCell = '<td class="bg-success"></td>';
                    badCommitCell = '<td class="bg-danger"></td>';
                    unknownCommitCell = '<td class="bg-warning">' +
                        '<a href="' +
                        gitURLs[1] + '">' + gitCommit +
                        '&nbsp;<i class="fa fa-external-link">' +
                        '</i></a></td>';
                    break;
            }

            row = '<tr>' + gitDescribeCell + badCommitCell +
                unknownCommitCell + goodCommitCell + '</tr>';
        }

        return row;
    }

    // Populate a bisect table based on the provided DOM elements.
    // `data`: The bisect JSON data to analyze.
    function fillBisectTable(
        data,
        tableElementDiv,
        tableElementID,
        tableBodyElement,
        contentElement,
        loadingContentDiv,
        loadingContentElement,
        loadingText,
        showSummary,
        badCommitElement,
        goodCommitElement,
        bisectScriptElement,
        bisectScriptContainerElement)
    {
        JSBase.replaceContentByID(loadingContentElement, loadingText);

        var localResult = data.result[0],
            localData = localResult.bisect_data,
            localLen = localData.length,
            i = 0,
            tableRows = '',
            job = null,
            badCommit = null,
            goodCommit = null;

        job = localResult.compare_to;
        badCommit = localResult.bad_commit;
        goodCommit = localResult.good_commit;

        if (job === null || job === undefined || job === '') {
            job = localResult.job;
        }

        if (badCommit === '' || badCommit === undefined) {
            badCommit = null;
        }

        if (goodCommit === '' || goodCommit === undefined) {
            goodCommit = null;
        }

        if (showSummary && badCommit === null && goodCommit === null) {
            JSBase.removeContentByID(loadingContentDiv);
            JSBase.removeContentByID(tableElementDiv);
            JSBase.replaceContentByID(
                contentElement,
                '<div class="pull-center">' +
                '<strong>No valid bisect data found.</strong></div>'
            );
            JSBase.showContentByID(contentElement);
        } else {
            if (localLen === 0) {
                JSBase.removeContentByID(loadingContentDiv);
                JSBase.removeContentByID(tableElementID);
                JSBase.replaceContentByID(
                    tableElementDiv,
                    '<div class="pull-center">' +
                    '<strong>' +
                    'No bisect data available to compare with.<strong>' +
                    '</div>'
                );
                JSBase.showContentByID(contentElement);
            } else {
                for (i; i < localLen; i = i + 1) {
                    tableRows += createBisectTableRow(localData[i], job);
                }

                if (showSummary) {
                    fillBisectSummary(
                        badCommit,
                        goodCommit,
                        badCommitElement,
                        goodCommitElement,
                        bisectScriptElement,
                        bisectScriptContainerElement
                    );
                }

                JSBase.removeContentByID(loadingContentDiv);
                JSBase.replaceContentByID(tableBodyElement, tableRows);
                JSBase.showContentByID(contentElement);
            }
        }
    }

    return {
        bisectShellScript: bisectShellScript,
        fillBisectTable: fillBisectTable
    };
}());
