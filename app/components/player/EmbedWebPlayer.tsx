import type { ReactNode } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Platform, type StyleProp, type ViewStyle } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import { WebView } from 'react-native-webview'

import { buildVimeoHtml } from './vimeoHtml'
import { buildYoutubeHtml, isYoutubeUrl } from './youtubeHtml'

export type EmbedWebPlayerRef = {
  seek: (time: number) => void
  pause: () => void
  resume: () => void
  setSource: (src?: { uri: string }) => void
  exitPictureInPicture: () => void
  presentFullscreenPlayer: () => void
}

type Props = {
  source: { uri: string }
  paused: boolean
  rate: number
  volume: number
  onProgress?: (e: { currentTime: number }) => void
  onLoad?: (e: { duration: number }) => void
  onEnd?: () => void
  onBuffer?: (e: { isBuffering: boolean }) => void
  onPlaybackRateChange?: (e: { playbackRate: number }) => void
  style?: StyleProp<ViewStyle>
}

const noop = () => {}

export const EmbedWebPlayer = forwardRef<EmbedWebPlayerRef, Props>(
  ({ source, paused, rate, volume, onProgress, onLoad, onEnd, onBuffer, onPlaybackRateChange, style }, ref) => {
    const webRef = useRef<WebView>(null)
    const loadedRef = useRef(false)

    const post = (msg: unknown) => webRef.current?.postMessage(JSON.stringify(msg))

    useImperativeHandle(ref, () => ({
      seek: (time) => post({ type: 'seek', time }),
      pause: () => post({ type: 'pause' }),
      resume: () => post({ type: 'play' }),
      setSource: noop,
      exitPictureInPicture: noop,
      presentFullscreenPlayer: noop,
    }))

    useEffect(() => {
      if (!loadedRef.current) return
      post({ type: paused ? 'pause' : 'play' })
    }, [paused])

    useEffect(() => {
      if (!loadedRef.current) return
      post({ type: 'rate', rate })
    }, [rate])

    useEffect(() => {
      if (!loadedRef.current) return
      post({ type: 'volume', volume })
    }, [volume])

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type: string; [k: string]: unknown }
        if (msg.type === 'load') {
          loadedRef.current = true
          onLoad?.({ duration: msg.duration as number })
          post({ type: 'rate', rate })
          post({ type: 'volume', volume })
          if (!paused) post({ type: 'play' })
        } else if (msg.type === 'progress') {
          onProgress?.({ currentTime: msg.currentTime as number })
        } else if (msg.type === 'end') {
          onEnd?.()
        } else if (msg.type === 'buffer') {
          onBuffer?.({ isBuffering: msg.isBuffering as boolean })
        } else if (msg.type === 'rate') {
          onPlaybackRateChange?.({ playbackRate: msg.playbackRate as number })
        }
      } catch {
        // ignore
      }
    }

    return (
      <WebView
        ref={webRef}
        source={
          isYoutubeUrl(source.uri)
            ? {
                html: buildYoutubeHtml(source.uri),
                // YouTube の埋め込みは Referer で呼び出し元アプリを識別できないとエラー 153 で再生を拒否する。
                baseUrl: Platform.OS === 'android' ? 'https://com.metadirection.lseed' : 'https://jp.lseed.lstream',
              }
            : { html: buildVimeoHtml(source.uri) }
        }
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        style={style as ReactNode extends unknown ? StyleProp<ViewStyle> : StyleProp<ViewStyle>}
      />
    )
  },
)
