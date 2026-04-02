import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ImageStyle, ViewStyle } from 'react-native'
import { Image, Text, View } from 'react-native'
import Video, { type OnLoadData, type OnProgressData, type VideoRef } from 'react-native-video'

import type { SeriesMedia, SeriesResponse } from '../repositories/api/IApiRepository'

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
type LoopMode = 'off' | 'single' | 'all'
type PlayerView = 'mini' | 'episode' | 'fullscreen'

interface CurrentContent {
  series: SeriesResponse
  episodes: SeriesMedia[]
  episode: SeriesMedia
  chapter?: SeriesMedia
}

interface PlayerContextValue {
  currentContent: CurrentContent | null
  playbackState: PlaybackState
  currentTime: number
  duration: number
  playbackRate: number
  isFullscreen: boolean
  volume: number
  sleepTimer: number | null
  loopMode: LoopMode
  isShuffleOn: boolean
  playerView: PlayerView

  playEpisode: (series: SeriesResponse, episodes: SeriesMedia[], episode: SeriesMedia, chapter?: SeriesMedia) => void
  togglePlayPause: () => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
  skipForward: (seconds: number) => void
  skipBackward: (seconds: number) => void
  playNextEpisode: () => void
  playPreviousEpisode: () => void
  playNextChapter: () => void
  playPreviousChapter: () => void
  closePlayer: () => void
  setFullscreen: (fullscreen: boolean) => void
  setVolume: (volume: number) => void
  setSleepTimer: (minutes: number | null) => void
  setLoopMode: (mode: LoopMode) => void
  setShuffleOn: (on: boolean) => void
  setPlayerView: (view: PlayerView) => void
  renderMediaDisplay: (style: ViewStyle | ImageStyle, display: PlayerView) => React.ReactElement | null
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
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(75)
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [loopMode, setLoopMode] = useState<LoopMode>('off')
  const [isShuffleOn, setShuffleOn] = useState(false)
  const [playerView, setPlayerView] = useState<PlayerView>('mini')

