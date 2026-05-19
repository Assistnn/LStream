#!/bin/bash
# react-native-video パッチ
# 1. ロック画面/PiPで外部一時停止された状態を尊重し、勝手に再開しない
# 2. ロック画面のスキップ間隔を30秒に変更

TARGET_VIDEO="node_modules/react-native-video/ios/Video/RCTVideo.swift"
TARGET_NOWPLAYING="node_modules/react-native-video/ios/Video/NowPlayingInfoCenterManager.swift"

# --- RCTVideo.swift パッチ ---
if [ -f "$TARGET_VIDEO" ] && ! grep -q "_externallyPaused" "$TARGET_VIDEO"; then
  python3 -c "
with open('$TARGET_VIDEO', 'r') as f:
    content = f.read()

content = content.replace(
    'private var _paused = false',
    'private var _paused = false\n    private var _externallyPaused = false',
    1
)

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

content = content.replace(
    '        onPlaybackRateChange?([\"playbackRate\"',
    '''        if _player.rate == 0 && !_paused {
            _externallyPaused = true
        }

        onPlaybackRateChange?([\"playbackRate\"''',
    1
)

with open('$TARGET_VIDEO', 'w') as f:
    f.write(content)
"
  echo "✅ RCTVideo.swift patched"
fi

# --- NowPlayingInfoCenterManager.swift パッチ ---
if [ -f "$TARGET_NOWPLAYING" ] && grep -q "SEEK_INTERVAL_SECONDS: Double = 10" "$TARGET_NOWPLAYING"; then
  sed -i '' 's/SEEK_INTERVAL_SECONDS: Double = 10/SEEK_INTERVAL_SECONDS: Double = 30/' "$TARGET_NOWPLAYING"
  echo "✅ NowPlayingInfoCenterManager.swift patched (30sec skip)"
fi

echo "✅ react-native-video patch complete"
