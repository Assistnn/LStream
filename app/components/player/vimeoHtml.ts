export const buildVimeoHtml = (playerUrl: string): string => {
  const separator = playerUrl.includes('?') ? '&' : '?'
  const src = `${playerUrl}${separator}background=0&autopause=0&playsinline=1&controls=0`
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;background:#000;border:0}</style>
</head>
<body>
  <iframe id="v" src="${src}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
  <script src="https://player.vimeo.com/api/player.js"></script>
  <script>
    const player = new Vimeo.Player(document.getElementById('v'))
    const send = (msg) => window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg))

    player.on('loaded', async () => {
      try {
        const duration = await player.getDuration()
        send({ type: 'load', duration })
      } catch (e) {
        send({ type: 'error', message: String(e) })
      }
    })
    player.on('timeupdate', (d) => send({ type: 'progress', currentTime: d.seconds }))
    player.on('ended', () => send({ type: 'end' }))
    player.on('bufferstart', () => send({ type: 'buffer', isBuffering: true }))
    player.on('bufferend', () => send({ type: 'buffer', isBuffering: false }))
    player.on('playbackratechange', (d) => send({ type: 'rate', playbackRate: d.playbackRate }))
    player.on('error', (e) => send({ type: 'error', message: e && e.message ? e.message : 'unknown' }))

    const handleCommand = (raw) => {
      try {
        const cmd = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (cmd.type === 'play') player.play()
        else if (cmd.type === 'pause') player.pause()
        else if (cmd.type === 'seek') player.setCurrentTime(cmd.time)
        else if (cmd.type === 'rate') player.setPlaybackRate(cmd.rate)
        else if (cmd.type === 'volume') player.setVolume(cmd.volume)
      } catch (e) {}
    }
    document.addEventListener('message', (e) => handleCommand(e.data))
    window.addEventListener('message', (e) => handleCommand(e.data))
  </script>
</body>
</html>`
}
