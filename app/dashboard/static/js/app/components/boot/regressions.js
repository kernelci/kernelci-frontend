/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
    'utils/html',
    'utils/urls',
    'components/boot/common'
], function(html, urls, common) {
    'use strict';
    var gBootRegressionsView;
    var gFileServer;

    gBootRegressionsView = {};

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }

    function failingSince(firstFail, lastFail) {
        var days;
        var elapsed;
        var firstDate;
        var hours;
        var lastDate;
        var minutes;
        var rem;
        var sinceStr;

        sinceStr = '(';

        firstDate = new Date(firstFail.$date);
        lastDate = new Date(lastFail.$date);

        elapsed = (lastDate - firstDate) / 1000;

        hours = Math.floor(elapsed / 3600);
        minutes = elapsed % 3600;

        if (hours > 0) {
            days = Math.floor(hours / 24);
            rem = hours % 24;

            if (days > 0) {
                if (days === 1) {
                    sinceStr += '1 day';
                } else {
                    sinceStr += days;
                    sinceStr += ' days';
                }

                sinceStr += ' ';
            }

            if (rem > 0) {
                if (rem === 1) {
                    sinceStr += '1 hour';
                } else {
                    sinceStr += rem;
                    sinceStr += ' hours';
                }

                sinceStr += ' ';
            }
        }

        if (minutes > 0) {
            minutes = Math.floor(minutes / 60);
            if (minutes === 1) {
                sinceStr += '1 minute';
            } else {
                sinceStr += minutes;
                sinceStr += ' minutes';
            }
        }

        sinceStr.trim();
        sinceStr += ')';

        return sinceStr;
    }

    gBootRegressionsView.createPanel = function(data, index, type) {
        var aNode;
        var arch;
        var board;
        var bootPanel;
        var colNode;
        var collapseBodyNode;
        var collapseId;
        var collapseNode;
        var dNode;
        var defconfigFull;
        var divNode;
        var dlNode;
        var docFrag;
        var failBootURL;
        var failBuildURL;
        var failRegr;
        var gitCommit;
        var gitURL;
        var gitURLs;
        var hNode;
        var headingNode;
        var htmlLog;
        var labName;
        var panelBody;
        var panelHead;
        var panelNode;
        var passRegr;
        var rowNode;
        var serverURL;
        var smallNode;
        var spanNode;
        var statusNode;
        var tooltipNode;
        var translatedURI;
        var txtLog;

        arch = data.arch;
        board = data.board;
        labName = data.lab_name;
        failRegr = data.fail;
        passRegr = data.pass;
        defconfigFull = data.defconfig_full;

        failBuildURL = urls
            .createPathHref(['/build/id/', failRegr.build_id.$oid, '/']);

        failBootURL = urls
            .createPathHref(['/boot/id/', failRegr._id.$oid, '/']);

        docFrag = document.createDocumentFragment();

        statusNode = html.fail();
        html.addClass(statusNode.firstElementChild, 'pull-right');

        panelNode = docFrag.appendChild(document.createElement('div'));
        panelNode.className = 'panel panel-default';

        collapseId = 'collapse-boot-regression-';
        collapseId += type;
        collapseId += '-';
        collapseId += labName;
        collapseId += '-';
        collapseId += index;

        headingNode = panelNode.appendChild(document.createElement('div'));
        headingNode.className = 'panel-heading collapsed';
        headingNode.id = 'panel-boot-' + index;
        headingNode.setAttribute('aria-expanded', false);
        headingNode.setAttribute('data-parent', '#accordion-' + labName);
        headingNode.setAttribute('data-toggle', 'collapse');
        headingNode.setAttribute('data-target', '#' + collapseId);
        headingNode.setAttribute('aria-controls', '#' + collapseId);

        hNode = headingNode.appendChild(document.createElement('h4'));
        hNode.className = 'panel-title';

        aNode = hNode.appendChild(document.createElement('a'));
        aNode.setAttribute('data-parent', '#accordion-' + labName);
        aNode.setAttribute('data-toggle', 'collapse');
        aNode.setAttribute('href', '#' + collapseId);
        aNode.setAttribute('aria-controls', '#' + collapseId);
        aNode.appendChild(document.createTextNode(board));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');

        smallNode = aNode.appendChild(document.createElement('small'));
        smallNode.appendChild(document.createTextNode(defconfigFull));

        hNode.insertAdjacentHTML('beforeend', '&nbsp;&dash;&nbsp;');
        spanNode = hNode.appendChild(document.createElement('span'));
        spanNode.className = 'arch-label';
        spanNode.appendChild(document.createTextNode(arch));

        hNode.appendChild(statusNode);

        collapseNode = panelNode.appendChild(document.createElement('div'));
        collapseNode.id = collapseId;
        collapseNode.className = 'panel-collapse collapse';
        collapseNode.setAttribute('aria-expanded', false);

        collapseBodyNode = collapseNode.appendChild(
            document.createElement('div'));
        collapseBodyNode.className = 'panel-body';

        // Since when it is failing?
        rowNode = collapseBodyNode.appendChild(document.createElement('div'));
        rowNode.className = 'row';

        colNode = rowNode.appendChild(document.createElement('div'));
        colNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';

        divNode = colNode.appendChild(document.createElement('div'));
        divNode.className = 'regression-details';

        dlNode = divNode.appendChild(document.createElement('dl'));
        dlNode.className = 'dl-horizontal';

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('First failure'));

        dNode = dlNode.appendChild(document.createElement('dd'));

        if (data.hasOwnProperty('first_fail')) {
            dNode.appendChild(document.createTextNode(data.first_fail.kernel));

            spanNode = dNode.appendChild(document.createElement('span'));
            spanNode.className = 'bb-details';
            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', urls.createPathHref([
                '/build/id/',
                data.first_fail.build_id.$oid,
                '/',
            ]));
            tooltipNode = aNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'First failure build report details');
            tooltipNode.appendChild(html.build());

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', urls.createPathHref([
                '/boot/id/',
                data.first_fail._id.$oid,
                '/'
            ]));
            tooltipNode = aNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'First failure boot report details');
            tooltipNode.appendChild(html.boot());
        } else {
            dNode.appendChild(document.createTextNode(failRegr.kernel));
            dNode.insertAdjacentHTML('beforeend', '&nbsp;');

            smallNode = dNode.appendChild(document.createElement('small'));
            smallNode.appendChild(document.createTextNode('(this failure)'));

            spanNode = dNode.appendChild(document.createElement('span'));
            spanNode.className = 'bb-details';
            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', failBuildURL);
            tooltipNode = aNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'First failure build report details');
            tooltipNode.appendChild(html.build());

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            aNode = spanNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', failBootURL);
            tooltipNode = aNode.appendChild(html.tooltip());
            tooltipNode.setAttribute(
                'title', 'First failure boot report details');
            tooltipNode.appendChild(html.boot());
        }

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Failing since'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        if (data.hasOwnProperty('first_fail') && data.first_fail !== undefined) {
            dNode.appendChild(
                html.time(data.first_fail.created_on));
            dNode.insertAdjacentHTML('beforeend', '&nbsp;');

            smallNode = dNode.appendChild(document.createElement('small'));
            smallNode.appendChild(document.createTextNode(
                failingSince(data.first_fail.created_on, failRegr.created_on)));
        } else {
            dNode.appendChild(html.time(failRegr.created_on));
        }

        // The fail & pass container.
        rowNode = collapseBodyNode.appendChild(document.createElement('div'));
        rowNode.className = 'row';

        colNode = rowNode.appendChild(document.createElement('div'));
        colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

        // This failure.
        bootPanel = colNode.appendChild(document.createElement('div'));
        bootPanel.className = 'panel panel-danger';

        panelHead = bootPanel.appendChild(document.createElement('div'));
        panelHead.className = 'panel-heading';
        panelHead.appendChild(document.createTextNode('This Failure'));

        panelBody = bootPanel.appendChild(document.createElement('div'));
        panelBody.className = 'panel-body';

        // The actual data for the failure.
        dlNode = panelBody.appendChild(document.createElement('dl'));
        dlNode.className = 'dl-horizontal';
        dlNode.setAttribute('role', 'regressions');

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Date'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(html.time(failRegr.created_on));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git describe'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(failRegr.git_describe));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git commit'));

        dNode = dlNode.appendChild(document.createElement('dd'));

        gitCommit = failRegr.git_commit;
        gitURL = failRegr.git_url;

        gitURLs = urls.translateCommit(gitURL, gitCommit);

        // Git commit.
        if (gitURLs[1]) {
            aNode = dNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', gitURLs[1]);
            aNode.appendChild(document.createTextNode(gitCommit));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());
        } else {
            if (gitCommit && gitCommit !== null) {
                dNode.appendChild(document.createTextNode(gitCommit));
            } else {
                dNode.appendChild(html.nonavail());
            }
        }

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Compiler'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(
            document.createTextNode(failRegr.compiler_version_full));

        txtLog = failRegr.boot_log;
        htmlLog = failRegr.boot_log_html;

        if (txtLog || htmlLog) {
            if (failRegr.file_server_url) {
                serverURL = failRegr.file_server_url;
            } else {
                serverURL = gFileServer;
            }

            translatedURI = urls.createFileServerURL(serverURL, failRegr);

            dNode = dlNode.appendChild(document.createElement('dt'));
            dNode.appendChild(document.createTextNode('Boot Log'));

            dNode = dlNode.appendChild(document.createElement('dd'));
            dNode.appendChild(
                common.logsNode(
                    txtLog,
                    htmlLog, labName, translatedURI[0], translatedURI[1]));
        }

        divNode = panelBody.appendChild(document.createElement('div'));
        divNode.className = 'pull-center';

        tooltipNode = divNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Boot report details');

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.appendChild(document.createTextNode('More info'));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());
        aNode.setAttribute('href', failBootURL);

        // Last good status.
        colNode = rowNode.appendChild(document.createElement('div'));
        colNode.className = 'col-xs-12 col-sm-12 col-md-6 col-lg-6';

        bootPanel = colNode.appendChild(document.createElement('div'));
        bootPanel.className = 'panel panel-success';

        panelHead = bootPanel.appendChild(document.createElement('div'));
        panelHead.className = 'panel-heading';
        panelHead.appendChild(document.createTextNode('Last Good Status'));

        panelBody = bootPanel.appendChild(document.createElement('div'));
        panelBody.className = 'panel-body';

        // The actual data for the pass status.
        dlNode = panelBody.appendChild(document.createElement('dl'));
        dlNode.className = 'dl-horizontal';
        dlNode.setAttribute('role', 'regressions');

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Date'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(html.time(passRegr.created_on));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git describe'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(passRegr.git_describe));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git commit'));

        dNode = dlNode.appendChild(document.createElement('dd'));

        gitCommit = passRegr.git_commit;
        gitURL = passRegr.git_url;

        gitURLs = urls.translateCommit(gitURL, gitCommit);

        // Git commit.
        if (gitURLs[1]) {
            aNode = dNode.appendChild(document.createElement('a'));
            aNode.setAttribute('href', gitURLs[1]);
            aNode.appendChild(document.createTextNode(gitCommit));
            aNode.insertAdjacentHTML('beforeend', '&nbsp;');
            aNode.appendChild(html.external());
        } else {
            if (!gitCommit) {
                dNode.appendChild(html.nonavail());
            } else {
                dNode.appendChild(document.createTextNode(gitCommit));
            }
        }

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Compiler'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(
            document.createTextNode(passRegr.compiler_version_full));

        txtLog = passRegr.boot_log;
        htmlLog = passRegr.boot_log_html;

        if (txtLog || htmlLog) {
            if (passRegr.file_server_url) {
                serverURL = passRegr.file_server_url;
            } else {
                serverURL = gFileServer;
            }

            translatedURI = urls.createFileServerURL(serverURL, passRegr);

            dNode = dlNode.appendChild(document.createElement('dt'));
            dNode.appendChild(document.createTextNode('Boot Log'));

            dNode = dlNode.appendChild(document.createElement('dd'));
            dNode.appendChild(
                common.logsNode(
                    txtLog,
                    htmlLog, labName, translatedURI[0], translatedURI[1]));
        }

        divNode = panelBody.appendChild(document.createElement('div'));
        divNode.className = 'pull-center';

        tooltipNode = divNode.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', 'Boot report details');

        aNode = tooltipNode.appendChild(document.createElement('a'));
        aNode.appendChild(document.createTextNode('More info'));
        aNode.insertAdjacentHTML('beforeend', '&nbsp;');
        aNode.appendChild(html.search());

        aNode.setAttribute('href', urls.createPathHref([
            '/boot/id/',
            passRegr._id.$oid,
            '/'
        ]));

        return docFrag;
    };

    gBootRegressionsView.createSection = function(labName) {
        var accordion;
        var divNode;
        var docFrag;
        var headerNode;
        var idStr;
        var labStr;
        var node;

        docFrag = document.createDocumentFragment();
        divNode = docFrag.appendChild(document.createElement('div'));
        divNode.id = labName;

        node = divNode.appendChild(document.createElement('div'));
        node.className = 'sub-header';

        headerNode = node.appendChild(document.createElement('h4'));
        labStr = 'Lab &#171;';
        labStr += labName;
        labStr += '&#187;';

        headerNode.innerHTML = labStr;

        node = divNode.appendChild(document.createElement('div'));
        idStr = 'view-';
        idStr += labName;
        node.id = idStr;
        node.className = 'pull-center';

        accordion = divNode.appendChild(document.createElement('div'));
        idStr = 'accordion-';
        idStr += labName;

        accordion.id = idStr;
        accordion.className = 'panel-group';

        return [docFrag, accordion];
    };

    return gBootRegressionsView;
});
