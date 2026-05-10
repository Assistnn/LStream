import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, type ViewStyle } from 'react-native'
import Video, { type VideoRef } from 'react-native-video'

import { apiRepository } from '../repositories/api'
import type { LoopMode } from '../repositories/storage'
import { StorageRepository } from '../repositories/storage'
import { useDownload } from './DownloadContext'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export type PlayableChild = {
  id: number
  mediaType: number
  url: string
  img: string
  title: string
  duration: number
  progress: number
  parentTitle: string
}

export type PlayableTrack = PlayableChild & {
  children?: PlayableChild[]
}

export type QueueItem = {
  id: string
  trackId: number
  childId?: number
  title: string
  parentTitle: string
  thumbnail: string
  duration: number
  url: string
  mediaType: number
}

const QUEUE_KEYS = {
  queue: '@playlist/queue',
  autoPlayNext: '@playlist/autoPlayNext',
} as const

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

type Rect = { x: number; y: number; width: number; height: number }

class CurrentContent {
  readonly sourceId: number
  readonly tracks: PlayableTrack[]
  readonly trackId: number
  readonly childId?: number

  constructor(sourceId: number, tracks: PlayableTrack[], trackId: number, childId?: number) {
    this.sourceId = sourceId
    this.tracks = tracks
    this.trackId = trackId
    this.childId = childId
  }

  get track() {
    return this.tracks.find((t) => t.id === this.trackId) ?? this.tracks[0]
  }

  get child() {
    return this.childId ? this.track.children?.find((c) => c.id === this.childId) : undefined
  }

  get mediaUrl() {
    return this.child?.url || this.track?.url || ''
  }

  get isVideo() {
    return (this.child?.mediaType ?? this.track?.mediaType) === 1
  }

  get thumbnail() {
    return this.child?.img || this.track?.img
  }

  get trackIndex() {
    return this.tracks.findIndex((t) => t.id === this.trackId)
  }

  get children() {
    return this.track?.children ?? []
  }

  get childIndex() {
    return this.childId ? this.children.findIndex((c) => c.id === this.childId) : -1
  }

  withTrack(tId: number, cId?: number) {
    return new CurrentContent(this.sourceId, this.tracks, tId, cId)
  }

  withChild(cId: number) {
    return new CurrentContent(this.sourceId, this.tracks, this.trackId, cId)
  }

  get hasNextTrack() {
    return this.trackIndex < this.tracks.length - 1
  }

  get hasPrevTrack() {
    return this.trackIndex > 0
  }

  get hasNextChild() {
    return this.childIndex >= 0 && this.childIndex < this.children.length - 1
  }

  get hasPrevChild() {
    return this.childIndex > 0
  }

  get hasChildren() {
    return this.children.length > 0
  }

  get duration() {
    return this.child?.duration || this.track?.duration || 0
  }

  // backward compat aliases used by EpisodePlayer / other consumers
  get seriesId() {
    return this.sourceId
  }
  get episodeId() {
    return this.trackId
  }
  get unitId() {
    return this.childId
  }
  get episodes() {
    return this.tracks
  }
  get episode() {
    return this.track
  }
  get unit() {
    return this.child
  }
  get units() {
    return this.children
  }
  get episodeIndex() {
    return this.trackIndex
  }
  get unitIndex() {
    return this.childIndex
  }
  get hasNextEpisode() {
    return this.hasNextTrack
  }
  get hasPrevEpisode() {
    return this.hasPrevTrack
  }
  get hasNextUnit() {
    return this.hasNextChild
  }
  get hasPrevUnit() {
    return this.hasPrevChild
  }
  get hasUnits() {
    return this.hasChildren
  }
  withEpisode(tId: number, cId?: number) {
    return this.withTrack(tId, cId)
  }
  withUnit(cId: number) {
    return this.withChild(cId)
  }
}

