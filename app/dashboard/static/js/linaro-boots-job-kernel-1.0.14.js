var nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
    'title="Not available"><i class="fa fa-ban"></i></span>';
var kernelName = $('#kernel-name').val();
var jobName = $('#job-name').val();
var searchFilter = $('#search-filter').val();

function createHideShowButton(element, action) {
    'use strict';
    var faClass = 'fa fa-eye',
        tooltipTitle = 'Show content for lab &#171;' + element + '&#187;"';
    if (action === 'hide') {
        faClass = 'fa fa-eye-slash';
        tooltipTitle = 'Hide content for lab &#171;' + element + '&#187;"';
    }
    return '<span rel="tooltip" data-toggle="tooltip"' +
        'title="' + tooltipTitle + '"><i data-action="' + action + '" ' +
        'data-id="' + element + '" class="' + faClass + '" ' +
        'onclick="showHideLab(this)"></i></span>';
}

function showHideLab(element) {
    'use strict';
    var tElement = $(element),
        dataId = tElement.data('id'),
        dataAction = tElement.data('action');

    if (dataAction === 'hide') {
        $('#accordion' + dataId).hide();
        $('#view-eye-' + dataId).empty().append(
            createHideShowButton(dataId, 'show')
        );
        $('#view-' + dataId).empty().append(
            '<small>Content for lab &#171;' + dataId + '&#187; ' +
            'hidden. Use the <i class="fa fa-eye"></i> ' +
            'button to show it again.</small>'
        );
    } else {
        $('#accordion' + dataId).show();
        $('#view-' + dataId).empty();
        $('#view-eye-' + dataId).empty().append(
            createHideShowButton(dataId, 'hide')
        );
    }
}

