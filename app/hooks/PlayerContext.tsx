import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import Video, { type VideoRef } from 'react-native-video'

import type { SeriesMedia, SeriesResponse } from '../repositories/api/IApiRepository'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
type LoopMode = 'off' | 'single' | 'all'
type Rect = { x: number; y: number; width: number; height: number }

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

const PlayerContext = createContext<
  | {
      currentContent: CurrentContent | undefined
      state: {
        playbackState: PlaybackState
        currentTime: number
      }
      settings: {
        playbackRate: number
        setPlaybackRate: (rate: number) => void
        isFullscreen: boolean
        setIsFullscreen: (fullscreen: boolean) => void
        volume: number
        setVolume: (volume: number) => void
        sleepTimer: number | undefined
        setSleepTimer: (minutes: number | undefined) => void
        loopMode: LoopMode
        setLoopMode: (mode: LoopMode) => void
        isShuffleOn: boolean
        setShuffleOn: (on: boolean) => void
      }
      view: {
        videoRef: React.RefObject<VideoRef | null>
        isPlayerExpanded: boolean
        setPlayerExpanded: (expanded: boolean) => void
        closePlayer: () => void
        handleProgress: (currentTime: number) => void
        handleLoad: () => void
        handleEnd: () => void
        handleBuffer: (isBuffering: boolean) => void
        isBuffering: boolean
        compactSlot: Rect | null
        setCompactSlot: (rect: Rect | null) => void
        expandedSlot: Rect | null
        setExpandedSlot: (rect: Rect | null) => void
        isPipActive: boolean
        setPipActive: (active: boolean) => void
      }
      navigation: {
        playEpisode: (series: SeriesResponse, episodeId?: number, unitId?: number) => void
        selectEpisode: (episodeId: number, unitId?: number) => void
        playNextEpisode: () => void
        playPreviousEpisode: () => void
        playNextUnit: () => void
        playPreviousUnit: () => void
      }
      controls: {
        pause: () => void
        resume: () => void
        seek: (time: number) => void
        skipForward: (seconds: number) => void
        skipBackward: (seconds: number) => void
      }
    }
  | undefined
