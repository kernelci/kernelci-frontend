/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
define([
    'utils/html',
    'buttons/bisect',
    'utils/urls',
    'sprintf'
], function(html, btns, urls) {
    'use strict';
    var gMaxElements;
    var gStrings;
    var kciBisect;

    // How many rows are too many?
    gMaxElements = 6;
    gStrings = {
        boot_compare_description: 'The comparison with the ' +
            '&#171;%s&#187; tree is based on the boot reports with the same ' +
            'board, lab name, architecture and defconfig values.',
        build_compare_description: 'The comparison with the ' +
            '&#171;%s&#187; tree is based on the build reports with the ' +
            'same architecture and defconfig values.',
        boot_tooltip: 'Boot report details for %s &dash; %s',
        build_tooltip: 'Build details for %s &dash; %s'
    };

    /**
     * Create a shell script for git bisection.
     *
     * @private
     * @param {String} bad: The starting point of the bisect script.
     * @param {String} good: The good commit.
     * @return {String} The script as an encoded URI.
    **/
    function shellScript(bad, good) {
        var script;

        if (bad !== null && good !== null) {
            script = '#!/bin/bash\n';
            script += 'git bisect start ' + bad + ' ' + good + '\n';
        } else {
            script = '';
        }

        return 'data:text/plain;charset=UTF-8,' + encodeURIComponent(script);
    }

    /**
     * Create a shell script for git bisection (compared case).
     *
     * @private
     * @param {String} bad: The starting point of the bisect script.
     * @param {Array} good: List of good commits.
     * @return {String} The script as an encoded URI.
    **/
    function shellScriptCompared(bad, good) {
        var script;

        if (bad !== null && good.length > 0) {
            script = '#!/bin/bash\ngit bisect start\n';
            script += 'git bisect bad ' + bad + '\n';

            good.forEach(function(commit) {
                script += 'git bisect good ' + commit + '\n';
            });
        } else {
            script = '';
        }

        return 'data:text/plain;charset=UTF-8,' + encodeURIComponent(script);
    }

    function _bindShowLess(element) {
        element.addEventListener('click', btns.lessRowsEvent);
    }

    function _bindShowMore(element) {
        element.addEventListener('click', btns.moreRowsEvent);
    }

    function _bindBisect(element) {
        element.addEventListener('click', btns.showHideEvent);
    }

    function bindEvents() {
        Array.prototype.forEach.call(
            document.getElementsByClassName('bisect-pm-btn-less'),
            _bindShowLess);

        Array.prototype.forEach.call(
            document.getElementsByClassName('bisect-pm-btn-more'),
            _bindShowMore);

        Array.prototype.forEach.call(
            document.getElementsByClassName('bisect-click-btn'), _bindBisect);
    }

    kciBisect = {
        data: null,
        isCompared: false,
        table: null,
        tableRows: []
    };

    kciBisect.setup = function() {
        this.table = document.getElementById(this.tableID);
        return this;
    };

    kciBisect.createDefaultSummary = function(bad, good, type) {
        var aNode;
        var docFrag;
        var iNode;
        var spanNode;

        // The bad commit.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));
        if (bad) {
            spanNode.className = 'text-danger';
            spanNode.appendChild(document.createTextNode(bad));
        } else {
            spanNode.className = 'text-warning';
            spanNode.appendChild(
                document.createTextNode('No bad commit found'));
        }

        html.replaceContent(
            document.getElementById(this.badCommitID), docFrag);

        // The good commit.
        docFrag = document.createDocumentFragment();
        spanNode = docFrag.appendChild(document.createElement('span'));
        if (good) {
            spanNode.className = 'text-success';
            spanNode.appendChild(document.createTextNode(good));
        } else {
            spanNode.className = 'text-warning';
            spanNode.appendChild(
                document.createTextNode('No good commit found'));
        }

        html.replaceContent(
            document.getElementById(this.goodCommitID), docFrag);

        // The bisect script.
        if (bad && good) {
            html.removeClass(
                document.getElementById(this.bisectScriptContainerID),
                'hidden');

            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(html.tooltip());

            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('download', 'bisect.sh');
            aNode.setAttribute('href', shellScript(bad, good));

            iNode = aNode.appendChild(document.createElement('i'));
            iNode.className = 'fa fa-download';

            if (type === 'boot') {
                spanNode.setAttribute('title', 'Download boot bisect script');
            } else if (type === 'build') {
                spanNode.setAttribute('title', 'Download build bisect script');
            }

            html.replaceContent(
                document.getElementById(this.bisectScriptContentID), docFrag);
        } else {
            html.removeElement(
                document.getElementById(this.bisectScriptContainerID));
        }

        return this;
    };

    kciBisect.createComparedSummary = function(type, commits) {
        var aNode;
        var docFrag;
        var iNode;
        var otherCommitDate;
        var otherCommitsArray;
        var prevBadCommit;
        var prevCommitInserted;
        var prevData;
        var prevGoodCommit;
        var prevGoodCommitDate;
        var spanNode;

        otherCommitsArray = [];

        if (commits.length > 0) {
            prevData = this.prevBisect;
            prevBadCommit = prevData.bad_commit;
            prevGoodCommit = prevData.good_commit;

            if (prevGoodCommit) {
                prevGoodCommitDate = new Date(prevData.good_commit_date.$date);
            }

            commits.forEach(function(commit) {
                if (type === 'boot') {
                    otherCommitDate = new Date(commit.boot_created_on.$date);
                } else {
                    otherCommitDate = new Date(commit.created_on.$date);
                }

                if (!prevCommitInserted && prevGoodCommitDate &&
                        prevGoodCommitDate < otherCommitDate) {
                    otherCommitsArray.push(prevGoodCommit);
                    otherCommitsArray.push(commit.git_commit);
                    prevCommitInserted = true;
                } else {
                    otherCommitsArray.push(commit.git_commit);
                }
            });

            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(html.tooltip());

            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('download', 'bisect-compared.sh');
            aNode.setAttribute(
                'href', shellScriptCompared(prevBadCommit, otherCommitsArray));

            iNode = aNode.appendChild(document.createElement('i'));
            iNode.className = 'fa fa-download';

            if (type === 'boot') {
                spanNode.setAttribute(
                    'title', 'Download boot bisect comparison script');
            } else {
                spanNode.setAttribute(
                    'title', 'Download build bisect comparison script');
            }

            html.replaceContent(
                document.getElementById(this.bisectScriptContentID), docFrag);
            html.removeClass(
                document.getElementById(this.bisectScriptContainerID),
                'hidden');
        } else {
            html.removeElement(
                document.getElementById(this.bisectScriptContainerID));
        }

        return this;
    };

    kciBisect.createSummary = function(bad, good, type, commits) {
        if (this.isCompared) {
            this.createComparedSummary(type, commits);
        } else {
            this.createDefaultSummary(bad, good, type);
        }
        return this;
    };

    kciBisect.parseData = function(data, type, job) {
        var aNode;
        var badCell;
        var bisectStatus;
        var board;
        var cellNode;
        var defconfigFull;
        var docFrag;
        var docId;
        var gitCommit;
        var gitDescribe;
        var gitURL;
        var gitURLs;
        var goodCell;
        var goodCommit;
        var lab;
        var rowNode;
        var spanNode;
        var tooltipNode;
        var unknownCell;

        gitDescribe = data.git_describe;
        defconfigFull = data.defconfig_full;
        gitCommit = data.git_commit;
        gitURL = data.git_url;

        if (type === 'boot') {
            board = data.board;
            lab = data.lab_name;
            if (data.hasOwnProperty('boot_id')) {
                // backwards compatibility
                docId = data.boot_id.$oid;
            } else {
                docId = data._id.$oid;
            }
        } else {
            docId = data._id.$oid;
        }

        if (data.hasOwnProperty('status')) {
            bisectStatus = data.status;
        } else {
            bisectStatus = data.boot_status;
        }

        if (gitCommit) {
            // this.tableRows is a DocumentFragment.
            rowNode = this.tableRows.appendChild(document.createElement('tr'));

            // The git describe table cell.
            cellNode = rowNode.appendChild(document.createElement('td'));

            // The commit cells.
            badCell = rowNode.appendChild(document.createElement('td'));
            badCell.className = 'bg-danger';

            unknownCell = rowNode.appendChild(document.createElement('td'));
            unknownCell.className = 'bg-warning';

            goodCell = rowNode.appendChild(document.createElement('td'));
            goodCell.className = 'bg-success';

            // The git describe value.
            tooltipNode = cellNode.appendChild(html.tooltip());
            html.addClass(tooltipNode, 'bisect-tooltip');

            spanNode = tooltipNode.appendChild(document.createElement('span'));
            spanNode.className = 'bisect-text';

            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.appendChild(document.createTextNode(gitDescribe));

            if (type === 'boot') {
                tooltipNode.setAttribute(
                    'title',
                    sprintf(gStrings.boot_tooltip, job, gitDescribe));
            } else {
                aNode.setAttribute('href', '/build/id/' + docId + '/');

                tooltipNode.setAttribute(
                    'title',
                    sprintf(gStrings.build_tooltip, job, gitDescribe));
            }

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // The git commit value.
            docFrag = document.createDocumentFragment();
            aNode = docFrag.appendChild(document.createElement('a'));
            aNode.setAttribute('href', gitURLs[1]);
            aNode.appendChild(document.createTextNode(gitCommit));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            switch (bisectStatus) {
                case 'PASS':
                    goodCommit = data;
                    goodCell.appendChild(docFrag);
                    break;
                case 'FAIL':
                    badCell.appendChild(docFrag);
                    break;
                default:
                    unknownCell.appendChild(docFrag);
                    break;
            }
        }

        return goodCommit;
    };

    kciBisect.draw = function() {
        var aNode;
        var bisectData;
        var bisectLength;
        var bisectType;
        var compareGoodCommits;
        var compareTo;
        var divNode;
        var docFrag;
        var goodCommit;
        var job;
        var pNode;
        var result;
        var smallNode;
        var spanNode;

        result = this.data.result[0];
        bisectType = result.type;
        bisectData = result.bisect_data;
        bisectLength = bisectData.length;
        // Contains the good commit for comparison purposes.
        compareGoodCommits = [];

        html.replaceContentHTML(
            document.getElementById(this.loadingContentID),
            this.loadingContentText);

        // Internal wrapper to bind 'this'.
        function _parseData(data) {
            goodCommit = this.parseData(data, bisectType, job); // jshint ignore:line
            if (goodCommit) {
                compareGoodCommits.push(goodCommit);
            }
        }

        if (this.isCompared) {
            job = result.compare_to;
            compareTo = job;

            // Add the description to the summary.
            pNode = document.createElement('p');
            if (bisectType === 'boot') {
                pNode.insertAdjacentHTML(
                    'beforeend',
                    sprintf(gStrings.boot_compare_description, job));
            } else {
                pNode.insertAdjacentHTML(
                    'beforeend',
                    sprintf(gStrings.build_compare_description, job));
            }

            html.replaceContent(
                document.getElementById(this.bisectCompareDescriptionID),
                pNode);
        } else {
            job = result.job;
            compareTo = null;
        }

        if (bisectLength === 0) {
            html.removeElement(document.getElementById(this.tableID));
            html.replaceContent(
                document.getElementById(this.contentDivID),
                html.errorDiv('No bisect data available'));
        } else {
            // Initialize the table rows as a DocumentFragment.
            this.tableRows = document.createDocumentFragment();
            bisectData.forEach(_parseData.bind(this));
            // Now append all the rows to the table.
            this.table.tBodies[0].appendChild(this.tableRows);

            // Create the bisect summary.
            this.createSummary(
                result.bad_commit,
                result.good_commit, bisectType, compareGoodCommits);

            html.replaceContent(
                document.getElementById(this.showHideID),
                btns.showHideButton(
                    this.showHideID, this.contentDivID, 'hide', compareTo)
                );

            if (bisectLength > gMaxElements) {
                docFrag = document.createDocumentFragment();
                divNode = docFrag.appendChild(document.createElement('div'));
                divNode.className = 'pull-right bisect-back';

                spanNode = divNode.appendChild(html.tooltip());
                spanNode.setAttribute('title', 'Go back to bisect summary');

                smallNode = spanNode.appendChild(
                    document.createElement('small'));

                aNode = smallNode.appendChild(document.createElement('a'));
                aNode.setAttribute('href', '#' + this.contentDivID);
                aNode.appendChild(document.createTextNode('Back to Summary'));

                html.replaceContent(
                    document.getElementById(this.bisectShowHideID),
                    btns.plusMinButton(
                        bisectLength, this.tableID, this.isCompared)
                );

                document.getElementById(this.tableDivID)
                    .appendChild(docFrag);
            }

            setTimeout(bindEvents, 0);
            if (bisectLength > gMaxElements) {
                var self = this;
                setTimeout(function() {
                    btns.minusClick(self.isCompared);
                }, 0);
            }
        }

        html.removeElement(document.getElementById(this.loadingDivID));
        html.removeClass(
            document.getElementById(this.contentDivID), 'hidden');

        return this;
    };

    var gBisect = function(settings) {
        var key;
        var newObject;

        newObject = Object.create(kciBisect);
        if (settings) {
            for (key in settings) {
                if (settings.hasOwnProperty(key)) {
                    newObject[key] = settings[key];
                }
            }
        } else {
            throw 'No settings provided';
        }

        return newObject.setup();
    };

    return gBisect;
});