const PlayerContext = createContext<
  | {
      currentContent: CurrentContent | undefined
      playedItemIds: Set<number>
      state: {
        playbackState: PlaybackState
        currentTime: number
        duration: number
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
        handleLoad: (duration: number) => void
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
      playingPlaylistId: string | null
      queue: QueueItem[]
      autoPlayNext: boolean
      navigation: {
        play: (sourceId: number, tracks: PlayableTrack[], trackId?: number, childId?: number) => void
        select: (trackId: number, childId?: number) => void
        nextTrack: () => void
        prevTrack: () => void
        nextChild: () => void
        prevChild: () => void
        playFromList: (
          tracks: PlayableTrack[],
          trackId: number,
          childId?: number,
          options?: { playlistId?: string; keepPlaybackState?: boolean },
        ) => void
      }
      queueActions: {
        addToQueue: (item: Omit<QueueItem, 'id'>) => void
        removeFromQueue: (itemId: string) => void
        reorderQueue: (from: number, to: number) => void
        clearQueue: () => void
        setAutoPlayNext: (v: boolean) => void
      }
      controls: {
        pause: () => void
        resume: () => void
        seek: (time: number) => void
        skipForward: (seconds: number) => void
        skipBackward: (seconds: number) => void
        startSliding: () => void
        stopSliding: (time: number) => void
        updateSlidingTime: (time: number) => void
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
  const [currentContent, setCurrentContent] = useState<CurrentContent>()
  const [playedItemIds, setPlayedItemIds] = useState<Set<number>>(new Set())

  // queue & playlist playback
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [autoPlayNext, setAutoPlayNextState] = useState(true)
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null)
  const queueLoadedRef = useRef(false)

  useEffect(() => {
    StorageRepository.getPlayedItemIds().then((ids) => setPlayedItemIds(new Set(ids)))
    AsyncStorage.getItem(QUEUE_KEYS.queue).then((raw) => {
      if (raw) setQueue(JSON.parse(raw))
      queueLoadedRef.current = true
    })
    AsyncStorage.getItem(QUEUE_KEYS.autoPlayNext).then((raw) => {
      if (raw !== null) setAutoPlayNextState(raw === 'true')
    })
  }, [])

  useEffect(() => {
    if (!queueLoadedRef.current) return
    void AsyncStorage.setItem(QUEUE_KEYS.queue, JSON.stringify(queue))
  }, [queue])

  useEffect(() => {
    if (!queueLoadedRef.current) return
    void AsyncStorage.setItem(QUEUE_KEYS.autoPlayNext, String(autoPlayNext))
  }, [autoPlayNext])

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const switchContent = (content: CurrentContent, keepPlaybackState = false) => {
    setCurrentContent(content)
    if (keepPlaybackState) {
      updateState({ currentTime: 0, duration: 0 })
    } else {
      updateState({ playbackState: 'loading', currentTime: 0, duration: 0 })
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = setTimeout(() => {
        setState((prev) => {
          if (prev.playbackState !== 'loading') return prev
          Alert.alert('読み込みエラー', 'メディアの読み込みに失敗しました')
          return { ...prev, playbackState: 'error' }
        })
      }, 30000)
    }
    lastProgressReportRef.current = 0
    playEndSentRef.current = false
  }

  // state
  const [state, setState] = useState({ playbackState: 'idle' as PlaybackState, currentTime: 0, duration: 0 })
  const updateState = (patch: Partial<typeof state>) => setState((prev) => ({ ...prev, ...patch }))
  const seekTargetRef = useRef<number | null>(null)
  const isSlidingRef = useRef(false)
  const doSeek = (time: number) => {
    seekTargetRef.current = time
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

  const applyDefaultSettings = async () => {
    const saved = await StorageRepository.getPlayerSettings()
    updateSettings(saved)
  }

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
  const playingPlaylistIdRef = useRef(playingPlaylistId)
  playingPlaylistIdRef.current = playingPlaylistId

  const nextTrackInternal = () => {
    const content = currentContentRef.current
    if (!content) return

    if (settingsRef.current.isShuffleOn && content.tracks.length > 1) {
      const others = content.tracks.filter((t) => t.id !== content.trackId)
      const random = others[Math.floor(Math.random() * others.length)]
      switchContent(content.withTrack(random.id, random.children?.[0]?.id))
      return
    }

    const idx = content.trackIndex
    if (idx < content.tracks.length - 1) {
      const next = content.tracks[idx + 1]
      switchContent(content.withTrack(next.id, next.children?.[0]?.id))
    }
  }

  // play tracking
  const lastProgressReportRef = useRef(0)
  const playEndSentRef = useRef(false)

  const markPlayed = useCallback((itemId: number) => {
    setPlayedItemIds((prev) => {
      if (prev.has(itemId)) return prev
      const next = new Set(prev)
      next.add(itemId)
      StorageRepository.addPlayedItemId(itemId)
      return next
    })
  }, [])

  const handleProgress = useCallback(
    (currentTime: number) => {
      setState((prev) => {
        if (prev.playbackState === 'loading' || isSlidingRef.current) return prev
        if (seekTargetRef.current !== null) {
          if (Math.abs(currentTime - seekTargetRef.current) < 1) {
            seekTargetRef.current = null
          } else {
            return prev
          }
        }
        return { ...prev, currentTime }
      })

      const content = currentContentRef.current
      if (!content) return
      const dur = content.duration
      if (dur <= 0) return
      const itemId = content.childId ?? content.trackId
      const progressPercent = Math.round((currentTime / dur) * 100)

      const now = Date.now()
      if (now - lastProgressReportRef.current >= 5000) {
        lastProgressReportRef.current = now
        apiRepository
          .updatePlayProgress({ series_id: content.sourceId, item_id: itemId, progress: progressPercent })
          .catch(() => {})
      }

      if (!playEndSentRef.current && progressPercent >= 95) {
        playEndSentRef.current = true
        apiRepository.updatePlayEnd({ series_id: content.sourceId, item_id: itemId }).catch(() => {})
        markPlayed(itemId)
      }
    },
    [markPlayed],
  )

  const handleLoad = useCallback((duration: number) => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    setState((prev) => (prev.playbackState === 'loading' ? { ...prev, playbackState: 'playing', duration } : prev))
  }, [])

  const [isBuffering, setIsBuffering] = useState(false)
  const handleBuffer = useCallback((buffering: boolean) => {
    setIsBuffering(buffering)
  }, [])

  const handleEnd = useCallback(() => {
    const s = settingsRef.current
    const content = currentContentRef.current

    if (playingPlaylistIdRef.current === '__queue__' && content) {
      setQueue((prev) => prev.filter((q) => q.trackId !== content.trackId || q.childId !== content.childId))
      if (content.hasNextTrack) {
        nextTrackInternal()
        return
      }
      setPlayingPlaylistId(null)
      setState((prev) => ({ ...prev, playbackState: 'ended' }))
      return
    }

    if (s.loopMode === 'single') {
      videoRef.current?.seek(0)
      setState((prev) => ({ ...prev, currentTime: 0, playbackState: 'playing' }))
      return
    }
    if (s.isShuffleOn && content) {
      nextTrackInternal()
      return
    }
    if (s.loopMode === 'all' && content) {
      if (content.childId) {
        const cIdx = content.childIndex
        if (cIdx < content.children.length - 1) {
          switchContent(content.withChild(content.children[cIdx + 1].id))
          return
        }
      }
      const tIdx = content.trackIndex
      if (tIdx < content.tracks.length - 1) {
        nextTrackInternal()
      } else {
        const first = content.tracks[0]
        switchContent(content.withTrack(first.id, first.children?.[0]?.id))
      }
      return
    }
    setState((prev) => ({ ...prev, playbackState: 'ended' }))
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        currentContent,
        playedItemIds,
        playingPlaylistId,
        queue,
        autoPlayNext,
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
          skipForward: (seconds) => doSeek(Math.min(state.currentTime + seconds, state.duration)),
          skipBackward: (seconds) => doSeek(Math.max(state.currentTime - seconds, 0)),
          startSliding: () => {
            isSlidingRef.current = true
          },
          stopSliding: (time: number) => {
            isSlidingRef.current = false
            doSeek(time)
          },
          updateSlidingTime: (time: number) => {
            updateState({ currentTime: time })
          },
        },
        navigation: {
          play: (sourceId, tracks, trackId?, childId?) => {
            const t = trackId ? (tracks.find((tr) => tr.id === trackId) ?? tracks[0]) : tracks[0]

            setPlayingPlaylistId(null)
            switchContent(new CurrentContent(sourceId, tracks, t.id, childId ?? t.children?.[0]?.id))
            setPlayerExpanded(true)
            void applyDefaultSettings()
          },
          nextTrack: nextTrackInternal,
          prevTrack: () => {
            if (!currentContent) return
            const idx = currentContent.trackIndex
            if (idx > 0) {
              const prev = currentContent.tracks[idx - 1]
              switchContent(currentContent.withTrack(prev.id, prev.children?.[0]?.id))
            }
          },
          nextChild: () => {
            if (!currentContent?.childId) return
            const idx = currentContent.childIndex
            if (idx < currentContent.children.length - 1) {
              switchContent(currentContent.withChild(currentContent.children[idx + 1].id))
            }
          },
          prevChild: () => {
            if (!currentContent?.childId) return
            const idx = currentContent.childIndex
            if (idx > 0) {
              switchContent(currentContent.withChild(currentContent.children[idx - 1].id))
            }
          },
          select: (trackId, childId?) => {
            if (!currentContent) return
            const t = currentContent.tracks.find((tr) => tr.id === trackId)
            switchContent(currentContent.withTrack(trackId, childId ?? t?.children?.[0]?.id))
          },
          playFromList: (tracks, trackId, childId?, options?) => {
            if (tracks.length === 0) return
            setPlayingPlaylistId(options?.playlistId ?? null)
            setPlayerExpanded(false)
            switchContent(new CurrentContent(0, tracks, trackId, childId), options?.keepPlaybackState)
            void applyDefaultSettings()
          },
        },
        queueActions: {
          addToQueue: (item) => setQueue((prev) => [...prev, { ...item, id: uid() }]),
          removeFromQueue: (itemId) => setQueue((prev) => prev.filter((i) => i.id !== itemId)),
          reorderQueue: (from, to) => setQueue((prev) => reorder(prev, from, to)),
          clearQueue: () => setQueue([]),
          setAutoPlayNext: setAutoPlayNextState,
        },
        view: {
          closePlayer: () => {
            setCurrentContent(undefined)
            setPlayingPlaylistId(null)
            updateState({ playbackState: 'idle', currentTime: 0, duration: 0 })
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
  const { getLocalPath, incrementPlayCount, downloads } = useDownload()
  const mediaUrl = currentContent?.mediaUrl
  const localPath = mediaUrl ? getLocalPath(mediaUrl) : undefined
  const effectiveUrl = localPath
    ? localPath.startsWith('http') || localPath.startsWith('file://')
      ? localPath
      : `file://${localPath}`
    : mediaUrl
  const source = useMemo(() => (effectiveUrl ? { uri: effectiveUrl } : undefined), [effectiveUrl])

  const playCountIncrementedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!mediaUrl || !localPath) return
    const item = downloads.find((d) => d.originalUrl === mediaUrl)
    if (item && playCountIncrementedRef.current !== item.id) {
      playCountIncrementedRef.current = item.id
      incrementPlayCount(item.id)
    }
  }, [mediaUrl, localPath, downloads, incrementPlayCount])
  const onProgress = useCallback((data: { currentTime: number }) => handleProgress(data.currentTime), [handleProgress])
  const onPipStatusChanged = useCallback(
    ({ isActive }: { isActive: boolean }) => setPipActive(isActive),
    [setPipActive],
  )
  const onLoad = useCallback((data: { duration: number }) => handleLoad(data.duration), [handleLoad])
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
      style={[style, playbackState === 'loading' && { opacity: 0 }]}
      resizeMode='cover'
      paused={playbackState !== 'playing' && playbackState !== 'loading'}
      rate={playbackRate}
      volume={volume / 100}
      onProgress={onProgress}
      onLoad={onLoad}
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
