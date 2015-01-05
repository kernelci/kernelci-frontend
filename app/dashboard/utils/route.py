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

import dashboard.views.generic as vgeneric
import dashboard.views.about as vabout
import dashboard.views.boot as vboot
import dashboard.views.build as vbuild
import dashboard.views.index as vindex
import dashboard.views.job as vjob


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
        view_func=vabout.AboutView.as_view("about"),
        methods=["GET"]
    )
    add_rule(
        "/faq/",
        view_func=vgeneric.FaqView.as_view("faq"),
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
        "/boot/all/lab/<string:lab_name>/",
        view_func=vboot.BootLab.as_view("boot-lab"),
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
        "/boot/<string:board>/job/<string:job>/",
        view_func=vboot.BootBoardJobView.as_view("boot-board-job"),
        methods=["GET"]
    )
