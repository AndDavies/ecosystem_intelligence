#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PACKAGE="$ROOT/content/launch/broader-public-beta-2026-08"
SHOTS="$PACKAGE/screenshots"
FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
OUTPUT="$PACKAGE/true-north-map-walkthrough.mp4"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FRAMES="$PACKAGE/video-frames"

mkdir -p "$FRAMES"

render_scene() {
  local scene="$1"
  local target="$FRAMES/scene-$scene.png"
  rm -f "$target"

  "$CHROME" \
    --headless=new \
    --hide-scrollbars \
    --disable-background-networking \
    --disable-component-update \
    --disable-extensions \
    --disable-gpu \
    --no-first-run \
    --no-sandbox \
    --run-all-compositor-stages-before-draw \
    --user-data-dir="/tmp/tnm-walkthrough-$scene-$$" \
    --window-size=1920,1080 \
    --screenshot="$target" \
    "file://$PACKAGE/video-frame.html?scene=$scene" >/dev/null 2>&1 &
  local chrome_pid=$!

  for _ in {1..100}; do
    if [[ -s "$target" ]]; then
      break
    fi
    sleep 0.1
  done

  kill "$chrome_pid" >/dev/null 2>&1 || true
  wait "$chrome_pid" >/dev/null 2>&1 || true

  if [[ ! -s "$target" ]]; then
    printf 'Failed to render scene %s\n' "$scene" >&2
    return 1
  fi
}

for scene in 1 2 3 4 5 6; do
  render_scene "$scene"
done

ffmpeg -y \
  -loop 1 -t 5 -i "$FRAMES/scene-1.png" \
  -loop 1 -t 5 -i "$FRAMES/scene-2.png" \
  -loop 1 -t 5 -i "$FRAMES/scene-3.png" \
  -loop 1 -t 5 -i "$FRAMES/scene-4.png" \
  -loop 1 -t 5 -i "$FRAMES/scene-5.png" \
  -loop 1 -t 5 -i "$FRAMES/scene-6.png" \
  -filter_complex "[0:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v0];[1:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v1];[2:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v2];[3:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v3];[4:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v4];[5:v]setsar=1,trim=duration=5,setpts=PTS-STARTPTS[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0[outv]" \
  -map "[outv]" \
  -r 30 \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT"

ffmpeg -y -ss 1 -i "$OUTPUT" -frames:v 1 "$PACKAGE/walkthrough-poster.png"

printf 'Created %s\n' "$OUTPUT"