function showHideBoots(element) {
    'use strict';
    switch (element.id) {
        case 'success-cell':
            if ($('#success-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').hide();
                $('.df-success').show();
                $('.df-unknown').hide();
                $('#success-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'success-btn':
            $('.df-failed').hide();
            $('.df-success').show();
            $('.df-unknown').hide();
            break;
        case 'fail-cell':
            if ($('#fail-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').show();
                $('.df-success').hide();
                $('.df-unknown').hide();
                $('#fail-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'fail-btn':
            $('.df-failed').show();
            $('.df-success').hide();
            $('.df-unknown').hide();
            break;
        case 'unknown-cell':
            if ($('#unknown-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').hide();
                $('.df-success').hide();
                $('.df-unknown').show();
                $('#unknown-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'unknown-btn':
            $('.df-failed').hide();
            $('.df-success').hide();
            $('.df-unknown').show();
            break;
        default:
            $('.df-failed').show();
            $('.df-success').show();
            $('.df-unknown').show();
            $('#all-btn').addClass('active').siblings()
                .removeClass('active');
            break;
    }
}

function countUniqueData(data) {
    'use strict';
    var dData = null,
        board,
        arch,
        soc,
        defconfig,
        localData = data.result,
        localLen = localData.length,
        uniqueArchs = {},
        uniqueBoards = {},
        uniqueDefcons = {},
        uniqueSocs = {},
        uniq = {},
        i = 0;

    if (localLen > 0) {
        for (i; i < localLen; i = i + 1) {
            dData = localData[i];

            arch = dData.arch;
            board = dData.board;
            defconfig = dData.defconfig_full;
            soc = dData.mach;

            if (arch !== null) {
                uniqueArchs[arch] = (uniqueArchs[arch] || 0) + 1;
            }
            if (board !== null) {
                uniqueBoards[board] = (uniqueArchs[board] || 0) + 1;
            }
            if (defconfig !== null) {
                uniqueDefcons[defconfig] = (uniqueDefcons[defconfig] || 0) + 1;
            }
            if (soc !== null) {
                uniqueSocs[soc] = (uniqueSocs[soc] || 0) + 1;
            }
        }

        uniq = {
            arch: Object.keys(uniqueArchs),
            board: Object.keys(uniqueBoards),
            defconfig: Object.keys(uniqueDefcons),
            soc: Object.keys(uniqueSocs)
        };
    }

    return uniq;
}

function populateUniqueCounts(data) {
    'use strict';
    var uniq = countUniqueData(data),
        ajaxData = null,
        ajaxDeferredCall = null,
        totalDefconfig = 0,
        boardText = '',
        socText = '',
        defconfigText = '',
        innerDefconfText = '';

    boardText = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique boards tested">%d</span>';
    socText = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique SoC families tested">%d</span>';
    defconfigText = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Total number of unique defconfigs tested">%s</span>';

    if (Object.getOwnPropertyNames(uniq).length > 0) {
        if (uniq.board.length > 0) {
            JSBase.replaceContentByID(
                '#unique-boards', sprintf(boardText, uniq.board.length));
        } else {
            JSBase.replaceContentByID('#unique-boards', nonAvail);
        }

        if (uniq.soc.length > 0) {
            JSBase.replaceContentByID(
                '#unique-socs', sprintf(socText, uniq.soc.length));
        } else {
            JSBase.replaceContentByID('#unique-socs', nonAvail);
        }

        if (uniq.defconfig.length > 0) {
            ajaxData = {'job_id': data.result[0].job_id.$oid};
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/count/defconfig',
                'GET', ajaxData, null, null, null, null, null);

            $.when(ajaxDeferredCall).always(function(res, textStatus) {
                if (textStatus === 'success') {
                    if (res.code === 200) {
                        totalDefconfig = res.result[0].count;
                        innerDefconfText = sprintf(
                            '%d out of %d',
                            uniq.defconfig.length, totalDefconfig);
                        JSBase.replaceContentByID(
                            '#unique-defconfigs',
                            sprintf(defconfigText, innerDefconfText));
                    } else {
                        JSBase.replaceContentByID(
                            '#unique-defconfigs',
                            sprintf(defconfigText, uniq.defconfig.length));
                    }
                } else {
                    JSBase.replaceContentByID(
                        '#unique-defconfigs',
                        sprintf(defconfigText, uniq.defconfig.length));
                }
            });
        } else {
            JSBase.replaceContentByID('#unique-defconfigs', nonAvail);
        }
    } else {
        JSBase.replaceContentByClass('.unique-values', nonAvail);
    }
}

function createPieChart(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        success = 0,
        fail = 0,
        unknown = 0,
        i = 0,
        width = 200,
        height = 200,
        radius = Math.min(width, height) / 2,
        dataset = null,
        svg = null,
        // success, fail and unknown status colors.
        color = ['#5cb85c', '#d9534f', '#f0ad4e'],
        pie = d3.layout.pie().sort(null),
        arc = d3.svg.arc().innerRadius(radius - 30).outerRadius(radius - 50);

    if (len > 0) {
        for (i; i < len; i = i + 1) {
            switch (localData[i].status) {
                case 'FAIL':
                    fail = fail + 1;
                    break;
                case 'PASS':
                    success = success + 1;
                    break;
                default:
                    unknown = unknown + 1;
                    break;
            }
        }

        dataset = [success, fail, unknown];
        svg = d3.select('#pie-chart').append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' +
                height / 2 + ')'
            );

        svg.selectAll('path')
            .data(pie(dataset))
            .enter().append('path')
            .attr('fill', function(d, i) {
                return color[i];
            })
            .attr('d', arc);

        svg.append('text')
            .attr('dy', '0em')
            .style('text-anchor', 'middle')
            .attr('class', 'pie-chart-inside')
            .text(function(d) {
                return len;
            });

        svg.append('text')
            .attr('dy', '1.5em')
            .style('text-anchor', 'middle')
            .attr('class', 'pie-chart-data')
            .text(function(d) {
                return 'total boots';
            });
    }

    $('#success-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Successful boot">' + success + '</span>'
        ).css('border-bottom-color', color[0]);
    $('#fail-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Failed boot">' + fail + '</span>'
        ).css('border-bottom-color', color[1]);
    $('#unknown-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Unknown status">' + unknown + '</span>'
        ).css('border-bottom-color', color[2]);
}

function populateBootsPage(data) {
    'use strict';

    var localData = data.result,
        len = localData.length,
        fileServer = $('#file-server').val(),
        panel = '',
        cls,
        defconfigFull,
        job,
        kernel,
        board,
        label,
        arch,
        i = 0,
        bootObj = null,
        bootObjId,
        hasFailed = false,
        hasSuccess = false,
        hasUnknown = false,
        bootTime = null,
        labName,
        allLabs = {},
        lab,
        fileServerUrl = null,
        fileServerResource = null,
        fileServerUri = null,
        uriPath = null,
        pathUrl = null,
        logPath = null,
        bootLog,
        bootLogHtml,
        failLabel = '<span class="pull-right label label-danger">' +
            '<li class="fa fa-exclamation-triangle"></li></span>',
        successLabel = '<span class="pull-right label label-success">' +
            '<li class="fa fa-check"></li></span>',
        unknownLabel = '<span class="pull-right label label-warning">' +
            '<li class="fa fa-question"></li></span>',
        toAppend = '',
        archLabel = '';

    if (len > 0) {
        for (i; i < len; i = i + 1) {
            bootObj = localData[i];
            defconfigFull = bootObj.defconfig_full;
            arch = bootObj.arch;
            job = bootObj.job;
            kernel = bootObj.kernel;
            board = bootObj.board;
            labName = bootObj.lab_name;
            bootObjId = bootObj._id;
            arch = bootObj.arch;
            fileServerUrl = bootObj.file_server_url;
            fileServerResource = bootObj.file_server_resource;
            bootLog = bootObj.boot_log;
            bootLogHtml = bootObj.boot_log_html;

            if (fileServerUrl !== null && fileServerUrl !== undefined) {
                fileServer = fileServerUrl;
            }

            if (fileServerResource !== null &&
                    fileServerResource !== undefined) {
                pathUrl = fileServerResource;
            } else {
                pathUrl = job + '/' + kernel + '/' +
                    arch + '-' + defconfigFull + '/';
                fileServerResource = null;
            }

            fileServerUri = new URI(fileServer);
            uriPath = fileServerUri.path() + '/' + pathUrl;

            switch (bootObj.status) {
                case 'FAIL':
                    hasFailed = true;
                    label = failLabel;
                    cls = 'df-failed';
                    break;
                case 'PASS':
                    hasSuccess = true;
                    label = successLabel;
                    cls = 'df-success';
                    break;
                default:
                    hasUnknown = true;
                    label = unknownLabel;
                    cls = 'df-unknown';
                    break;
            }

            if (arch !== null) {
                archLabel = '&nbsp;&dash;&nbsp;' +
                    '<span class="arch-label">' + arch + '</span>';
            }

            panel = '<div class="panel panel-default ' + cls + '">' +
                '<div class="panel-heading" data-toggle="collapse" ' +
                    'id="panel-boots' + i + '" ' +
                    'data-parent="accordion' + labName + '" ' +
                    'data-target="#collapse-boots' + i + '">' +
                    '<h4 class="panel-title">' +
                    '<a data-toggle="collapse" ' +
                    'data-parent="#accordion' + labName + '" ' +
                    'href="#collapse-boots' + i + '">' +
                    board + '&nbsp;<small>' + defconfigFull + '</small>' +
                    '</a>' + archLabel + label +
                    '</h4></div>' +
                    '<div id="collapse-boots' + i +
                    '" class="panel-collapse collapse">' +
                    '<div class="panel-body">';

            panel += '<div class="row">';
            panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
            panel += '<dl class="dl-horizontal">';

            panel += '<dt>Endianness</dt>';
            if (bootObj.endian !== null) {
                panel += '<dd>' + bootObj.endian + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '<dt>Kernel image</dt>';
            if (bootObj.kernel_image !== null) {
                panel += '<dd>' +
                    '<a href="' +
                    fileServerUri.path(uriPath + '/' + bootObj.kernel_image)
                        .normalizePath().href() +
                    '">' + bootObj.kernel_image +
                    '&nbsp;<i class="fa fa-external-link"></i></a>' +
                    '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '</dl></div>';
            panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
            panel += '<dl class="dl-horizontal">';

            panel += '<dt>Warnings</dt>';
            if (bootObj.warnings !== null) {
                panel += '<dd>' + bootObj.warnings + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '<dt>Boot time</dt>';
            if (bootObj.time !== null) {
                bootTime = new Date(bootObj.time.$date);
                panel += '<dd>' + bootTime.getCustomTime() + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            if (bootLog !== null || bootLogHtml !== null) {
                panel += '<dt>Boot log</dt>';
                panel += '<dd>';

                if (bootLog !== null) {
                    if (bootLog.search(labName) === -1) {
                        logPath = uriPath + '/' + labName + '/' + bootLog;
                    } else {
                        logPath = uriPath + '/' + bootLog;
                    }
                    panel += '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="View raw text boot log"><a href="' +
                        fileServerUri.path(logPath).normalizePath().href() +
                        '">txt&nbsp;<i class="fa fa-external-link"></i></a>' +
                        '</span>';
                }

                if (bootLogHtml !== null) {
                    if (bootLog !== null) {
                        panel += '&nbsp;&mdash;&nbsp;';
                    }
                    if (bootLogHtml.search(labName) === -1) {
                        logPath = uriPath + '/' + labName + '/' + bootLogHtml;
                    } else {
                        logPath = uriPath + '/' + bootLogHtml;
                    }
                    panel += '<span rel="tooltip" data-toggle="tooltip" ' +
                        'title="View HTML boot log"><a href="' +
                        fileServerUri.path(logPath).normalizePath().href() +
                        '">html&nbsp;<i class="fa fa-external-link"></i>' +
                        '</a></span>';
                }

                panel += '</dd>';
            }

            panel += '</dl></div>';

            panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
            panel += '<div class="pull-center">' +
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
            panel += '</div></div>';

            panel += '</div>';
            panel += '</div></div></div>\n';

            if (allLabs.hasOwnProperty(labName)) {
                allLabs[labName].push(panel);
            } else {
                allLabs[labName] = [];
                allLabs[labName].push(panel);
            }
        }

        // Make sure it is clean.
        toAppend = '';
        Object.keys(allLabs).sort().forEach(function(element, index, array) {
            lab = allLabs[element];
            len = lab.length;

            toAppend += '<div id="' + element + '">' +
                '<div class="other-header">' +
                '<h4>Lab&nbsp;&#171;' + element + '&#187;</h4>' +
                '<span class="pull-right" id="view-eye-' + element +
                '">' +
                createHideShowButton(element, 'hide') +
                '</span><hr class="blurred subheader" /></div>' +
                '<div id="view-' + element + '" class="pull-center"></div>' +
                '<div class="panel-group" id="accordion' + element + '">';

            for (i = 0; i < len; i = i + 1) {
                toAppend += lab[i];
            }
            toAppend += '</div></div>';
        });

        $('#accordion-container').empty().append(toAppend);

        if (hasFailed) {
            $('#fail-btn').removeAttr('disabled');
        }

        if (hasSuccess) {
            $('#success-btn').removeAttr('disabled');
        }

        if (hasUnknown) {
            $('#unknown-btn').removeAttr('disabled');
        }

        $('#all-btn').removeAttr('disabled');
        if (searchFilter !== '' && searchFilter !== null &&
                searchFilter !== undefined) {
            if (searchFilter.length > 0) {
                switch (searchFilter) {
                    case 'fail':
                        showHideBoots(document.getElementById('fail-cell'));
                        break;
                    case 'success':
                        showHideBoots(document.getElementById('success-cell'));
                        break;
                    case 'unknown':
                        showHideBoots(document.getElementById('unknown-cell'));
                        break;
                }
            }
        } else if (!WebStorage.load('boot' + jobName + kernelName)) {
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
        $('#accordion-container').empty().append(
            '<div class="pull-center"><strong>No boards tested.' +
            '<strong></div>'
        );
    }
}

function ajaxDefconfigGetFailed() {
    'use strict';
    JSBase.replaceContentByID(
        '#accordion-container',
        '<div class="text-center"><h3>Error loading data.</h3></div>'
    );
}

function ajaxJobGetFailed() {
    'use strict';
    JSBase.replaceContentByClass(
        '.loading-content',
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>'
    );
}

function populateJobData(data) {
    'use strict';
    var localData = data.result,
        localResult = null,
        dataLen = localData.length,
        gitCommit = null,
        gitUrl = null,
        gitUrls = null;

    if (dataLen > 0) {
        localResult = localData[0];
        gitCommit = localResult.git_commit;
        gitUrl = localResult.git_url;

        gitUrls = JSBase.translateCommitURL(gitUrl, gitCommit);

        $('#tree').empty().append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot reports details for ' + jobName + '">' +
            '<a href="/boot/all/job/' + jobName + '/">' + jobName +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for tree ' + jobName + '">' +
            '<a href="/job/' + jobName + '/">' +
            '<i class="fa fa-sitemap"></i></a></span>'
        );

        $('#git-branch').empty().append(localResult.git_branch);

        $('#git-describe').empty().append(
            kernelName +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build ' + jobName + '&nbsp;&dash;&nbsp;' +
            kernelName + '">' +
            '<a href="/build/' + jobName + '/kernel/' + kernelName + '/">' +
            '<i class="fa fa-cube"></i></a></span>'
        );

        if (gitUrls[0] !== null) {
            $('#git-url').empty().append(
                '<a href="' + gitUrls[0] + '">' + gitUrl +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (gitUrl !== null) {
                $('#git-url').empty().append(gitUrl);
            } else {
                $('#git-url').empty().append(nonAvail);
            }
        }

        if (gitUrls[1] !== null) {
            $('#git-commit').empty().append(
                '<a href="' + gitUrls[1] + '">' + gitCommit +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (gitCommit !== null) {
                $('#git-commit').empty().append(gitCommit);
            } else {
                $('#git-commit').empty().append(nonAvail);
            }
        }
    } else {
        ajaxJobGetFailed();
    }
}

function getBootData(data) {
    'use strict';

    var localData = data.result,
        localResult = null,
        dataLen = localData.length,
        ajaxData,
        ajaxDeferredCall,
        errorReason = 'Boot data call failed';

    if (dataLen > 0) {
        localResult = localData[0];

        ajaxData = {
            'sort': ['defconfig_full', 'arch'],
            'sort_order': 1,
            'job': jobName,
            'kernel': kernelName,
            'job_id': localResult._id.$oid
        };

        ajaxDeferredCall = JSBase.createDeferredCall(
            '/_ajax/boot',
            'GET',
            ajaxData,
            null,
            ajaxDefconfigGetFailed,
            errorReason,
            null,
            'boot-call'
        );

        $.when(ajaxDeferredCall)
            .done(populateBootsPage)
            .done(createPieChart)
            .done(populateUniqueCounts);
    } else {
        ajaxDefconfigGetFailed();
    }
}

$(document).ready(function() {
    'use strict';
    $('#li-boot').addClass('active');

    var ajaxDeferredCall = null,
        ajaxData = null,
        errorReason = 'Job data call failed';

    ajaxData = {
        'job': jobName,
        'kernel': kernelName
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/job',
        'GET',
        ajaxData,
        null,
        ajaxJobGetFailed,
        errorReason
    );

    $.when(ajaxDeferredCall)
        .done(populateJobData)
        .done(getBootData);
});

$(document).ready(function() {
    // No use strict here or onbeforeunload is not recognized.
    var sessionState = new WebStorage.SessionState(
        'boot' + jobName + kernelName
    );
    onbeforeunload = function() {

        var panelState = {},
            pageState;

        $('[id^="panel-boots"]').each(function(id) {
            panelState['#panel-boots' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#panel-boots' + id).attr('class')
            };
        });

        $('[id^="collapse-boots"]').each(function(id) {
            panelState['#collapse-boots' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#collapse-boots' + id).attr('class')
            };
        });

        pageState = {
            '.df-success': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-success').attr('style')
            },
            '.df-failed': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-failed').attr('style')
            },
            '.df-unknown': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-unknown').attr('style')
            },
            '#all-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#all-btn').attr('class')
            },
            '#success-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#success-btn').attr('class')
            },
            '#fail-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#fail-btn').attr('class')
            },
            '#unknown-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#unknown-btn').attr('class')
            }
        };

        sessionState.objects = JSBase.collectObjects(panelState, pageState);
        WebStorage.save(sessionState);
    };
});
