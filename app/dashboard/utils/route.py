# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from flask import current_app as app

import dashboard.views.boot as vboot
import dashboard.views.build as vbuild
import dashboard.views.compare as vcompare
import dashboard.views.generic as vgeneric
import dashboard.views.index as vindex
import dashboard.views.job as vjob
import dashboard.views.soc as vsoc

import dashboard.utils.feed.job as jobfeed
import dashboard.utils.feed.boot as bootfeed
import dashboard.utils.feed.soc as socfeed


def init():
    # Save the function.
    add_rule = app.add_url_rule

    # General URLs.
    add_rule(
        "/",
        view_func=vindex.IndexView.as_view("index"),
        methods=["GET"]
    )
    add_rule(
        "/info/",
        view_func=vgeneric.AboutView.as_view("about"),
        methods=["GET"]
    )
    add_rule(
        "/faq/",
        view_func=vgeneric.FaqView.as_view("faq"),
        methods=["GET"]
    )
    add_rule(
        "/contact/",
        view_func=vgeneric.ContactView.as_view("contact"),
        methods=["GET"]
    )
    add_rule(
        "/stats/",
        view_func=vgeneric.StatisticsView.as_view("stats"),
        methods=["GET"]
    )
    add_rule(
        "/sponsors/",
        view_func=vgeneric.SponsorsView.as_view("sponsors"),
        methods=["GET"]
    )

    # Builds related URLs.
    add_rule(
        "/build/",
        view_func=vbuild.BuildsAllView.as_view("builds"),
        methods=["GET"],
    )
    add_rule(
        "/build/all/",
        view_func=vbuild.BuildsAllView.as_view("all-builds"),
        methods=["GET"]
    )
    add_rule(
        "/build/<string:job>/kernel/<string:kernel>/",
        view_func=vbuild.BuildsJobKernelView.as_view("job-kernel-builds"),
        methods=["GET"]
    )
    add_rule(
        (
            "/build/<string:job>/kernel/<string:kernel>"
            "/defconfig/<string:defconfig>/"
        ),
        view_func=vbuild.BuildsJobKernelDefconfigView.as_view(
            "job-kernel-defconf"),
        methods=["GET"]
    )
    add_rule(
        (
            "/build/<string:job>/kernel/<string:kernel>"
            "/defconfig/<string:defconfig>/logs/"
        ),
        view_func=vbuild.BuildsLogsView.as_view("job-kernel-defconf-logs"),
        methods=["GET"]
    )
    add_rule(
        "/build/<string:job>/",
        view_func=vjob.JobsJobView.as_view("build-job"),
        methods=["GET"]
    )

    # Jobs related URLs
    add_rule(
        "/job/",
        view_func=vjob.JobsAllView.as_view("all-jobs"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/",
        view_func=vjob.JobsJobView.as_view("job-name"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/feed.xml",
        "job-feed",
        jobfeed.job_feed,
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/branch/<string:branch>/",
        view_func=vjob.JobsJobBranchView.as_view("job-branch"),
        methods=["GET"]
    )
    add_rule(
        "/job/<string:job>/branch/<string:branch>/feed.xml",
        "job-branch-feed",
        jobfeed.job_branch_feed,
        methods=["GET"]
    )

    # Boots related URLs.
    add_rule(
        "/boot/",
        view_func=vboot.BootAllView.as_view("boots"),
        methods=["GET"]
    )
    add_rule(
        "/boot/all/",
        view_func=vboot.BootAllView.as_view("all-boots"),
        methods=["GET"]
    )
    add_rule(
        (
            "/boot/all/job/<string:job>/kernel/<string:kernel>/"
            "defconfig/<string:defconfig>/"
        ),
        view_func=vboot.BootAllJobKernelDefconfigView.as_view("boot-all-jkd"),
        methods=["GET"]
    )
    add_rule(
        (
            "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/"
            "defconfig/<string:defconfig>/"
        ),
        view_func=vboot.BootDefconfigView.as_view("boot-defconfig"),
        methods=["GET"]
    )
    add_rule(
        (
            "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/"
            "defconfig/<string:defconfig>/lab/<string:lab_name>/"
        ),
        view_func=vboot.BootIdView.as_view("boot-id"),
        methods=["GET"]
    )
    add_rule(
        "/boot/all/job/<string:job>/kernel/<string:kernel>/",
        view_func=vboot.BootJobKernelView.as_view("boot-job-kernel"),
        methods=["GET"]
    )
    add_rule(
        "/boot/all/job/<string:job>/",
        view_func=vboot.BootJobView.as_view("boot-job"),
        methods=["GET"]
    )
    add_rule(
        "/boot/all/job/<string:job>/feed.xml",
        "boot-all-job-feed",
        bootfeed.get_boot_all_job_feed,
        methods=["GET"]
    )
    add_rule(
        "/boot/all/lab/<string:lab_name>/",
        view_func=vboot.BootLab.as_view("boot-lab"),
        methods=["GET"]
    )
    add_rule(
        "/boot/all/lab/<string:lab_name>/feed.xml",
        "boot-all-lab-feed",
        bootfeed.get_boot_all_lab_feed,
        methods=["GET"]
    )
    add_rule(
        "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/",
        view_func=vboot.BootBoardJobKernelView.as_view(
            "boot-board-job-kernel"),
        methods=["GET"]
    )
    add_rule(
        "/boot/<string:board>/",
        view_func=vboot.BootBoardView.as_view("boot-board"),
        methods=["GET"]
    )
    add_rule(
        "/boot/<string:board>/feed.xml",
        "boot-board-feed",
        bootfeed.get_boot_board_feed,
        methods=["GET"]
    )
    add_rule(
        "/boot/<string:board>/job/<string:job>/",
        view_func=vboot.BootBoardJobView.as_view("boot-board-job"),
        methods=["GET"]
    )
    add_rule(
        "/boot/<string:board>/job/<string:job>/feed.xml",
        "boot-board-job-feed",
        bootfeed.get_boot_board_job_feed,
        methods=["GET"]
    )

    add_rule(
        "/compare/",
        view_func=vcompare.ChooseCompareView.as_view("choose-compare"),
        methods=["GET"]
    )
    add_rule(
        "/compare/job/<string:compare_id>/",
        view_func=vcompare.JobCompareView.as_view("job-compare"),
        methods=["GET"]
    )
    add_rule(
        "/compare/build/<string:compare_id>/",
        view_func=vcompare.BuildCompareView.as_view("build-compare"),
        methods=["GET"]
    )

    # SoCs views.
    add_rule(
        "/soc/",
        view_func=vsoc.SocsAllView.as_view("socs-all-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/",
        view_func=vsoc.SocsSocView.as_view("socs-soc-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/feed.xml",
        "socs-soc-feed",
        socfeed.soc_feed,
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/",
        view_func=vsoc.SocsSocJobView.as_view("socs-soc-job-view"),
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/feed.xml",
        "socs-soc-job-feed",
        socfeed.soc_job_feed,
        methods=["GET"]
    )
    add_rule(
        "/soc/<string:soc>/job/<string:job>/kernel/<string:kernel>/",
        view_func=vsoc.SocsSocJobKernelView.as_view(
            "socs-soc-job-kernel-view"),
        methods=["GET"]
    )
