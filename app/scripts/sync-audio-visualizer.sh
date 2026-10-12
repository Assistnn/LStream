#!/usr/bin/env bash
# LSEED サーバの audio-visualizer.js をアプリの WebView 用ソースへ同期する。
# Metro は raw text import に対応していないため、TypeScript テンプレートリテラルとして
# 埋め込む。バックスラッシュ / バッククォート / ${ をエスケープする。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="${LSEED_REPO:-$APP_ROOT/../../../PHP/lseed}/resources/js/audio-visualizer.js"
DST="$APP_ROOT/components/player/visualizer/audioVisualizerSource.ts"

if [[ ! -f "$SRC" ]]; then
  echo "source not found: $SRC" >&2
  echo "hint: set LSEED_REPO to override lseed repo path" >&2
  exit 1
fi

{
  echo "// AUTO-GENERATED — do not edit by hand."
  echo "// Source: lseed/resources/js/audio-visualizer.js"
  echo "// Sync: pnpm --dir app sync-visualizer  (or scripts/sync-audio-visualizer.sh)"
  echo ""
  echo "export const AUDIO_VISUALIZER_SOURCE = \`"
  # 1. バックスラッシュ / バックティック / \${ をエスケープ
  # 2. WebView は script モード実行のため 'export default X;' を 'window.X = X;' に置換
  sed \
    -e 's/\\/\\\\/g' \
    -e 's/`/\\`/g' \
    -e 's/\${/\\${/g' \
    -e 's|^export default LseedAudioVisualizer;$|window.LseedAudioVisualizer = LseedAudioVisualizer;|' \
    "$SRC"
  echo "\`"
} > "$DST"

echo "wrote $DST ($(wc -l < "$DST") lines)"
