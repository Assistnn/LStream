#!/bin/bash
# react-native-video パッチ
# ロック画面/PiPで外部一時停止された状態を尊重し、勝手に再開しない

TARGET="node_modules/react-native-video/ios/Video/RCTVideo.swift"

if [ ! -f "$TARGET" ]; then
  echo "⚠️  $TARGET not found, skipping patch"
  exit 0
fi

if grep -q "_externallyPaused" "$TARGET"; then
  echo "✅ react-native-video already patched"
  exit 0
fi

python3 -c "
with open('$TARGET', 'r') as f:
    content = f.read()

# 1. Add _externallyPaused property near _paused declaration
content = content.replace(
    'private var _paused = false',
    'private var _paused = false\n    private var _externallyPaused = false',
    1
)

# 2. Add guard to setPaused
content = content.replace(
    'func setPaused(_ paused: Bool) {\n        if paused {',
    '''func setPaused(_ paused: Bool) {
        if _externallyPaused {
            if !paused && _paused == paused {
                return
            }
            _externallyPaused = false
        }
        if paused {''',
    1
)

# 3. Detect external pause in handlePlaybackRateChange
content = content.replace(
    '        onPlaybackRateChange?([\"playbackRate\"',
    '''        if _player.rate == 0 && !_paused {
            _externallyPaused = true
        }

        onPlaybackRateChange?([\"playbackRate\"''',
    1
)

with open('$TARGET', 'w') as f:
    f.write(content)
"

if grep -q "_externallyPaused = true" "$TARGET"; then
  echo "✅ react-native-video patched"
else
  echo "⚠️  patch failed"
fi
