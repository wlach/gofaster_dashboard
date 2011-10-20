#!/bin/sh

# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is the Mozilla GoFaster Dashboard.
#
# The Initial Developer of the Original Code is
# Mozilla foundation
# Portions created by the Initial Developer are Copyright (C) 2011
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
#   William Lachance <wlachance@mozilla.com>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

PYPI_DEPS=" \
BeautifulSoup==3.2.0 \
Tempita \
configparser \
python_dateutil==1.5 \
lockfile \
ordereddict \
pyes \
statlib \
"

MOZAUTOLOG_REPO=http://hg.mozilla.org/users/jgriffin_mozilla.com/mozautolog/
MOZAUTOESLIB=http://hg.mozilla.org/automation/mozautoeslib/
ISTHISBUILDFASTER=http://hg.mozilla.org/users/jgriffin_mozilla.com/isthisbuildfaster/

virtualenv .
./bin/easy_install $PYPI_DEPS

# Clone/install custom Mozilla eggs
for I in $MOZAUTOLOG_REPO $MOZAUTOESLIB $ISTHISBUILDFASTER; do
    PKGNAME=$(basename $I)
    hg clone $I src/$PKGNAME
    ./bin/easy_install src/$PKGNAME
done

# Install our own custom copy of templeton
git clone git://github.com/wlach/templeton.git src/templeton
./bin/easy_install src/templeton

# Utility scripts to manage the queue
for I in add-job process-next-job show-pending-jobs clear-jobs; do
    SCRIPT=./bin/$I
    cat > $SCRIPT << EOF
#!/bin/sh

PYTHON=\$(dirname \$0)/python
SCRIPT_DIR=\$(dirname \$0)/../src/dashboard/server/itbf

exec \$PYTHON \$SCRIPT_DIR/$I.py \$@
EOF
    chmod a+x $SCRIPT
done

# Copy over the server settings file (if it doesn't exist yet)
SERVER_DIR=src/dashboard/server
if [ ! -e $SERVER_DIR/settings.cfg ]; then
    cp $SERVER_DIR/settings.cfg.example $SERVER_DIR/settings.cfg
fi
