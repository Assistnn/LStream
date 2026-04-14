import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ImageStyle, ViewStyle } from 'react-native'
import { Image, Text, View } from 'react-native'
import Video, { type OnLoadData, type OnProgressData, type VideoRef } from 'react-native-video'

import type { SeriesMedia, SeriesResponse } from '../repositories/api/IApiRepository'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
type LoopMode = 'off' | 'single' | 'all'

class CurrentContent {
  readonly episodes: SeriesMedia[]
  readonly episodeId: number
  readonly unitId?: number

  constructor(episodes: SeriesMedia[], episodeId: number, unitId?: number) {
    this.episodes = episodes
    this.episodeId = episodeId
    this.unitId = unitId
  }

  get episode() {
    return this.episodes.find((ep) => ep.item_id === this.episodeId) ?? this.episodes[0]
  }

  get unit() {
    return this.unitId ? this.episode.units?.find((u) => u.item_id === this.unitId) : undefined
  }

  get mediaUrl() {
    return this.unit?.url || this.episode?.url || ''
  }

  get isVideo() {
    return (this.unit?.type_media ?? this.episode?.type_media) === 1
  }

  get thumbnail() {
    return this.unit?.img || this.episode?.img
  }

  get episodeIndex() {
    return this.episodes.findIndex((ep) => ep.item_id === this.episodeId)
  }

  get units() {
    return this.episode?.units ?? []
  }

  get unitIndex() {
    return this.unitId ? this.units.findIndex((u) => u.item_id === this.unitId) : -1
  }

  withEpisode(epId: number, uId?: number) {
    return new CurrentContent(this.episodes, epId, uId)
  }

  withUnit(uId: number) {
    return new CurrentContent(this.episodes, this.episodeId, uId)
  }

  get hasNextEpisode() {
    return this.episodeIndex < this.episodes.length - 1
  }

  get hasPrevEpisode() {
    return this.episodeIndex > 0
  }

  get hasNextUnit() {
    return this.unitIndex >= 0 && this.unitIndex < this.units.length - 1
  }

  get hasPrevUnit() {
    return this.unitIndex > 0
  }

  get hasUnits() {
    return this.units.length > 0
  }

  get duration() {
    return this.unit?.duration || this.episode?.duration || 0
  }
}

