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
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'utils/urls',
    'utils/bisect',
    'utils/html',
    'utils/table',
    'tables/test',
    'tables/job',
    'utils/date',
    'URI',
], function($, init, format, e, r, urls, bisect, html, table, ttest, jobt,
            date, URI) {
    'use strict';
    var gFileServer;
    var gBuildId;

    setTimeout(function() {
        document.getElementById('li-build').setAttribute('class', 'active');
    }, 15);

    function getBisectFail() {
        html.removeElement(
            document.getElementById('bisect-loading-div'));
        html.replaceContent(
            document.getElementById('bisect-content'),
            html.errorDiv('Error loading bisect data.'));
        html.removeClass(document.getElementById('bisect-content'), 'hidden');
    }

    function getBisectToMainlineFail() {
        html.removeElement(
            document.getElementById('bisect-compare-loading-div'));
        html.replaceContent(
            document.getElementById('bisect-compare-content'),
            html.errorDiv('Error loading bisect data.'));
        html.removeClass(
            document.getElementById('bisect-compare-content'), 'hidden');
    }

    function getBisectToMainline(bisectData, build) {
        var deferred;
        var settings;

        settings = {
            showHideID: 'buildb-compare-showhide',
            tableDivID: 'table-compare-div',
            tableID: 'bisect-compare-table',
            tableBodyID: 'bisect-compare-table-body',
            contentDivID: 'bisect-compare-content',
            loadingDivID: 'bisect-compare-loading-div',
            loadingContentID: 'bisect-compare-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: null,
            goodCommitID: null,
            bisectScriptContainerID: 'dl-bisect-compare-script',
            bisectScriptContentID: 'bisect-compare-script',
            bisectCompareDescriptionID: 'bisect-compare-description',
            prevBisect: bisectData,
            bisectShowHideID: 'bisect-compare-hide-div',
            isCompared: true
        };

        setTimeout(function() {
            deferred = r.get(
                '/_ajax/bisect?collection=build&' +
                    'compare_to=mainline&build_id=' + build,
                {}
            );

            $.when(deferred)
                .fail(e.error, getBisectToMainlineFail)
                .done(function(data) {
                    settings.data = data;
                    bisect(settings).draw();
                });
        }, 10);
    }

    function getBisectCompareTo(response) {
        var bisectData;
        var result;

        result = response.result;
        if (result.length === 0) {
            html.removeElement(document.getElementById('bisect-compare-div'));
        } else {
            bisectData = result[0];
            if (bisectData.job !== 'mainline') {
                html.removeClass(
                    document.getElementById('bisect-compare-div'), 'hidden');
                getBisectToMainline(bisectData, bisectData.build_id.$oid);
            } else {
                html.removeElement(
                    document.getElementById('bisect-compare-div'));
            }
        }
    }

    function getBisectDone(response) {
        var settings;

        settings = {
            showHideID: 'buildb-showhide',
            tableDivID: 'table-div',
            tableID: 'bisect-table',
            tableBodyID: 'bisect-table-body',
            contentDivID: 'bisect-content',
            loadingDivID: 'bisect-loading-div',
            loadingContentID: 'bisect-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: 'bad-commit',
            goodCommitID: 'good-commit',
            bisectScriptContainerID: 'dl-bisect-script',
            bisectScriptContentID: 'bisect-script',
            bisectCompareDescriptionID: null,
            prevBisect: null,
            bisectShowHideID: 'bisect-hide-div',
            data: response
        };

        bisect(settings).draw();
    }

    function getBisect(response) {
        var deferred;
        var results;

        results = response.result;
        if (results.length === 0) {
            html.removeElement(document.getElementById('bisect-div'));
        } else {
            results = response.result[0];
            if (results.status === 'FAIL') {
                html.removeClass(document.getElementById('bisect'), 'hidden');
                html.removeClass(
                    document.getElementById('bisect-div'), 'hidden');

                setTimeout(function() {
                    deferred = r.get(
                        '/_ajax/bisect?collection=build&build_id=' +
                            results._id.$oid,
                        {}
                    );
                    $.when(deferred)
                        .fail(e.error, getBisectFail)
                        .done(getBisectDone, getBisectCompareTo);
                }, 10);
            } else {
                html.removeElement(document.getElementById('bisect-div'));
            }
        }
    }

    function testsTable(data) {
        var countClasses = [
            ['total', ''],
            ['success', 'alert-success'],
            ['fail', 'alert-danger'],
            ['unknown', 'alert-warning']
        ];
        var columns;

        function _testColumnTitle() {
            var tooltipNode;

            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Total/Successful/Regressions/Other test results');
            tooltipNode.appendChild(
                document.createTextNode('Test Results'));

            return tooltipNode.outerHTML;
        }

        function _renderTestCount(data, type) {
            if (type == 'display') {
                var divNode;

                divNode = document.createElement('div');

                countClasses.forEach(function(count) {
                    var value = data[count[0]];
                    var className = count[1];
                    var spanNode;

                    spanNode = document.createElement('span');
                    spanNode.className = "badge count-badge " + className;
                    spanNode.appendChild(document.createTextNode(value));
                    divNode.appendChild(spanNode);
                });

                return divNode.outerHTML;
            }

            return data;
        }

        function _renderPlanStatus(data, type) {
            if (type == "display") {
                return ttest.statusNode(data).outerHTML;
            }

            return data;
        }

        columns = [
            {
                data: 'name',
                title: 'Test Plan',
                type: 'string',
                className: 'plan-column',
            },
            {
                data: 'device_type',
                title: 'Device Type',
                type: 'string',
                className: 'device-type-column',
            },
            {
                data: 'counts',
                title: _testColumnTitle(),
                type: 'string',
                searchable: false,
                orderable: false,
                className: 'test-count pull-center',
                render: _renderTestCount,
            },
            {
                data: 'status',
                title: 'Status',
                type: 'string',
                searchable: false,
                orderable: false,
                className: 'pull-center',
                render: _renderPlanStatus,
            },
        ];

        table({
            tableId: 'tests-table',
            tableLoadingDivId: 'table-loading',
            tableDivId: 'tests-table-div'
        })
            .data(data)
            .columns(columns)
            .order([0, 'asc'])
            .languageLengthMenu('Tests per page')
            .rowURL('/test/plan/id/%(id)s/')
            .rowURLElements(['id'])
            .draw();
    }

    function testDataDone(runResults, countResults, statusResults) {
        var runs = runResults;
        var counts = countResults[0].result;
        var status = statusResults[0].result;
        var dataMap = {};

        runs.forEach(function(run) {
            var id = run._id.$oid;
            var datum = {
                'id': run._id.$oid,
                'name': run.name,
                'device_type': run.device_type,
                'counts': {},
                'status': 'UNKNOWN',
            };

            dataMap[id] = datum;
        });

        counts.forEach(function(count) {
            var opId = count.operation_id;
            var planId = opId[0];
            var countId = opId[1];

            dataMap[planId]['counts'][countId] = count.result[0].count;
        });

        status.forEach(function(stat) {
            var planId = stat.operation_id[0];

            dataMap[planId]['status'] = stat.result[0].count ? "FAIL" : "PASS";
        });

        testsTable(Object.values(dataMap));
    }

    function getBatchTestStatus(results) {
        var batchOps;

        function createBatchOp(result) {
            var qStr;

            qStr = URI.buildQuery({
                'job': result.job,
                'kernel': result.kernel,
                'git_branch': result.git_branch,
                'plan': result.name,
                'device_type': result.device_type,
                'lab_name': result.lab_name,
                'build_environment': result.build_environment,
                'defconfig_full': result.defconfig_full,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [result._id.$oid, 'status'],
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });
        }

        batchOps = [];
        results.forEach(createBatchOp);

        return r.post('/_ajax/batch', JSON.stringify({batch: batchOps}));
    }

    function getBatchTestCount(results) {
        var batchOps;

        function createBatchOp(result) {
            var qStr;

            qStr = URI.buildQuery({
                'job': result.job,
                'kernel': result.kernel,
                'git_branch': result.git_branch,
                'plan': result.name,
                'device_type': result.device_type,
                'lab_name': result.lab_name,
                'build_environment': result.build_environment,
                'defconfig_full': result.defconfig_full,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [result._id.$oid, 'total'],
                resource: 'count',
                document: 'test_case',
                query: qStr,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [result._id.$oid, 'success'],
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=PASS',
            });

            batchOps.push({
                method: 'GET',
                operation_id: [result._id.$oid, 'fail'],
                resource: 'count',
                document: 'test_regression',
                query: qStr,
            });

            batchOps.push({
                method: 'GET',
                operation_id: [result._id.$oid, 'unknown'],
                resource: 'count',
                document: 'test_case',
                query: qStr + '&status=FAIL&status=SKIP&regression_id=null',
            });
        }

        batchOps = [];
        results.forEach(createBatchOp);
        return r.post('/_ajax/batch', JSON.stringify({batch: batchOps}));
    }

    function testsError(msg) {
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('tests-table-div'),
            html.errorDiv(msg)
        );
    }

    function getTestsFail() {
        testsError("Error loading test results.");
    }

    function getTestsDone(response) {
        var results = response.result;

        if (results.length === 0) {
            testsError("No test results found.");
            return;
        }

        $.when(
            results,
            getBatchTestCount(results),
            getBatchTestStatus(results)
        ).fail(e.error, getTestsFail).then(testDataDone);
    }

    function getTests(response) {
        var build;
        var deferred;
        var reqData;

        if (response.result.length === 0) {
            getTestsFail();
            return;
        }

        build = response.result[0];

        reqData = {
            parent_id: 'null',
            sort: 'created_on',
            sort_order: -1,
            build_id: build._id.$oid,
        };

        deferred = r.get('/_ajax/test/group', reqData);
        $.when(deferred)
            .fail(e.error, getTestsFail)
            .done(getTestsDone);
    }

    function getBuildsFail() {
        html.removeElement(document.getElementById('bisect-div'));
        html.removeElement(document.getElementById('table-loading'));
        html.replaceContent(
            document.getElementById('tests-table-div'),
            html.errorDiv('Error loading data.'));
        html.replaceByClassNode('loading-content', html.nonavail());
    }

    function getBuildsDone(response) {
        var aNode;
        var arch;
        var branch;
        var bssSize;
        var buildLog;
        var buildLogSize;
        var buildModules;
        var buildModulesSize;
        var buildPlatform;
        var buildTime;
        var compiler;
        var compilerVersion;
        var compilerVersionFull;
        var configFragments;
        var createdOn;
        var crossCompile;
        var dataSize;
        var defconfig;
        var defconfigFull;
        var defconfigNode;
        var divNode;
        var docFrag;
        var dtb;
        var fileServerURI;
        var fileServerURL;
        var gitCommit;
        var gitURL;
        var gitURLs;
        var job;
        var kernel;
        var kernelConfig;
        var kernelConfigSize;
        var kernelImage;
        var kernelImageSize;
        var pathURI;
        var results;
        var spanNode;
        var systemMap;
        var systemMapSize;
        var str;
        var textOffset;
        var tooltipNode;
        var translatedUri;
        var txtSize;
        var vmlinuxFileSize;

        results = response.result;

        function _createSizeNode(size) {
            var frag;
            var sizeNode;

            frag = document.createDocumentFragment();
            sizeNode = frag.appendChild(document.createElement('small'));

            sizeNode.appendChild(document.createTextNode('('));
            sizeNode.appendChild(document.createTextNode(format.bytes(size)));
            sizeNode.appendChild(document.createTextNode(')'));

            return frag;
        }

        if (results.length === 0) {
            document.getElementById('details')
                .insertAdjacentHTML('beforeend', '&hellip;');
            html.removeElement('bisect-div');
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('tests-table-div'),
                html.errorDiv('No data available.'));
            html.replaceByClassTxt('loading-content', '?');
        } else {
            // We only have 1 result!
            results = response.result[0];
            job = results.job;
            kernel = results.kernel;
            branch = results.git_branch;
            gitURL = results.git_url;
            gitCommit = results.git_commit;
            createdOn = new Date(results.created_on.$date);
            arch = results.arch;
            defconfig = results.defconfig;
            defconfigFull = results.defconfig_full;
            buildTime = results.build_time;
            dtb = results.dtb_dir;
            buildModules = results.modules;
            buildModulesSize = results.modules_size;
            textOffset = results.text_offset;
            configFragments = results.kconfig_fragments;
            kernelImage = results.kernel_image;
            kernelImageSize = results.kernel_image_size;
            kernelConfig = results.kernel_config;
            kernelConfigSize = results.kernel_config_size;
            buildLog = results.build_log;
            buildLogSize = results.build_log_size;
            buildPlatform = results.build_platform;
            fileServerURL = results.file_server_url;
            compiler = results.compiler;
            compilerVersion = results.compiler_version;
            compilerVersionFull = results.compiler_version_full;
            crossCompile = results.cross_compile;
            vmlinuxFileSize = results.vmlinux_file_size;
            bssSize = results.vmlinux_bss_size;
            dataSize = results.vmlinux_data_size;
            txtSize = results.vmlinux_text_size;
            systemMap = results.system_map;
            systemMapSize = results.system_map_size;

            // The body title.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            spanNode.insertAdjacentHTML('beforeend', '&#171;');
            spanNode.appendChild(document.createTextNode(job));
            spanNode.insertAdjacentHTML('beforeend', '&#187;');
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&ndash;&nbsp;');
            spanNode.appendChild(document.createTextNode(kernel));
            spanNode.insertAdjacentHTML('beforeend', '&nbsp;');

            defconfigNode = spanNode.appendChild(
                document.createElement('small'));
            str = '(';
            str += branch;
            str += '&nbsp;&ndash;&nbsp;';
            str += defconfig;
            str += ')';
            defconfigNode.insertAdjacentHTML('beforeend', str);

            document.getElementById('details').appendChild(docFrag);

            if (!fileServerURL) {
                fileServerURL = gFileServer;
            }

            translatedUri = urls.createFileServerURL(fileServerURL, results);
            fileServerURI = translatedUri[0];
            pathURI = translatedUri[1];

            gitURLs = urls.translateCommit(gitURL, gitCommit);

            // Tree.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            tooltipNode = spanNode.appendChild(html.tooltip());

            aNode = tooltipNode.appendChild(document.createTextNode(job));

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            str = 'Test reports for ';
            str += '&nbsp;';
            str += job;
            tooltipNode.setAttribute('title', str);

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/job/';
            str += job;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.tree());

            html.replaceContent(document.getElementById('tree'), docFrag);

            // Branch.
            html.replaceContent(
                document.getElementById('git-branch'),
                document.createTextNode(branch));

            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));

            // Describe.
            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.title =
                "Build reports for &#171;" + job + "&#187; - " + kernel;
            aNode = document.createElement('a');
            aNode.href = "/build/" + job + "/kernel/" + kernel;
            aNode.appendChild(html.build());
            tooltipNode.appendChild(document.createTextNode(kernel));
            tooltipNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');
            tooltipNode.appendChild(aNode);

            spanNode.insertAdjacentHTML('beforeend', '&nbsp;&mdash;&nbsp;');

            tooltipNode = spanNode.appendChild(html.tooltip());
            tooltipNode.title =
               "Test reports for &#171;" + job + "&#187; - " + kernel;

            aNode = tooltipNode.appendChild(document.createElement('a'));
            str = '/test/job/';
            str += job;
            str += '/branch/';
            str += branch;
            str += '/kernel/';
            str += kernel;
            str += '/';
            aNode.setAttribute('href', str);
            aNode.appendChild(html.boot());

            html.replaceContent(
                document.getElementById('git-describe'), docFrag);

            if (gitURLs[0] !== null) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', gitURLs[0]);
                aNode.appendChild(document.createTextNode(gitURL));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-url'), docFrag);
            } else {
                if (gitURL !== null) {
                    html.replaceContent(
                        document.getElementById('git-url'),
                        document.createTextNode(gitURL));
                } else {
                    html.replaceContent(
                        document.getElementById('git-url'), html.nonavail());
                }
            }

            if (gitURLs[1] !== null) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute('href', gitURLs[1]);
                aNode.appendChild(document.createTextNode(gitCommit));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('git-commit'), docFrag);
            } else {
                if (gitCommit !== null && gitCommit !== undefined) {
                    html.replaceContent(
                        document.getElementById('git-commit'),
                        document.createTextNode(gitCommit));
                } else {
                    html.replaceContent(
                        document.getElementById('git-commit'),
                        html.nonavail());
                }
            }

            if (crossCompile !== null && crossCompile !== undefined) {
                html.replaceContent(
                    document.getElementById('cross-compile'),
                    document.createTextNode(crossCompile));
            } else {
                html.replaceContent(
                    document.getElementById('cross-compile'),
                    html.nonavail());
            }

            if (compiler) {
                html.replaceContent(
                    document.getElementById('compiler'),
                    document.createTextNode(compiler));
            } else {
                html.replaceContent(
                    document.getElementById('compiler'), html.nonavail());
            }

            if (compilerVersion) {
                html.replaceContent(
                    document.getElementById('compiler-version'),
                    document.createTextNode(compilerVersion));
            } else {
                html.replaceContent(
                    document.getElementById('compiler-version'),
                    html.nonavail());
            }

            if (compilerVersionFull) {
                html.replaceContent(
                    document.getElementById('compiler-version-full'),
                    document.createTextNode(compilerVersionFull));
            } else {
                html.replaceContent(
                    document.getElementById('compiler-version-full'),
                    html.nonavail());
            }

            if (arch) {
                html.replaceContent(
                    document.getElementById('build-arch'),
                    document.createTextNode(arch));
            } else {
                html.replaceContent(
                    document.getElementById('build-arch'), html.nonavail());
            }

            html.replaceContent(
                document.getElementById('build-errors'),
                document.createTextNode(results.errors));

            html.replaceContent(
                document.getElementById('build-warnings'),
                document.createTextNode(results.warnings));

            if (buildTime !== null) {
                html.replaceContent(
                    document.getElementById('build-time'),
                    document.createTextNode(buildTime + 'sec.'));
            } else {
                html.replaceContent(
                    document.getElementById('build-time'), html.nonavail());
            }

            // Defconfig.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('span'));
            spanNode.appendChild(document.createTextNode(defconfigFull));

            html.replaceContent(
                document.getElementById('build-defconfig'), docFrag);

            // Date.
            docFrag = document.createDocumentFragment();
            spanNode = docFrag.appendChild(document.createElement('time'));
            spanNode.setAttribute('datetime', createdOn.toISOString());
            spanNode.appendChild(
                document.createTextNode(createdOn.toCustomISODateTime()));

            html.replaceContent(
                document.getElementById('build-date'), docFrag);

            // Status.
            docFrag = document.createDocumentFragment();
            tooltipNode = docFrag.appendChild(html.tooltip());
            switch (results.status) {
                case 'PASS':
                    tooltipNode.setAttribute('title', 'Build completed');
                    tooltipNode.appendChild(html.success());
                    break;
                case 'FAIL':
                    tooltipNode.setAttribute('title', 'Build failed');
                    tooltipNode.appendChild(html.fail());
                    break;
                default:
                    tooltipNode.setAttribute('title', 'Unknown status');
                    tooltipNode.appendChild(html.unknown());
                    break;
            }

            html.replaceContent(
                document.getElementById('build-status'), docFrag);

            if (dtb !== null && dtb !== undefined) {
                docFrag = document.createDocumentFragment();
                aNode = docFrag.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, dtb, '/']));
                aNode.appendChild(document.createTextNode(dtb));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                html.replaceContent(
                    document.getElementById('dtb-dir'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('dtb-dir'), html.nonavail());
            }

            if (buildModules !== null && buildModules !== undefined) {
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));

                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, buildModules]));
                aNode.appendChild(document.createTextNode(buildModules));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (buildModulesSize !== null &&
                        buildModulesSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(buildModulesSize));
                }

                html.replaceContent(
                    document.getElementById('build-modules'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('build-modules'), html.nonavail());
            }

            if (textOffset !== null && textOffset !== undefined) {
                html.replaceContent(
                    document.getElementById('text-offset'),
                    document.createTextNode(textOffset));
            } else {
                html.replaceContent(
                    document.getElementById('text-offset'), html.nonavail());
            }

            if (configFragments !== null && configFragments !== undefined) {
                docFrag = document.createDocumentFragment();
                tooltipNode = docFrag.appendChild(html.tooltip());
                tooltipNode.setAttribute('title', configFragments);
                tooltipNode.appendChild(
                    document.createTextNode(
                        html.sliceText(configFragments, 35)));

                html.replaceContent(
                    document.getElementById('config-fragments'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('config-fragments'),
                    html.nonavail());
            }

            if (vmlinuxFileSize !== null && vmlinuxFileSize !== undefined) {
                html.replaceContent(
                    document.getElementById('elf-file-size'),
                    document.createTextNode(format.bytes(vmlinuxFileSize)));
            } else {
                html.replaceContent(
                    document.getElementById('elf-file-size'), html.nonavail());
            }

            if (bssSize !== null && bssSize !== undefined) {
                html.replaceContent(
                    document.getElementById('elf-bss-size'),
                    document.createTextNode(format.bytes(bssSize)));
            } else {
                html.replaceContent(
                    document.getElementById('elf-bss-size'), html.nonavail());
            }

            if (dataSize !== null && dataSize !== undefined) {
                html.replaceContent(
                    document.getElementById('elf-data-size'),
                    document.createTextNode(format.bytes(dataSize)));
            } else {
                html.replaceContent(
                    document.getElementById('elf-data-size'), html.nonavail());
            }

            if (txtSize !== null && txtSize !== undefined) {
                html.replaceContent(
                    document.getElementById('elf-txt-size'),
                    document.createTextNode(format.bytes(txtSize)));
            } else {
                html.replaceContent(
                    document.getElementById('elf-txt-size'), html.nonavail());
            }

            if (kernelImage !== null && kernelImage !== undefined) {
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));

                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, kernelImage]));
                aNode.appendChild(document.createTextNode(kernelImage));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (kernelImageSize !== null &&
                        kernelImageSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(kernelImageSize));
                }

                html.replaceContent(
                    document.getElementById('kernel-image'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-image'), html.nonavail());
            }

            if (kernelConfig !== null && kernelConfig !== undefined) {
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));
                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, kernelConfig]));
                aNode.appendChild(document.createTextNode(kernelConfig));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (kernelConfigSize !== null &&
                        kernelConfigSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(kernelConfigSize));
                }

                html.replaceContent(
                    document.getElementById('kernel-config'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('kernel-config'), html.nonavail());
            }

            if (systemMap !== null && systemMap !== undefined) {
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));
                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, systemMap]));
                aNode.appendChild(document.createTextNode(systemMap));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (systemMapSize !== null && systemMapSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(systemMapSize));
                }

                html.replaceContent(
                    document.getElementById('system-map'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('system-map'), html.nonavail());
            }

            if (buildLog !== null && buildLog !== undefined) {
                docFrag = document.createDocumentFragment();
                spanNode = docFrag.appendChild(document.createElement('span'));

                aNode = spanNode.appendChild(document.createElement('a'));
                aNode.setAttribute(
                    'href',
                    urls.getHref(fileServerURI, [pathURI, buildLog]));
                aNode.appendChild(document.createTextNode(buildLog));
                aNode.insertAdjacentHTML('beforeend', '&nbsp;');
                aNode.appendChild(html.external());

                if (buildLogSize !== null && buildLogSize !== undefined) {
                    spanNode.insertAdjacentHTML('beforeend', '&nbsp;');
                    spanNode.appendChild(_createSizeNode(buildLogSize));
                }

                html.replaceContent(
                    document.getElementById('build-log'), docFrag);
            } else {
                html.replaceContent(
                    document.getElementById('build-log'), html.nonavail());
            }

            if (buildPlatform !== null && buildPlatform.length === 6) {
                html.replaceContent(
                    document.getElementById('platform-system'),
                    document.createTextNode(buildPlatform[0]));
                html.replaceContent(
                    document.getElementById('platform-node'),
                    document.createTextNode(buildPlatform[1]));
                html.replaceContent(
                    document.getElementById('platform-release'),
                    document.createTextNode(buildPlatform[2]));
                html.replaceContent(
                    document.getElementById('platform-full-release'),
                    document.createTextNode(buildPlatform[3]));
                html.replaceContent(
                    document.getElementById('platform-machine'),
                    document.createTextNode(buildPlatform[4]));
                html.replaceContent(
                    document.getElementById('platform-cpu'),
                    document.createTextNode(buildPlatform[5]));
            } else {
                docFrag = document.createDocumentFragment();
                divNode = docFrag.appendChild(document.createElement('div'));
                divNode.className = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
                divNode.appendChild(html.errorDiv('No data available.'));

                html.replaceContent(
                    document.getElementById('build-platform'), docFrag);
            }
        }
    }

    function getBuilds() {
        $.when(
            r.get('/_ajax/build', {id: gBuildId, nfield: ['dtb_dir_data']}))
                .fail(e.error, getBuildsFail)
                .done(getBuildsDone, getTests, getBisect);
    }

    if (document.getElementById('file-server') !== null) {
        gFileServer = document.getElementById('file-server').value;
    }
    if (document.getElementById('build-id') !== null) {
        gBuildId = document.getElementById('build-id').value;
    }

    setTimeout(getBuilds, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