>(undefined)

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  // currentContent
  const [currentContent, setCurrentContent] = useState<CurrentContent>()
  const switchContent = (content: CurrentContent) => {
    setCurrentContent(content)
    updateState({ playbackState: 'loading', currentTime: 0 })
  }

  // state
  const [state, setState] = useState({ playbackState: 'idle' as PlaybackState, currentTime: 0 })
  const updateState = (patch: Partial<typeof state>) => setState((prev) => ({ ...prev, ...patch }))
  const doSeek = (time: number) => {
    videoRef.current?.seek(time)
    updateState({ currentTime: time })
  }

  // settings
  const [settings, setSettings] = useState({
    playbackRate: 1.0,
    isFullscreen: false,
    volume: 75,
    sleepTimer: undefined as number | undefined,
    loopMode: 'off' as LoopMode,
    isShuffleOn: false,
  })
  const updateSettings = (patch: Partial<typeof settings>) => setSettings((prev) => ({ ...prev, ...patch }))
  const [sleepTimerId, setSleepTimerId] = useState<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (sleepTimerId) {
      clearTimeout(sleepTimerId)
    }
    if (settings.sleepTimer !== undefined && state.playbackState === 'playing') {
      setSleepTimerId(
        setTimeout(
          () => {
            updateState({ playbackState: 'paused' })
            updateSettings({ sleepTimer: undefined })
          },
          settings.sleepTimer * 60 * 1000,
        ),
      )
    } else {
      setSleepTimerId(undefined)
    }
    return () => {
      if (sleepTimerId) {
        clearTimeout(sleepTimerId)
      }
    }
  }, [settings.sleepTimer, state.playbackState])
  // view
  const videoRef = useRef<VideoRef>(null)
  const [isPlayerExpanded, setPlayerExpanded] = useState(true)
  const [compactSlot, setCompactSlot] = useState<Rect | null>(null)
  const [expandedSlot, setExpandedSlot] = useState<Rect | null>(null)
  const [isPipActive, setPipActive] = useState(false)

  // latest refs for stable callbacks
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const currentContentRef = useRef(currentContent)
  currentContentRef.current = currentContent

  const playNextEpisodeInternal = () => {
    const content = currentContentRef.current
    if (!content) return
    const { episodes } = content

    if (settingsRef.current.isShuffleOn && episodes.length > 1) {
      const otherEpisodes = episodes.filter((ep) => ep.item_id !== content.episodeId)
      const randomEpisode = otherEpisodes[Math.floor(Math.random() * otherEpisodes.length)]
      switchContent(content.withEpisode(randomEpisode.item_id, randomEpisode.units?.[0]?.item_id))
      return
    }

    const currentIndex = episodes.findIndex((ep) => ep.item_id === content.episodeId)
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1]
      switchContent(content.withEpisode(nextEpisode.item_id, nextEpisode.units?.[0]?.item_id))
    }
  }

  const handleProgress = useCallback((currentTime: number) => {
    setState((prev) => ({ ...prev, currentTime }))
  }, [])

  const handleLoad = useCallback(() => {
    setState((prev) => (prev.playbackState === 'loading' ? { ...prev, playbackState: 'playing' } : prev))
  }, [])

  const [isBuffering, setIsBuffering] = useState(false)
  const handleBuffer = useCallback((buffering: boolean) => {
    setIsBuffering(buffering)
  }, [])

  const handleEnd = useCallback(() => {
    const s = settingsRef.current
    const content = currentContentRef.current
    if (s.loopMode === 'single') {
      videoRef.current?.seek(0)
      setState((prev) => ({ ...prev, currentTime: 0, playbackState: 'playing' }))
      return
    }
    if (s.loopMode === 'all' && content) {
      if (content.unitId) {
        const allUnits = content.units
        const uIdx = allUnits.findIndex((u) => u.item_id === content.unitId)
        if (uIdx < allUnits.length - 1) {
          switchContent(content.withUnit(allUnits[uIdx + 1].item_id))
          return
        }
      }
      const epIdx = content.episodeIndex
      if (epIdx < content.episodes.length - 1 || s.isShuffleOn) {
        playNextEpisodeInternal()
      } else {
        const firstEp = content.episodes[0]
        switchContent(content.withEpisode(firstEp.item_id, firstEp.units?.[0]?.item_id))
      }
      return
    }
    setState((prev) => ({ ...prev, playbackState: 'ended' }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <PlayerContext.Provider
      value={{
        currentContent,
        state,
        controls: {
          pause: () => {
            if (state.playbackState === 'playing') updateState({ playbackState: 'paused' })
          },
          resume: () => {
            if (state.playbackState === 'ended') {
              doSeek(0)
              updateState({ playbackState: 'playing' })
            } else if (state.playbackState === 'paused') {
              updateState({ playbackState: 'playing' })
            }
          },
          seek: doSeek,
          skipForward: (seconds) => doSeek(Math.min(state.currentTime + seconds, currentContent?.duration ?? 0)),
          skipBackward: (seconds) => doSeek(Math.max(state.currentTime - seconds, 0)),
        },
        navigation: {
          playEpisode: (series, episodeId?, unitId?) => {
            const ep = episodeId
              ? (series.episodes.find((e) => e.item_id === episodeId) ?? series.episodes[0])
              : series.episodes[0]

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
            setCurrentContent(undefined)
            updateState({ playbackState: 'idle', currentTime: 0 })
            setSettings({
              playbackRate: 1.0,
              isFullscreen: false,
              volume: 75,
              sleepTimer: undefined,
              loopMode: 'off',
              isShuffleOn: false,
            })
            setPlayerExpanded(true)
          },
          isPlayerExpanded,
          setPlayerExpanded,
          videoRef,
          compactSlot,
          setCompactSlot,
          expandedSlot,
          setExpandedSlot,
          isPipActive,
          setPipActive,
          handleProgress,
          handleLoad,
          handleEnd,
          handleBuffer,
          isBuffering,
        },
        settings: {
          playbackRate: settings.playbackRate,
          setPlaybackRate: (rate: number) => updateSettings({ playbackRate: rate }),
          isFullscreen: settings.isFullscreen,
          setIsFullscreen: (v: boolean) => updateSettings({ isFullscreen: v }),
          volume: settings.volume,
          setVolume: (v: number) => updateSettings({ volume: v }),
          sleepTimer: settings.sleepTimer,
          setSleepTimer: (v: number | undefined) => updateSettings({ sleepTimer: v }),
          loopMode: settings.loopMode,
          setLoopMode: (v: LoopMode) => updateSettings({ loopMode: v }),
          isShuffleOn: settings.isShuffleOn,
          setShuffleOn: (v: boolean) => updateSettings({ isShuffleOn: v }),
        },
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const PlayerVideo = ({ style }: { style?: ViewStyle }) => {
  const {
    currentContent,
    state: { playbackState },
    settings: { playbackRate, volume },
    view: { videoRef, handleProgress, handleLoad, handleEnd, handleBuffer, setPipActive },
  } = usePlayer()
  const mediaUrl = currentContent?.mediaUrl
  const source = useMemo(() => (mediaUrl ? { uri: mediaUrl } : undefined), [mediaUrl])
  const onProgress = useCallback(
    (data: { currentTime: number }) => handleProgress(data.currentTime),
    [handleProgress],
  )
  const onPipStatusChanged = useCallback(
    ({ isActive }: { isActive: boolean }) => setPipActive(isActive),
    [setPipActive],
  )
  const onBuffer = useCallback(
    ({ isBuffering: buffering }: { isBuffering: boolean }) => handleBuffer(buffering),
    [handleBuffer],
  )
  const enterPip = !!currentContent?.isVideo
  if (!currentContent || !source) return null
  return (
    <Video
      ref={videoRef}
      source={source}
      style={style}
      resizeMode='cover'
      paused={playbackState !== 'playing'}
      rate={playbackRate}
      volume={volume / 100}
      onProgress={onProgress}
      onLoad={handleLoad}
      onEnd={handleEnd}
      onBuffer={onBuffer}
      playInBackground={true}
      playWhenInactive={true}
      ignoreSilentSwitch='ignore'
      enterPictureInPictureOnLeave={enterPip}
      onPictureInPictureStatusChanged={onPipStatusChanged}
    />
  )
}