interface PlayerContextValue {
  currentContent: CurrentContent | null
  state: {
    playbackState: PlaybackState
    currentTime: number
  }
  navigation: {
    playEpisode: (series: SeriesResponse, episodeId?: number, unitId?: number) => void
    selectEpisode: (episodeId: number, unitId?: number) => void
    playNextEpisode: () => void
    playPreviousEpisode: () => void
    playNextUnit: () => void
    playPreviousUnit: () => void
  }
  view: {
    renderThumbnail: (style: ViewStyle | ImageStyle) => React.ReactElement | null
    renderVideo: (style: ViewStyle) => React.ReactElement | null
    isPlayerExpanded: boolean
    setPlayerExpanded: (expanded: boolean) => void
    closePlayer: () => void
  }
  controls: {
    pause: () => void
    resume: () => void
    seek: (time: number) => void
    skipForward: (seconds: number) => void
    skipBackward: (seconds: number) => void
  }
  settings: {
    playbackRate: number
    setPlaybackRate: (rate: number) => void
    isFullscreen: boolean
    setFullscreen: (fullscreen: boolean) => void
    volume: number
    setVolume: (volume: number) => void
    sleepTimer: number | null
    setSleepTimer: (minutes: number | null) => void
    loopMode: LoopMode
    setLoopMode: (mode: LoopMode) => void
    isShuffleOn: boolean
    setShuffleOn: (on: boolean) => void
  }
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentContent, setCurrentContent] = useState<CurrentContent | null>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(75)
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [loopMode, setLoopMode] = useState<LoopMode>('off')
  const [isShuffleOn, setShuffleOn] = useState(false)
  const [isPlayerExpanded, setPlayerExpanded] = useState(true)

  const videoRef = useRef<VideoRef>(null)
  const [pendingSeek, setPendingSeek] = useState(false)
  const currentTimeRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSwitchingRef = useRef(false)

  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    if (sleepTimer !== null && playbackState === 'playing') {
      sleepTimerRef.current = setTimeout(
        () => {
          setPlaybackState('paused')
          setSleepTimer(null)
        },
        sleepTimer * 60 * 1000,
      )
    }
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current)
        sleepTimerRef.current = null
      }
    }
  }, [sleepTimer, playbackState])

  const handleProgress = (data: OnProgressData) => {
    if (data.currentTime !== undefined && !pendingSeek) {
      currentTimeRef.current = data.currentTime
      setCurrentTime(data.currentTime)
    }
  }

  const handleSeek = () => {
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
      seekTimeoutRef.current = null
    }
    setPendingSeek(false)
  }

  const handleLoad = (_data: OnLoadData) => {
    isSwitchingRef.current = false
    isInitialLoadRef.current = false
    currentTimeRef.current = 0
    setCurrentTime(0)
    setPendingSeek(false)
    setPlaybackState('playing')
  }

  const switchContent = (content: CurrentContent) => {
    isSwitchingRef.current = true
    currentTimeRef.current = 0
    setPendingSeek(true)
    setCurrentContent(content)
    setPlaybackState('loading')
    setCurrentTime(0)
  }

  const doSeek = (time: number) => {
    setPendingSeek(true)
    setCurrentTime(time)
    currentTimeRef.current = time
    videoRef.current?.seek(time)
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
    seekTimeoutRef.current = setTimeout(() => setPendingSeek(false), 500)
  }

  const playNextEpisodeInternal = () => {
    if (!currentContent) return
    const { episodes } = currentContent

    if (isShuffleOn && episodes.length > 1) {
      const otherEpisodes = episodes.filter((ep) => ep.item_id !== currentContent.episodeId)
      const randomEpisode = otherEpisodes[Math.floor(Math.random() * otherEpisodes.length)]
      switchContent(currentContent.withEpisode(randomEpisode.item_id, randomEpisode.units?.[0]?.item_id))
      return
    }

    const currentIndex = episodes.findIndex((ep) => ep.item_id === currentContent.episodeId)
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1]
      switchContent(currentContent.withEpisode(nextEpisode.item_id, nextEpisode.units?.[0]?.item_id))
    }
  }

  const handleEnd = () => {
    if (isSwitchingRef.current) return
    if (loopMode === 'single') {
      videoRef.current?.seek(0)
      setCurrentTime(0)
      currentTimeRef.current = 0
      setPlaybackState('playing')
      return
    }
    if (loopMode === 'all' && currentContent) {
      if (currentContent.unitId) {
        const allUnits = currentContent.units
        const uIdx = allUnits.findIndex((u) => u.item_id === currentContent.unitId)
        if (uIdx < allUnits.length - 1) {
          switchContent(currentContent.withUnit(allUnits[uIdx + 1].item_id))
          return
        }
      }
      const epIdx = currentContent.episodeIndex
      if (epIdx < currentContent.episodes.length - 1 || isShuffleOn) {
        playNextEpisodeInternal()
      } else {
        const firstEp = currentContent.episodes[0]
        switchContent(currentContent.withEpisode(firstEp.item_id, firstEp.units?.[0]?.item_id))
      }
      return
    }
    setPlaybackState('ended')
  }

  const renderThumbnailElement = (content: CurrentContent, style: ViewStyle | ImageStyle) => {
    if (content.thumbnail) {
      return (
        <Image
          source={{ uri: content.thumbnail }}
          style={[style as ImageStyle, { borderRadius: 8 }]}
          resizeMode='cover'
        />
      )
    }
    return (
      <View
        style={[style, { borderRadius: 8, backgroundColor: '#6b7280', justifyContent: 'center', alignItems: 'center' }]}
      >
        <Text style={{ fontSize: 64 }}>🎵</Text>
      </View>
    )
  }

  return (
    <PlayerContext.Provider
      value={{
        currentContent,
        state: {
          playbackState,
          currentTime,
        },
        controls: {
          pause: () => {
            if (playbackState === 'playing') setPlaybackState('paused')
          },
          resume: () => {
            if (playbackState === 'ended') {
              doSeek(0)
              setPlaybackState('playing')
            } else if (playbackState === 'paused') {
              setPlaybackState('playing')
            }
          },
          seek: doSeek,
          skipForward: (seconds) => doSeek(Math.min(currentTimeRef.current + seconds, currentContent?.duration ?? 0)),
          skipBackward: (seconds) => doSeek(Math.max(currentTimeRef.current - seconds, 0)),
        },
        navigation: {
          playEpisode: (series, episodeId?, unitId?) => {
            const ep = episodeId
              ? (series.episodes.find((e) => e.item_id === episodeId) ?? series.episodes[0])
              : series.episodes[0]
            setPendingSeek(false)
            switchContent(new CurrentContent(series.episodes, ep.item_id, unitId ?? ep.units?.[0]?.item_id))
          },
          playNextEpisode: playNextEpisodeInternal,
          playPreviousEpisode: () => {
            if (!currentContent) return
            const idx = currentContent.episodeIndex
            if (idx > 0) {
              const prev = currentContent.episodes[idx - 1]
              switchContent(currentContent.withEpisode(prev.item_id, prev.units?.[0]?.item_id))
            }
          },
          playNextUnit: () => {
            if (!currentContent?.unitId) return
            const idx = currentContent.unitIndex
            if (idx < currentContent.units.length - 1) {
              switchContent(currentContent.withUnit(currentContent.units[idx + 1].item_id))
            }
          },
          playPreviousUnit: () => {
            if (!currentContent?.unitId) return
            const idx = currentContent.unitIndex
            if (idx > 0) {
              switchContent(currentContent.withUnit(currentContent.units[idx - 1].item_id))
            }
          },
          selectEpisode: (epId, uId?) => {
            if (!currentContent) return
            const ep = currentContent.episodes.find((e) => e.item_id === epId)
            switchContent(currentContent.withEpisode(epId, uId ?? ep?.units?.[0]?.item_id))
          },
        },
        view: {
          closePlayer: () => {
            setPendingSeek(false)
            setCurrentContent(null)
            setPlaybackState('idle')
            setCurrentTime(0)
            setPlaybackRate(1.0)
            setIsFullscreen(false)
            setVolume(75)
            setSleepTimer(null)
            setLoopMode('off')
            setShuffleOn(false)
            setPlayerExpanded(true)
          },
          renderThumbnail: (style) => {
            if (!currentContent) return null
            return renderThumbnailElement(currentContent, style)
          },
          renderVideo: (style) => {
            if (!currentContent?.isVideo) return null
            return (
              <Video
                ref={videoRef}
                source={{ uri: currentContent.mediaUrl }}
                style={style}
                resizeMode='cover'
                paused={playbackState !== 'playing'}
                rate={playbackRate}
                volume={volume / 100}
                onProgress={handleProgress}
                onLoad={handleLoad}
                onEnd={handleEnd}
                onSeek={handleSeek}
                playInBackground={true}
                playWhenInactive={true}
                ignoreSilentSwitch='ignore'
              />
            )
          },
          isPlayerExpanded,
          setPlayerExpanded,
        },
        settings: {
          playbackRate,
          setPlaybackRate,
          isFullscreen,
          setFullscreen: setIsFullscreen,
          volume,
          setVolume,
          sleepTimer,
          setSleepTimer,
          loopMode,
          setLoopMode,
          isShuffleOn,
          setShuffleOn,
        },
      }}
    >
      {children}
      {currentContent && !currentContent.isVideo && (
        <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
          <Video
            ref={videoRef}
            source={{ uri: currentContent.mediaUrl }}
            paused={playbackState !== 'playing'}
            rate={playbackRate}
            volume={volume / 100}
            onProgress={handleProgress}
            onLoad={handleLoad}
            onEnd={handleEnd}
            onSeek={handleSeek}
            playInBackground={true}
            playWhenInactive={true}
            ignoreSilentSwitch='ignore'
          />
        </View>
      )}
    </PlayerContext.Provider>
  )
}
