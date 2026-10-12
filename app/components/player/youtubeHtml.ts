export const isYoutubeUrl = (url: string) => url.includes('youtube.com/embed/')

export const buildYoutubeHtml = (embedUrl: string): string => {
  const videoId = /youtube\.com\/embed\/([A-Za-z0-9_-]+)/.exec(embedUrl)?.[1] ?? ''
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>html,body,#v{margin:0;padding:0;width:100%;height:100%;background:#000;border:0}</style>
</head>
<body>
  <div id="v"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    const send = (msg) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg))
    let player = null
    let ready = false
    let progressTimer = null

    const stopProgress = () => {
      if (progressTimer) clearInterval(progressTimer)
      progressTimer = null
    }
    const startProgress = () => {
      stopProgress()
      progressTimer = setInterval(() => send({ type: 'progress', currentTime: player.getCurrentTime() }), 250)
    }

    // 準備完了直後は getDuration() が 0 を返すことがあるため、取得できるまで少し待ってから load を通知する。
    const notifyLoad = (retries) => {
      const duration = player.getDuration()
      if (duration > 0 || retries <= 0) {
        ready = true
        send({ type: 'load', duration })
        return
      }
      setTimeout(() => notifyLoad(retries - 1), 100)
    }

    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('v', {
        videoId: ${JSON.stringify(videoId)},
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, controls: 0, rel: 0, enablejsapi: 1, origin: location.origin },
        events: {
          onReady: () => notifyLoad(30),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              send({ type: 'buffer', isBuffering: false })
              startProgress()
              return
            }
            stopProgress()
            if (e.data === YT.PlayerState.BUFFERING) send({ type: 'buffer', isBuffering: true })
            else if (e.data === YT.PlayerState.ENDED) send({ type: 'end' })
          },
          onPlaybackRateChange: (e) => send({ type: 'rate', playbackRate: e.data }),
          onError: (e) => send({ type: 'error', message: String(e.data) }),
        },
      })
    }

    const handleCommand = (raw) => {
      if (!ready) return
      try {
        const cmd = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (cmd.type === 'play') player.playVideo()
        else if (cmd.type === 'pause') player.pauseVideo()
        else if (cmd.type === 'seek') player.seekTo(cmd.time, true)
        else if (cmd.type === 'rate') player.setPlaybackRate(cmd.rate)
        else if (cmd.type === 'volume') player.setVolume(cmd.volume * 100)
      } catch (e) {}
    }
    document.addEventListener('message', (e) => handleCommand(e.data))
    window.addEventListener('message', (e) => handleCommand(e.data))
  </script>
</body>
</html>`
}