  const videoRef = useRef<VideoRef>(null)
  const [pendingSeek, setPendingSeek] = useState(false)
  const currentTimeRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      const progress = currentContent?.chapter?.progress || currentContent?.episode.progress || 0
      if (progress > 0) {
        setPendingSeek(true)
        videoRef.current?.seek(progress)
        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
        seekTimeoutRef.current = setTimeout(() => setPendingSeek(false), 500)
      }
    } else if (currentTimeRef.current > 0) {
      setPendingSeek(true)
      videoRef.current?.seek(currentTimeRef.current)
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
      seekTimeoutRef.current = setTimeout(() => setPendingSeek(false), 500)
    }
    setPlaybackState('playing')
  }

  const switchContent = (content: CurrentContent) => {
    isInitialLoadRef.current = true
    currentTimeRef.current = 0
    setCurrentContent(content)
    setPlaybackState('loading')
    setCurrentTime(content.chapter?.progress || content.episode.progress || 0)
    setDuration(content.chapter?.duration || content.episode.duration || 0)
    setPlaybackRate(1.0)
  }

  const playNextEpisodeInternal = () => {
    if (!currentContent) return
    const { episodes, episode, series } = currentContent

    if (isShuffleOn && episodes.length > 1) {
      const otherEpisodes = episodes.filter((ep) => ep.item_id !== episode.item_id)
      const randomEpisode = otherEpisodes[Math.floor(Math.random() * otherEpisodes.length)]
      switchContent({ series, episodes, episode: randomEpisode })
      return
    }

    const currentIndex = episodes.findIndex((ep) => ep.item_id === episode.item_id)
    if (currentIndex < episodes.length - 1) {
      switchContent({ series, episodes, episode: episodes[currentIndex + 1] })
    }
  }

  const handleEnd = () => {
    if (loopMode === 'single') {
      videoRef.current?.seek(0)
      setCurrentTime(0)
      currentTimeRef.current = 0
      setPlaybackState('playing')
      return
    }
    if (loopMode === 'all' && currentContent) {
      const { episodes, episode, series } = currentContent
      const currentIndex = episodes.findIndex((ep) => ep.item_id === episode.item_id)
      if (currentIndex < episodes.length - 1) {
        playNextEpisodeInternal()
      } else {
        switchContent({ series, episodes, episode: episodes[0] })
      }
      return
    }
    setPlaybackState('ended')
  }

  const doSeek = (time: number) => {
    setPendingSeek(true)
    setCurrentTime(time)
    currentTimeRef.current = time
    videoRef.current?.seek(time)
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
    seekTimeoutRef.current = setTimeout(() => setPendingSeek(false), 500)
  }

  const isVideoType = (content: CurrentContent) =>
    content.chapter ? content.chapter.type_media === 1 : content.episode.type_media === 1

  const renderThumbnail = (content: CurrentContent, style: ViewStyle | ImageStyle) => {
    const img = content.chapter?.img || content.episode.img
    if (img) {
      return <Image source={{ uri: img }} style={[style as ImageStyle, { borderRadius: 8 }]} resizeMode='cover' />
    }
    return (
      <View
        style={[
          style,
          { borderRadius: 8, backgroundColor: '#6b7280', justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ fontSize: 64 }}>🎵</Text>
      </View>
    )
  }

  return (
    <PlayerContext.Provider
      value={{
        currentContent,
        playbackState,
        currentTime,
        duration,
        playbackRate,
        isFullscreen,
        volume,
        sleepTimer,
        loopMode,
        isShuffleOn,
        playerView,
        playEpisode: (series, episodes, episode, chapter?) => {
          setPendingSeek(false)
          switchContent({ series, episodes, episode, chapter })
        },
        togglePlayPause: () => {
          if (playbackState === 'playing') {
            setPlaybackState('paused')
          } else if (playbackState === 'ended') {
            doSeek(0)
            setPlaybackState('playing')
          } else if (playbackState === 'paused' || playbackState === 'loading') {
            setPlaybackState('playing')
          }
        },
        pause: () => {
          if (playbackState === 'playing') {
            setPlaybackState('paused')
          }
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
        setPlaybackRate,
        skipForward: (seconds) => {
          doSeek(Math.min(currentTimeRef.current + seconds, duration))
        },
        skipBackward: (seconds) => {
          doSeek(Math.max(currentTimeRef.current - seconds, 0))
        },
        playNextEpisode: playNextEpisodeInternal,
        playPreviousEpisode: () => {
          if (!currentContent) return
          const currentIndex = currentContent.episodes.findIndex(
            (ep) => ep.item_id === currentContent.episode.item_id,
          )
          if (currentIndex > 0) {
            switchContent({
              series: currentContent.series,
              episodes: currentContent.episodes,
              episode: currentContent.episodes[currentIndex - 1],
            })
          }
        },
        playNextChapter: () => {
          if (!currentContent || !currentContent.chapter) return
          const units = currentContent.episode.units ?? []
          const currentIndex = units.findIndex((ch) => ch.item_id === currentContent.chapter?.item_id)
          if (currentIndex < units.length - 1) {
            switchContent({
              series: currentContent.series,
              episodes: currentContent.episodes,
              episode: currentContent.episode,
              chapter: units[currentIndex + 1],
            })
          }
        },
        playPreviousChapter: () => {
          if (!currentContent || !currentContent.chapter) return
          const units = currentContent.episode.units ?? []
          const currentIndex = units.findIndex((ch) => ch.item_id === currentContent.chapter?.item_id)
          if (currentIndex > 0) {
            switchContent({
              series: currentContent.series,
              episodes: currentContent.episodes,
              episode: currentContent.episode,
              chapter: units[currentIndex - 1],
            })
          }
        },
        closePlayer: () => {
          setPendingSeek(false)
          setCurrentContent(null)
          setPlaybackState('idle')
          setCurrentTime(0)
          setDuration(0)
          setPlaybackRate(1.0)
          setIsFullscreen(false)
          setVolume(75)
          setSleepTimer(null)
          setLoopMode('off')
          setShuffleOn(false)
          setPlayerView('mini')
        },
        setFullscreen: setIsFullscreen,
        setVolume,
        setSleepTimer,
        setLoopMode,
        setShuffleOn,
        setPlayerView,
        renderMediaDisplay: (style, display) => {
          if (!currentContent) return null

          if (isVideoType(currentContent)) {
            if (display === playerView) {
              return (
                <Video
                  ref={videoRef}
                  source={{ uri: currentContent.chapter?.url || currentContent.episode.url }}
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
            }
            return renderThumbnail(currentContent, style)
          }

          return renderThumbnail(currentContent, style)
        },
      }}
    >
      {children}
      {currentContent && !isVideoType(currentContent) && (
        <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>
          <Video
            ref={videoRef}
            source={{ uri: currentContent.chapter?.url || currentContent.episode.url }}
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
