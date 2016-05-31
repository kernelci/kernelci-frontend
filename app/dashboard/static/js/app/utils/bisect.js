/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
        table: null
    };

    kciBisect.setup = function() {
        this.table = document.getElementById(this.tableID);
        return this;
    };

    kciBisect.createDefaultSummary = function(bad, good, type) {
        var aNode;
        var iNode;
        var spanNode;

        // The bad commit.
        spanNode = document.createElement('span');
        if (bad) {
            spanNode.className = 'text-danger';
            spanNode.appendChild(document.createTextNode(bad));
        } else {
            spanNode.className = 'text-warning';
            spanNode.appendChild(
                document.createTextNode('No bad commit found'));
        }

        html.replaceContent(
            document.getElementById(this.badCommitID), spanNode);

        // The good commit.
        spanNode = document.createElement('span');
        if (good) {
            spanNode.className = 'text-success';
            spanNode.appendChild(document.createTextNode(good));
        } else {
            spanNode.className = 'text-warning';
            spanNode.appendChild(
                document.createTextNode('No good commit found'));
        }

        html.replaceContent(
            document.getElementById(this.goodCommitID), spanNode);

        // The bisect script.
        if (bad && good) {
            html.removeClass(
                document.getElementById(this.bisectScriptContainerID),
                'hidden');

            spanNode = html.tooltip();

            aNode = document.createElement('a');
            aNode.setAttribute('download', 'bisect.sh');
            aNode.setAttribute('href', shellScript(bad, good));

            iNode = document.createElement('i');
            iNode.className = 'fa fa-download';

            aNode.appendChild(iNode);
            spanNode.appendChild(aNode);

            if (type === 'boot') {
                spanNode.setAttribute('title', 'Download boot bisect script');
            } else if (type === 'build') {
                spanNode.setAttribute('title', 'Download build bisect script');
            }

            html.replaceContent(
                document.getElementById(this.bisectScriptContentID),
                spanNode);
        } else {
            html.removeElement(
                document.getElementById(this.bisectScriptContainerID));
        }

        return this;
    };

    kciBisect.createComparedSummary = function(type, commits) {
        var aNode;
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

            spanNode = html.tooltip();

            iNode = document.createElement('i');
            iNode.className = 'fa fa-download';

            aNode = document.createElement('a');
            aNode.setAttribute('download', 'bisect-compared.sh');
            aNode.setAttribute(
                'href', shellScriptCompared(prevBadCommit, otherCommitsArray));

            aNode.appendChild(iNode);
            spanNode.appendChild(aNode);

            if (type === 'boot') {
                spanNode.setAttribute(
                    'title', 'Download boot bisect comparison script');
            } else {
                spanNode.setAttribute(
                    'title', 'Download build bisect comparison script');
            }

            html.replaceContent(
                document.getElementById(this.bisectScriptContentID), spanNode);
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

    // TODO: rework using DocumentFragment.
    kciBisect.parseData = function(data, type, job) {
        var aNode;
        var bisectStatus;
        var board;
        var cellNode;
        var defconfigFull;
        var docId;
        var gitCommit;
        var gitDescribe;
        var gitURL;
        var gitURLs;
        var goodCommit;
        var lab;
        var rowNode;
        var spanNode;
        var tooltipNode;

        gitDescribe = data.git_describe;
        defconfigFull = data.defconfig_full;
        gitCommit = data.git_commit;
        gitURL = data.git_url;

        if (type === 'boot') {
            board = data.board;
            lab = data.lab_name;
            docId = data.boot_id.$oid;
        } else {
            docId = data._id.$oid;
        }

        if (data.hasOwnProperty('status')) {
            bisectStatus = data.status;
        } else {
            bisectStatus = data.boot_status;
        }

        if (gitCommit) {
            rowNode = this.table.tBodies[0].insertRow();

            aNode = document.createElement('a');
            aNode.appendChild(document.createTextNode(gitDescribe));

            tooltipNode = html.tooltip();
            html.addClass(tooltipNode, 'bisect-tooltip');

            if (type === 'boot') {
                aNode.setAttribute(
                    'href',
                    '/boot/' + board + '/job/' + job +
                    '/kernel/' + gitDescribe + '/defconfig/' +
                    defconfigFull + '/lab/' + lab +
                    '/?_id=' + docId
                );

                tooltipNode.setAttribute(
                    'title',
                    sprintf(gStrings.boot_tooltip, job, gitDescribe));
            } else {
                aNode.setAttribute(
                    'href',
                    '/build/' + job + '/kernel/' +
                    gitDescribe + '/defconfig/' + defconfigFull +
                    '/?_id=' + docId
                );

                tooltipNode.setAttribute(
                    'title',
                    sprintf(gStrings.build_tooltip, job, gitDescribe));
            }

            spanNode = document.createElement('span');
            spanNode.className = 'bisect-text';
            spanNode.appendChild(aNode);

            tooltipNode.appendChild(spanNode);

            cellNode = rowNode.insertCell();
            cellNode.appendChild(tooltipNode);

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            aNode = document.createElement('a');
            aNode.setAttribute('href', gitURLs[1]);
            aNode.appendChild(document.createTextNode(gitCommit));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());

            switch (bisectStatus) {
                case 'PASS':
                    goodCommit = data;
                    // Bad cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-danger';
                    // Unknown cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-warning';
                    // Good cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-success';
                    cellNode.appendChild(aNode);
                    break;
                case 'FAIL':
                    // Bad cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-danger';
                    cellNode.appendChild(aNode);
                    // Unknown cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-warning';
                    // Good cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-success';
                    break;
                default:
                    // Bad cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-danger';
                    // Unknown cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-warning';
                    cellNode.appendChild(aNode);
                    // Good cell.
                    cellNode = rowNode.insertCell();
                    cellNode.className = 'bg-success';
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
            goodCommit = this.parseData(data, bisectType, job);
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
            bisectData.forEach(_parseData.bind(this));

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
                divNode = document.createElement('div');
                divNode.className = 'pull-right bisect-back';

                spanNode = html.tooltip();
                spanNode.setAttribute('title', 'Go back to bisect summary');

                smallNode = document.createElement('small');
                aNode = document.createElement('a');
                aNode.setAttribute('href', '#' + this.contentDivID);
                aNode.appendChild(document.createTextNode('Back to Summary'));

                smallNode.appendChild(aNode);
                spanNode.appendChild(smallNode);
                divNode.appendChild(spanNode);

                html.replaceContent(
                    document.getElementById(this.bisectShowHideID),
                    btns.plusMinButton(
                        bisectLength, this.tableID, this.isCompared)
                );

                document.getElementById(this.tableDivID)
                    .appendChild(divNode);
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
