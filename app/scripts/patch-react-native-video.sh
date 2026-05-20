#!/bin/bash
# react-native-video パッチ
# 1. ロック画面/PiPで外部一時停止された状態を尊重し、勝手に再開しない
#    ※ seek中の内部pauseは「外部pause」扱いしない
# 2. ロック画面のスキップ間隔を30秒に変更

TARGET_VIDEO="node_modules/react-native-video/ios/Video/RCTVideo.swift"
TARGET_NOWPLAYING="node_modules/react-native-video/ios/Video/NowPlayingInfoCenterManager.swift"

# --- RCTVideo.swift パッチ ---
if [ -f "$TARGET_VIDEO" ]; then
  python3 -c "
with open('$TARGET_VIDEO', 'r') as f:
    content = f.read()

# _externallyPaused / _isSeeking フラグ追加（未追加の場合のみ）
if '_externallyPaused' not in content:
    content = content.replace(
        'private var _paused = false',
        'private var _paused = false\n    private var _externallyPaused = false\n    private var _isSeeking = false',
        1
    )
elif '_isSeeking' not in content:
    content = content.replace(
        'private var _externallyPaused = false',
        'private var _externallyPaused = false\n    private var _isSeeking = false',
        1
    )

# setPaused にガード追加（未追加の場合のみ）
if 'if _externallyPaused' not in content:
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

# handlePlaybackRateChange: seek中は _externallyPaused を立てない
if '_isSeeking' in content and '!_isSeeking' not in content:
    content = content.replace(
        'if _player.rate == 0 && !_paused {',
        'if _player.rate == 0 && !_paused && !_isSeeking {',
        1
    )
elif '_player.rate == 0 && !_paused' in content and '_isSeeking' not in content:
    # _externallyPaused はあるが _isSeeking がまだ条件にない場合
    content = content.replace(
        'if _player.rate == 0 && !_paused {',
        'if _player.rate == 0 && !_paused && !_isSeeking {',
        1
    )

# seek開始時に _isSeeking = true（未追加の場合のみ）
if '_isSeeking = true' not in content:
    content = content.replace(
        'RCTPlayerOperations.seek(',
        '_isSeeking = true\n        RCTPlayerOperations.seek(',
        1
    )

# seek完了時に _isSeeking = false（未追加の場合のみ）
if '_isSeeking = false\n' not in content:
    content = content.replace(
        '            self.setPaused(self._paused)',
        '            self._isSeeking = false\n            self.setPaused(self._paused)',
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
