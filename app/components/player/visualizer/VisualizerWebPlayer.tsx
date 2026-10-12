import { useEffect, useMemo, useRef } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { WebView } from 'react-native-webview'

import type { Visualizer } from '../../../repositories/api/IApiRepository'
import { buildVisualizerHtml } from './visualizerHtml'

const SEEK_THRESHOLD_SECONDS = 1.5

export const VisualizerWebPlayer = ({
  config,
  title,
  audioUrl,
  currentTime,
  paused,
  style,
}: {
  config: Visualizer
  title: string
  audioUrl: string
  currentTime: number
  paused: boolean
  style?: StyleProp<ViewStyle>
}) => {
  const webRef = useRef<WebView>(null)
  const html = useMemo(() => buildVisualizerHtml(config, title, audioUrl), [config, title, audioUrl])
  const loadedRef = useRef(false)
  const lastSyncedTimeRef = useRef(currentTime)
  const lastSyncedWallRef = useRef(Date.now())

  const post = (data: Record<string, unknown>) => {
    const json = JSON.stringify(data)
    webRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(json)} })); true;`,
    )
  }

  useEffect(() => {
    if (!loadedRef.current) return
    if (paused) {
      post({ type: 'pause' })
    } else {
      post({ type: 'seek', currentTime })
      post({ type: 'play' })
    }
    lastSyncedTimeRef.current = currentTime
    lastSyncedWallRef.current = Date.now()
  }, [paused])

  useEffect(() => {
    if (!loadedRef.current || paused) return
    const expected = lastSyncedTimeRef.current + (Date.now() - lastSyncedWallRef.current) / 1000
    if (Math.abs(currentTime - expected) > SEEK_THRESHOLD_SECONDS) {
      post({ type: 'seek', currentTime })
      lastSyncedTimeRef.current = currentTime
      lastSyncedWallRef.current = Date.now()
    }
  }, [currentTime, paused])

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      androidLayerType='hardware'
      onLoadEnd={() => {
        loadedRef.current = true
        post({ type: 'seek', currentTime })
        if (!paused) post({ type: 'play' })
        lastSyncedTimeRef.current = currentTime
        lastSyncedWallRef.current = Date.now()
      }}
      style={[{ backgroundColor: 'transparent' }, style]}
      containerStyle={{ backgroundColor: 'transparent' }}
    />
  )
}
