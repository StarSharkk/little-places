#!/bin/sh
# Refresh the skill's standalone kit from the repo, then package the skill for claude.ai.
# The repo is the source of truth for the shared helpers, the rendering pipeline and the reference building;
# the kit's viewer, verify script and the A-frame live only in the skill. Run from anywhere: sh skill/build.sh
set -e
cd "$(dirname "$0")/.."
SKILL=.claude/skills/little-places-building
KIT=$SKILL/kit
for f in primitives outline motion steam street props; do cp "buildings/shared/$f.js" "$KIT/buildings/shared/$f.js"; done
cp buildings/02-yamada-grocery/src/optimize.js "$KIT/buildings/shared/finish.js"
cp web/src/shadowFloor.js "$KIT/buildings/shared/shadowFloor.js"
# the reference building, minus anything the kit keeps of its own (its verify.extra.mjs)
cp buildings/09-little-post-office/*.js "$KIT/buildings/09-little-post-office/"
rm -f skill/little-places-building.skill
(cd .claude/skills && zip -qr ../../skill/little-places-building.skill little-places-building -x '*.DS_Store' -x '*/node_modules/*' -x '*/screenshots/*' -x '*/dist/*')
mkdir -p web/public/downloads && cp skill/little-places-building.skill web/public/downloads/little-places-building.zip   # the site's "Download skill"
echo "kit refreshed, skill packaged: skill/little-places-building.skill"
