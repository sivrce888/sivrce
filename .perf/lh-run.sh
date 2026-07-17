#!/bin/bash
# Run one Lighthouse mobile audit against a freshly started prod server.
# Usage: ./lh-run.sh <path> <out-json>
set -u
APP=/Users/mac/Desktop/sivrce888/.perf/app
PORT=4173
cd "$APP"
npx next start -p $PORT > /tmp/perf-server.log 2>&1 &
SPID=$!
cleanup() { kill $SPID 2>/dev/null; wait $SPID 2>/dev/null; }
trap cleanup EXIT
for i in $(seq 1 60); do
  curl -sf -o /dev/null "http://localhost:$PORT/" && break
  sleep 0.5
done
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npx lighthouse "http://localhost:$PORT$1" \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path="$2" \
  --only-categories=performance --quiet --no-enable-error-reporting 2>/dev/null
echo "lighthouse exit: $?"
