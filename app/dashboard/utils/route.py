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

import dashboard.views.about as vabout
import dashboard.views.boot as vboot
import dashboard.views.build as vbuild
import dashboard.views.index as vindex
import dashboard.views.job as vjob


def init(app):
    # General URLs.
    app.add_url_rule(
        "/",
        view_func=vindex.IndexView.as_view("index"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/info/",
        view_func=vabout.AboutView.as_view("about"),
        methods=["GET"]
    )

    # Builds related URLs.
    app.add_url_rule(
        "/build/",
        view_func=vbuild.BuildsAllView.as_view("builds"),
        methods=["GET"],
    )
    app.add_url_rule(
        "/build/all/",
        view_func=vbuild.BuildsAllView.as_view("all-builds"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/build/<string:job>/kernel/<string:kernel>/",
        view_func=vbuild.BuildsJobKernelView.as_view("job-kernel-builds"),
        methods=["GET"]
    )
    app.add_url_rule(
        (
            "/build/<string:job>/kernel/<string:kernel>"
            "/defconfig/<string:defconfig>/"
        ),
        view_func=vbuild.BuildsJobKernelDefconfigView.as_view(
            "job-kernel-defconf"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/build/<string:job>/",
        view_func=vjob.JobsJobView.as_view("build-job"),
        methods=["GET"]
    )

    # Jobs related URLs
    app.add_url_rule(
        "/job/",
        view_func=vjob.JobsAllView.as_view("all-jobs"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/job/<string:job>/",
        view_func=vjob.JobsJobView.as_view("job-name"),
        methods=["GET"]
    )

    # Boots related URLs.
    app.add_url_rule(
        "/boot/",
        view_func=vboot.BootAllView.as_view("boots"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/all/",
        view_func=vboot.BootAllView.as_view("all-boots"),
        methods=["GET"]
    )
    app.add_url_rule(
        (
            "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/"
            "defconfig/<string:defconfig>/"
        ),
        view_func=vboot.BootDefconfigView.as_view("boot-defconfig"),
        methods=["GET"]
    )
    app.add_url_rule(
        (
            "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/"
            "defconfig/<string:defconfig>/lab/<string:lab_name>/"
        ),
        view_func=vboot.BootIdView.as_view("boot-id"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/all/job/<string:job>/kernel/<string:kernel>/",
        view_func=vboot.BootJobKernelView.as_view("boot-job-kernel"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/all/job/<string:job>/",
        view_func=vboot.BootJobView.as_view("boot-job"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/all/lab/<string:lab_name>/",
        view_func=vboot.BootLab.as_view("boot-lab"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/<string:board>/job/<string:job>/kernel/<string:kernel>/",
        view_func=vboot.BootBoardJobKernelView.as_view(
            "boot-board-job-kernel"),
        methods=["GET"]
    )
    app.add_url_rule(
        "/boot/<string:board>/",
        view_func=vboot.BootBoardView.as_view("boot-board"),
        methods=["GET"]
    )
