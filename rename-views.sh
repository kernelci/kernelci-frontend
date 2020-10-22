#!/bin/bash

set -e

JS_PATH="app/dashboard/static/js/"

ver="$1"

[ -z "$ver" ] && {
    ver=$(date +%Y.%m)
}

echo "New version: $ver"

since=$(git tag -l | grep -v staging | tail -1)
echo "Changes since $since:"

git diff --stat $since "$JS_PATH"app/view-*.js \
    | grep -v "changed," \
    | cut -d\  -f2 \
    | while read view
do
    old=$(basename $view .js)
    name=$(echo $old | cut -d. -f1)
    new="$name"."$ver"
    echo "* $name"
    echo "    old: $old"
    echo "    new: $new"
    for js in build.js common.js; do
        sed -i s/$old/$new/g "$JS_PATH""$js"
        git add "$JS_PATH""$js"
    done
    if [ $old != $new ]; then
        git mv "$JS_PATH"/app/"$old".js "$JS_PATH"/app/"$new".js
    fi
done

exit 0
