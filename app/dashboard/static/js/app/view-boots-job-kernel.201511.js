/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error',
    'utils/urls',
    'utils/show-hide-btns',
    'charts/passpie',
    'utils/unique-count',
    'utils/storage',
    'utils/session',
    'utils/html',
    'utils/date',
    'sprintf',
    'bootstrap'
], function($, init, b, r, e, u, btns, chart, uniq, storage, session, html) {
    'use strict';
    var gKernelName = null,
        gJobName = null,
        gSearchFilter = null,
        fileServer = null,
        sNonAvail,
        failLabel,
        successLabel,
        unknownLabel,
        archLabel,
        divCol6,
        divCol12,
        sessionNameFmt,
        panelFmt,
        boardTextFmt,
        socTextFmt,
        gSessionStorage,
        defconfigTextFmt;

    sNonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i></span>';

    failLabel = '<span class="pull-right label label-danger">' +
        '<li class="fa fa-exclamation-triangle"></li></span>';
    successLabel = '<span class="pull-right label label-success">' +
        '<li class="fa fa-check"></li></span>';
    unknownLabel = '<span class="pull-right label label-warning">' +
        '<li class="fa fa-question"></li></span>';
    archLabel = '<span class="arch-label">%s</span>';

    panelFmt = '<div class="panel panel-default %(cls)s">' +
        '<div class="panel-heading" data-toggle="collapse" ' +
        'id="panel-boots-%(idx)d" data-parent="accordion-%(lab)s" ' +
        'data-target="#collapse-boots-%(idx)d">' +
        '<h4 class="panel-title"><a data-toggle="collapse" ' +
        'data-parent="#accordion-%(lab)s" href="#collapse-boots-%(idx)d">' +
        '%(board)s&nbsp;<small>%(defconfig)s</small> ' +
        '</a>%(archLabel)s%(statusLabel)s</h4></div>' +
        '<div id="collapse-boots-%(idx)d" class="panel-collapse collapse">' +
        '<div class="panel-body">';

    divCol6 = '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
    divCol12 = '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
    sessionNameFmt = 'boot-%s-%s';

    boardTextFmt = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique boards tested">%d</span>';
    socTextFmt = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique SoC families tested">%d</span>';
    defconfigTextFmt = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique defconfigs tested">%s</span>';

    function showHideBind(element) {
        element.addEventListener('click', btns.showHideElements, true);
    }

    function labBind(element) {
        element.addEventListener('click', btns.showHideLab, true);
    }

    function bindDetailButtons() {
        [].forEach.call(
            document.getElementsByClassName('click-btn'), showHideBind);
    }

    function bindLabButtons() {
        [].forEach.call(
            document.getElementsByClassName('lab-click-btn'), labBind);
    }

    function uniqueCountFail() {
        b.replaceByClass('unique-values', sNonAvail);
    }

    function uniqueCountDone(defconfig, unique) {
        var totalDefconfig = defconfig[0].result[0].count,
            uniqueTotal = unique[0],
            uniqueLab = unique[1],
            sLab,
            inDefconfText,
            labBootCountFmt,
            labUniqueCountFmt,
            lLab,
            tStatus,
            tTotal,
            fail,
            pass,
            unkn,
            uArch = '0 architectures',
            uBoard = '0 boards',
            uSoc = '0 SoCs',
            uDefconfig = '0 defconfigs',
            uStr = '';

        labBootCountFmt = '<span class="default-cursor" rel="tooltip" ' +
            'data-toggle="tooltip" ' +
            'title="Total, passed, failed and unknown boot reports count ' +
            'for this lab"><small>(%d&nbsp;&mdash;&nbsp;' +
            '<span class="green-font">%d</span>' +
            '&nbsp;/&nbsp;<span class="red-font">%d</span>' +
            '&nbsp;/&nbsp;<span class="yellow-font">%d</span>)</small></span>';

        labUniqueCountFmt = '<span class="default-cursor" rel="tooltip" ' +
            'data-toggle="tooltip" title="Unique count of architectures, ' +
            'boards, SoCs and defconfigs"><small>' +
            '(%s&nbsp;/&nbsp;%s&nbsp;/&nbsp;%s&nbsp;/&nbsp;%s)</small></span>';

        if (Object.getOwnPropertyNames(uniqueTotal.totals).length > 0) {
            if (uniqueTotal.totals.board > 0) {
                b.replaceById(
                    'unique-boards',
                    sprintf(boardTextFmt, uniqueTotal.totals.board));
            } else {
                b.replaceById('unique-boards', sNonAvail);
            }
            if (uniqueTotal.totals.soc > 0) {
                b.replaceById(
                    'unique-socs',
                    sprintf(socTextFmt, uniqueTotal.totals.soc));
            } else {
                b.replaceById('unique-socs', sNonAvail);
            }
            if (uniqueTotal.totals.defconfig > 0) {
                if (totalDefconfig > 0) {
                    inDefconfText = sprintf(
                        '%d out of %d',
                        uniqueTotal.totals.defconfig, totalDefconfig);
                } else {
                    inDefconfText = sprintf(
                        '%d', uniqueTotal.totals.defconfig);
                }
                b.replaceById(
                    'unique-defconfigs',
                    sprintf(defconfigTextFmt, inDefconfText));
            } else {
                b.replaceById('unique-defconfigs', sNonAvail);
            }
        } else {
            b.replaceByClass('unique-values', sNonAvail);
        }

        if (Object.getOwnPropertyNames(uniqueLab).length > 0) {
            for (sLab in uniqueLab) {
                if (uniqueLab.hasOwnProperty(sLab)) {
                    lLab = uniqueLab[sLab];
                    tStatus = lLab.status;
                    if (tStatus.hasOwnProperty('fail')) {
                        fail = tStatus.fail;
                    } else {
                        fail = 0;
                    }
                    if (tStatus.hasOwnProperty('pass')) {
                        pass = tStatus.pass;
                    } else {
                        pass = 0;
                    }
                    if (tStatus.hasOwnProperty('unknown')) {
                        unkn = tStatus.unknown;
                    } else {
                        unkn = 0;
                    }
                    tTotal = fail + pass + unkn;
                    b.replaceById(
                        'boot-count-' + sLab,
                        sprintf(labBootCountFmt, tTotal, pass, fail, unkn));

                    if (lLab.totals.arch !== null) {
                        if (lLab.totals.arch === 1) {
                            uArch = lLab.totals.arch + ' architecture';
                        } else {
                            uArch = lLab.totals.arch + ' architectures';
                        }
                    }
                    if (lLab.totals.board !== null) {
                        if (lLab.totals.board === 1) {
                            uBoard = lLab.totals.board + ' board';
                        } else {
                            uBoard = lLab.totals.board + ' boards';
                        }
                    }
                    if (lLab.totals.soc !== null) {
                        if (lLab.totals.soc === 1) {
                            uSoc = lLab.totals.soc + ' SoC';
                        } else {
                            uSoc = lLab.totals.soc + ' SoCs';
                        }
                    }
                    if (lLab.totals.defconfig !== null) {
                        if (lLab.totals.defconfig === 1) {
                            uDefconfig = lLab.totals.defconfig + ' defconfig';
                        } else {
                            uDefconfig = lLab.totals.defconfig + ' defconfigs';
                        }
                    }
                    uStr = sprintf(
                        labUniqueCountFmt, uArch, uBoard, uSoc, uDefconfig);
                    b.replaceById('unique-count-' + sLab, uStr);
                }
            }
        }
    }

    function getBootDoneUnique(response) {
        var deferred,
            data;
        if (response.count > 0) {
            data = {
                    job: gJobName,
                    kernel: gKernelName
            };
            deferred = r.get('/_ajax/count/build', data);

            $.when(deferred, uniq.countUniqueBootD(response))
                .fail(e.error, uniqueCountFail)
                .done(uniqueCountDone);
        } else {
            uniqueCountFail();
        }
    }

    function loadSavedSession() {
        var isLoaded;

        isLoaded = false;
        gSessionStorage.load();

        if (gSessionStorage.objects) {
            isLoaded = session.load(gSessionStorage.objects);
        }

        return isLoaded;
    }

    function getBootDoneChart(response) {
        chart.bootpie('boot-chart', response);
    }

    function getBootFailed() {
        b.replaceById(
            'accordion-container',
            '<div class="text-center"><h4>Error loading data.</h4></div>');
    }

    function getBootDone(response) {
        var result = response.result,
            resultLen = result.length,
            idx = 0,
            bootObj,
            defconfigFull,
            arch,
            job,
            kernel,
            board,
            labName,
            bootObjId,
            translatedURI,
            pathURI,
            fileServerURI,
            fileServerURL,
            fileServerRes,
            fileServerData,
            bootLogTxt,
            bootLogHtml,
            logPath,
            lArchLabel,
            sPanel,
            subs,
            bootTime,
            hasSuccess = false,
            hasFailed = false,
            hasUnknown = false,
            allLabs = {},
            lab = null,
            toAppend = '';

        if (resultLen > 0) {
            for (idx; idx < resultLen; idx = idx + 1) {
                bootObj = result[idx];
                arch = bootObj.arch;
                job = bootObj.job;
                kernel = bootObj.kernel;
                labName = bootObj.lab_name;
                bootObjId = bootObj._id;
                defconfigFull = bootObj.defconfig_full;
                fileServerURL = bootObj.file_server_url;
                fileServerRes = bootObj.file_server_resource;
                bootLogTxt = bootObj.boot_log;
                bootLogHtml = bootObj.boot_log_html;
                board = bootObj.board;

                if (fileServerURL === null || fileServerURL === undefined) {
                    fileServerURL = fileServer;
                }
                fileServerData = [
                    job, kernel, arch + '-' + defconfigFull
                ];
                translatedURI = u.translateServerURL(
                    fileServerURL, fileServerRes, fileServerData);
                fileServerURI = translatedURI[0];
                pathURI = translatedURI[1];

                subs = {
                    idx: idx,
                    board: board,
                    lab: labName,
                    defconfig: defconfigFull
                };

                switch (bootObj.status) {
                    case 'FAIL':
                        hasFailed = true;
                        subs.statusLabel = failLabel;
                        subs.cls = 'df-failed';
                        break;
                    case 'PASS':
                        hasSuccess = true;
                        subs.statusLabel = successLabel;
                        subs.cls = 'df-success';
                        break;
                    default:
                        hasUnknown = true;
                        subs.statusLabel = unknownLabel;
                        subs.cls = 'df-unknown';
                        break;
                }

                if (arch !== null) {
                    lArchLabel = '&nbsp;&dash;&nbsp;' +
                        sprintf(archLabel, arch);
                } else {
                    lArchLabel = '';
                }
                subs.archLabel = lArchLabel;
                sPanel = sprintf(panelFmt, subs);
                sPanel += '<div class="row">';
                sPanel += divCol6;
                sPanel += '<dl class="dl-horizontal">';

                sPanel += '<dt>Endianness</dt>';
                if (bootObj.endian !== null) {
                    sPanel += '<dd>' + bootObj.endian + '</dd>';
                } else {
                    sPanel += '<dd>' + sNonAvail + '</dd>';
                }

                sPanel += '<dt>Kernel image</dt>';
                if (bootObj.kernel_image !== null) {
                    sPanel += '<dd>' +
                        '<a href="' +
                        fileServerURI
                            .path(pathURI + '/' + bootObj.kernel_image)
                            .normalizePath().href() +
                        '">' + bootObj.kernel_image +
                        '&nbsp;<i class="fa fa-external-link"></i></a>' +
                        '</dd>';
                } else {
                    sPanel += '<dd>' + sNonAvail + '</dd>';
                }

                sPanel += '</dl></div>';
                sPanel += divCol6;
                sPanel += '<dl class="dl-horizontal">';

                sPanel += '<dt>Warnings</dt>';
                if (bootObj.warnings !== null) {
                    sPanel += '<dd>' + bootObj.warnings + '</dd>';
                } else {
                    sPanel += '<dd>' + sNonAvail + '</dd>';
                }

                sPanel += '<dt>Boot time</dt>';
                if (bootObj.time !== null) {
                    bootTime = new Date(bootObj.time.$date);
                    sPanel += '<dd>' + bootTime.toCustomTime() + '</dd>';
                } else {
                    sPanel += '<dd>' + sNonAvail + '</dd>';
                }

                if (bootLogTxt !== null || bootLogHtml !== null) {
                    sPanel += '<dt>Boot log</dt>';
                    sPanel += '<dd>';

                    if (bootLogTxt !== null) {
                        if (bootLogTxt.search(labName) === -1) {
                            logPath = pathURI + '/' +
                                labName + '/' + bootLogTxt;
                        } else {
                            logPath = pathURI + '/' + bootLogTxt;
                        }
                        sPanel += '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="View raw text boot log"><a href="' +
                            fileServerURI
                                .path(logPath)
                                .normalizePath().href() +
                            '">txt&nbsp;' +
                            '<i class="fa fa-external-link"></i></a>' +
                            '</span>';
                    }

                    if (bootLogHtml !== null) {
                        if (bootLogTxt !== null) {
                            sPanel += '&nbsp;&mdash;&nbsp;';
                        }
                        if (bootLogHtml.search(labName) === -1) {
                            logPath = pathURI + '/' +
                                labName + '/' + bootLogHtml;
                        } else {
                            logPath = pathURI + '/' + bootLogHtml;
                        }
                        sPanel += '<span rel="tooltip" ' +
                            'data-toggle="tooltip" ' +
                            'title="View HTML boot log"><a href="' +
                            fileServerURI
                                .path(logPath)
                                .normalizePath().href() +
                            '">html&nbsp;<i class="fa fa-external-link"></i>' +
                            '</a></span>';
                    }

                    sPanel += '</dd>';
                }

                sPanel += '</dl></div>';
                sPanel += divCol12;
                sPanel += '<div class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for this boot report">' +
                    '<a href="/boot/' + board +
                    '/job/' + job +
                    '/kernel/' + kernel +
                    '/defconfig/' + defconfigFull +
                    '/lab/' + labName + '/' +
                    '?_id=' + bootObjId.$oid +
                    '">More info&nbsp;<i class="fa fa-search"></i>' +
                    '</a></span>';
                sPanel += '</div></div>';
                sPanel += '</div>';
                sPanel += '</div></div></div>\n';

                if (allLabs.hasOwnProperty(labName)) {
                    allLabs[labName].push(sPanel);
                } else {
                    allLabs[labName] = [];
                    allLabs[labName].push(sPanel);
                }
            }

            // Make sure it is clean.
            toAppend = '';
            Object.keys(allLabs).sort().forEach(function(element) {
                lab = allLabs[element];

                toAppend += '<div id="' + element + '">' +
                    '<div class="other-header">' +
                    '<h4>Lab&nbsp;&#171;' + element + '&#187;</h4>' +
                    '&nbsp;<span id="boot-count-' + element + '"></span>' +
                    '&nbsp;<span id="unique-count-' + element + '"></span>' +
                    '<span class="pull-right" id="view-eye-' + element + '">' +
                    btns.createShowHideLabBtn(element, 'hide') +
                    '</span><hr class="blurred subheader" /></div>' +
                    '<div id="view-' + element +
                    '" class="pull-center"></div>' +
                    '<div class="panel-group" id="accordion-' +
                    element + '">';

                lab.forEach(function(labElement) {
                    toAppend += labElement;
                });
                toAppend += '</div></div>';
            });
            // Add all the elements to the DOM.
            b.replaceById('accordion-container', toAppend);
            bindDetailButtons();
            bindLabButtons();

            if (hasFailed) {
                document.getElementById('fail-btn')
                    .removeAttribute('disabled');
            }

            if (hasSuccess) {
                document.getElementById('success-btn')
                    .removeAttribute('disabled');
            }

            if (hasUnknown) {
                document.getElementById('unknown-btn')
                    .removeAttribute('disabled');
            }
            document.getElementById('all-btn').removeAttribute('disabled');

            if (gSearchFilter && gSearchFilter.length > 0) {
                switch (gSearchFilter) {
                    case 'fail':
                        $('#fail-cell').trigger('click');
                        break;
                    case 'success':
                        $('#success-cell').trigger('click');
                        break;
                    case 'unknown':
                        $('#unknown-cell').trigger('click');
                        break;
                }
            } else if (!loadSavedSession()) {
                if (hasFailed) {
                    // If there is no saved session, show only the failed ones.
                    $('.df-failed').show();
                    $('.df-success').hide();
                    $('.df-unknown').hide();
                    $('#fail-btn').addClass('active').siblings()
                        .removeClass('active');
                } else {
                    $('#all-btn').addClass('active');
                }
            }
        } else {
            b.replaceById(
                'accordion-container',
                '<div class="pull-center"><h4>No boards tested.</h4></div>'
            );
        }
    }

    function getBoot(response) {
        var deferred,
            results;

        results = response.result;
        if (results.length > 0) {
            deferred = r.get(
                '/_ajax/boot',
                {
                    job: gJobName,
                    kernel: gKernelName,
                    sort: ['board', 'defconfig_full', 'arch'],
                    sort_order: 1
                }
            );

            $.when(deferred)
                .fail(e.error, getBootFailed)
                .done(getBootDone, getBootDoneChart, getBootDoneUnique);
        } else {
            getBootFailed();
        }
    }

    function getJobFailed() {
        html.replaceByClassHTML('loading-content', '&infin;');
    }

    function getJobDone(response) {
        var result = response.result,
            resultLen = result.length,
            localResult = null,
            gitCommit = null,
            gitURL = null,
            tURLs = null,
            sContent,
            createdOn;

        if (resultLen > 0) {
            localResult = result[0];
            gitCommit = localResult.git_commit;
            gitURL = localResult.git_url;
            createdOn = new Date(localResult.created_on.$date);

            tURLs = u.translateCommit(gitURL, gitCommit);

            b.replaceById(
                'tree',
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Boot reports for ' + gJobName + '">' +
                '<a href="/boot/all/job/' + gJobName + '/">' + gJobName +
                '</a></span>' +
                '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Details for tree ' + gJobName + '">' +
                '<a href="/job/' + gJobName + '/">' +
                '<i class="fa fa-sitemap"></i></a></span>'
            );
            b.replaceById('git-branch', localResult.git_branch);
            b.replaceById(
                'git-describe',
                gKernelName + '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build ' + gJobName + '&nbsp;&dash;&nbsp;' +
                gKernelName + '">' +
                '<a href="/build/' + gJobName + '/kernel/' +
                gKernelName + '/">' +
                '<i class="fa fa-cube"></i></a></span>'
            );

            if (tURLs[0] !== null) {
                sContent = '<a href="' + tURLs[0] + '">' + gitURL +
                    '&nbsp;<i class="fa fa-external-link"></i></a>';
            } else {
                if (gitURL !== null) {
                    sContent = gitURL;
                } else {
                    sContent = sNonAvail;
                }
            }
            b.replaceById('git-url', sContent);

            if (tURLs[1] !== null) {
                sContent = '<a href="' + tURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a>';
            } else {
                if (gitCommit !== null) {
                    sContent = gitCommit;
                } else {
                    sContent = sNonAvail;
                }
            }
            b.replaceById('git-commit', sContent);
            b.replaceById('job-date', createdOn.toCustomISODate());
        } else {
            html.replaceByClassNode('loading-content', html.nonavail());
        }
    }

    function getJob() {
        var deferred;

        deferred = r.get(
            '/_ajax/job',
            {
                job: gJobName,
                kernel: gKernelName
            }
        );

        $.when(deferred)
            .fail(e.error, getJobFailed)
            .done(getJobDone, getBoot);
    }

    function registerEvents() {
        window.addEventListener('beforeunload', function() {
            var pageState;

            pageState = {};

            function _saveElementState(element) {
                pageState['#' + element.id] = [
                    {
                        type: 'class',
                        name: 'class',
                        value: element.getAttribute('class')
                    },
                    {
                        type: 'attr',
                        name: 'aria-expanded',
                        value: element.getAttribute('aria-expanded')
                    }
                ];
            }

            pageState['.df-success'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-success', 'style')
            };
            pageState['.df-failed'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-failed', 'style')
            };
            pageState['.df-unknown'] = {
                type: 'attr',
                name: 'style',
                value: html.attrBySelector('.df-unknown', 'style')
            };
            pageState['#all-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('all-btn', 'class')
            };
            pageState['#success-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('success-btn', 'class')
            };
            pageState['#fail-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('fail-btn', 'class')
            };
            pageState['#unknown-btn'] = {
                type: 'class',
                name: 'class',
                value: html.attrById('unknown-btn', 'class')
            };


            [].forEach.call(
                document.querySelectorAll('[id^="panel-boots"]'),
                _saveElementState);

            [].forEach.call(
                document.querySelectorAll('[id^="collapse-boots"]'),
                _saveElementState);

            gSessionStorage.addObjects(pageState).save();
        });
    }

    document.getElementById('li-boot').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    [].forEach.call(
        document.querySelectorAll('.btn-group > .btn'),
        function(btn) {
            btn.addEventListener('click', function() {
                [].forEach.call(btn.parentElement.children, function(element) {
                    if (element === btn) {
                        html.addClass(element, 'active');
                    } else {
                        html.removeClass(element, 'active');
                    }
                });
            });
    });

    if (document.getElementById('job-name') !== null) {
        gJobName = document.getElementById('job-name').value;
    }
    if (document.getElementById('kernel-name') !== null) {
        gKernelName = document.getElementById('kernel-name').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('file-server') !== null) {
        fileServer = document.getElementById('file-server').value;
    }

    gSessionStorage = storage('boot-' + gJobName + '-' + gKernelName);

    getJob();
    registerEvents();
});
