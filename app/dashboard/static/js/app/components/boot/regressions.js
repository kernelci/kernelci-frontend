/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html'
], function(html) {
    'use strict';
    var gBootRegressionsView;
    gBootRegressionsView = {};

    gBootRegressionsView.createPanel = function(data, index) {
        // TODO
        var docFrag;
        var statusNode;
        var failRegr;
        var passRegr;
        var panelNode;
        var collapseId;
        var headingNode;
        var labName;
        var hNode;
        var aNode;
        var smallNode;
        var board;
        var defconfigFull;
        var arch;
        var spanNode;
        var collapseNode;
        var collapseBodyNode;
        var rowNode;
        var colNode;
        var panelHead;
        var panelBody;
        var bootPanel;
        var dlNode;
        var dNode;

        arch = data.arch;
        board = data.board;
        labName = data.lab_name;
        failRegr = data.fail;
        passRegr = data.pass;
        defconfigFull = data.defconfig_full;

        docFrag = document.createDocumentFragment();

        statusNode = html.fail();
        html.addClass(statusNode.firstElementChild, 'pull-right');

        panelNode = docFrag.appendChild(document.createElement('div'));
        panelNode.className = 'panel panel-default';

        collapseId = 'collapse-boot-regression-';
        collapseId += index;

        headingNode = panelNode.appendChild(document.createElement('div'));
        headingNode.className = 'panel-heading collapsed';
        headingNode.id = 'panel-boot-' + index;
        headingNode.setAttribute('aria-expanded', false);
        headingNode.setAttribute('data-parent', '#accordion-' + labName);
        headingNode.setAttribute('data-toggle', 'collapse');
        headingNode.setAttribute('data-target', '#' + collapseId);
        headingNode.setAttribute('aria-controls', '#' + collapseId);

        hNode = headingNode.appendChild(document.createElement('h5'));
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

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Date'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(html.time(failRegr.created_on));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git Describe'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(failRegr.git_describe));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Build Used'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(failRegr.defconfig_full));

        console.log(failRegr.build_id);

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git Commit'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(failRegr.git_commit));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Compiler'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(
            document.createTextNode(failRegr.compiler_version_full));

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

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Date'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(html.time(passRegr.created_on));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git Describe'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(passRegr.git_describe));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Build Used'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(passRegr.defconfig_full));

        console.log(passRegr.build_id);

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Git Commit'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(document.createTextNode(passRegr.git_commit));

        dNode = dlNode.appendChild(document.createElement('dt'));
        dNode.appendChild(document.createTextNode('Compiler'));

        dNode = dlNode.appendChild(document.createElement('dd'));
        dNode.appendChild(
            document.createTextNode(passRegr.compiler_version_full));

        return docFrag;
    };

    gBootRegressionsView.createSection = function(labName) {
        var docFrag;
        var divNode;
        var node;
        var headerNode;
        var labStr;
        var idStr;
        var accordion;

        docFrag = document.createDocumentFragment();
        divNode = docFrag.appendChild(document.createElement('div'));
        divNode.id = labName;

        node = divNode.appendChild(document.createElement('div'));
        node.className = 'sub-header';

        headerNode = node.appendChild(document.createElement('h5'));
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
