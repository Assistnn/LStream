import Slider from '@react-native-community/slider'
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Gauge,
  List,
  Maximize,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import type { LoopMode, MyChapter } from '../../repositories/storage'
import { StorageRepository } from '../../repositories/storage'
import { EpisodeMediaList } from '../listitem/EpisodeMediaList'
import { FavoriteButton } from '../ui/FavoriteButton'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const EpisodePlayer = ({
  visible,
  showEpisodeList: initialShowEpisodeList = false,
  onClose,
}: {
  visible: boolean
  showEpisodeList?: boolean
  onClose: () => void
}) => {
  const { colors, styles, spacing } = useTheme()
  const insets = useSafeAreaInsets()
  const {
    currentContent,
    playedItemIds,
    state: { playbackState, currentTime, duration: mediaDuration },
    controls: { pause, resume, seek, skipForward, skipBackward, startSliding, stopSliding, updateSlidingTime },
    navigation: { nextTrack, prevTrack, nextChild, prevChild, select },
    view: { setPlayerExpanded, setExpandedSlot },
    settings: {
      playbackRate,
      setPlaybackRate,
      volume,
      setVolume,
      sleepTimer,
      setSleepTimer,
      loopMode,
      setLoopMode,
      isShuffleOn,
      setShuffleOn,
      setIsFullscreen,
    },
  } = usePlayer()

  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const [showVolumeMenu, setShowVolumeMenu] = useState(false)
  const [showEpisodeList, setShowEpisodeList] = useState(initialShowEpisodeList)
  const [showChapterList, setShowChapterList] = useState(false)
  const [myChapters, setMyChapters] = useState<MyChapter[]>([])
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingChapterName, setEditingChapterName] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unplayed'>('all')
  const [sortOrder, setSortOrder] = useState<'default' | 'newest' | 'oldest'>('default')
  const [showNextEpisode, setShowNextEpisode] = useState(true)
  const outerRef = useRef<View>(null)
  const slotRef = useRef<View>(null)

  const measureSlot = useCallback(() => {
    const outer = outerRef.current
    if (!outer) return
    slotRef.current?.measureLayout(
      outer,
      (x, y, width, height) => {
        if (width > 0 && height > 0) {
          setExpandedSlot({ x, y, width, height })
        }
      },
      () => {},
    )
  }, [setExpandedSlot])

  useEffect(() => {
    setShowEpisodeList(initialShowEpisodeList)
  }, [initialShowEpisodeList])

  useEffect(() => {
    setPlayerExpanded(visible)
    if (visible) {
      StorageRepository.getShowNextEpisode().then(setShowNextEpisode)
    }
  }, [visible, setPlayerExpanded])

  const currentMediaId = currentContent?.unitId ?? currentContent?.episodeId
  useEffect(() => {
    if (currentMediaId) {
      StorageRepository.getMyChapters(currentMediaId).then(setMyChapters)
    }
  }, [currentMediaId])

  const saveMyChapters = useCallback(
    (chapters: MyChapter[]) => {
      setMyChapters(chapters)
      if (currentMediaId) {
        StorageRepository.setMyChapters(currentMediaId, chapters)
      }
    },
    [currentMediaId],
  )

  const isPlaying = playbackState === 'playing'

  if (!currentContent) return null

  const {
    episodes,
    episodeId,
    unitId,
    episode,
    unit: currentUnit,
    hasNextEpisode,
    hasPrevEpisode,
    hasNextUnit,
    hasPrevUnit,
    hasUnits,
  } = currentContent
  const thumbnail = currentUnit?.img || episode.img

  const currentEpisodeIndex = currentContent.episodeIndex
  const units = currentContent.units

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0]
  const timerOptions = [
    { label: 'なし', value: undefined },
    { label: '15分', value: 15 },
    { label: '30分', value: 30 },
    { label: '1時間', value: 60 },
    { label: '2時間', value: 120 },
    { label: '4時間', value: 240 },
  ]

  const getSleepTimerLabel = () => {
    if (!sleepTimer) return 'し'
    if (sleepTimer < 60) return `${sleepTimer}分`
    return `${sleepTimer / 60}時間`
  }

  const getSortedEpisodes = () => {
    let filtered = [...episodes]

    if (filterType === 'unplayed') {
      filtered = filtered.filter((ep) => {
        if (ep.children && ep.children.length > 0) {
          return ep.children.some((u) => !playedItemIds.has(u.id))
        }
        return !playedItemIds.has(ep.id)
      })
    }

    if (sortOrder === 'newest') {
      filtered.reverse()
    } else if (sortOrder === 'oldest') {
      // Already in default order
    }

    return filtered
  }

  return (
    <View ref={outerRef} collapsable={false} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronDown size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center', marginHorizontal: spacing.lg }}>
          <Text style={[styles.bodySmall, { textAlign: 'center' }]} numberOfLines={1}>
            {episode.parentTitle}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowEpisodeList(!showEpisodeList)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <List size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {!showEpisodeList ? (
        <>
          {/* Full Player View */}
          <View style={{ flex: 1 }}>
            {/* Artwork or Video slot (PlayerVideo overlays this at MainScreen level) */}
            <View style={{ paddingVertical: spacing.xl, backgroundColor: '#000' }}>
              <View
                ref={slotRef}
                onLayout={measureSlot}
                collapsable={false}
                style={{
                  width: '100%',
                  aspectRatio: 16 / 9,
                  backgroundColor: currentContent.isVideo ? '#000' : 'transparent',
                }}
              >
                {!currentContent.isVideo && thumbnail && (
                  <Image
                    source={{ uri: thumbnail }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    resizeMode='cover'
                  />
                )}
              </View>
            </View>
            {/* Episode Info */}
            <View
              style={{
                paddingHorizontal: spacing.lg,
                justifyContent: 'center',
                position: 'relative',
                paddingTop: spacing.xl,
              }}
            >
              <View style={{ gap: 4 }}>
                {currentUnit ? (
                  <Text style={[styles.bodyText, { textAlign: 'center' }]}>
                    Unit.{units.findIndex((ch) => ch.id === currentUnit?.id) + 1}
                  </Text>
                ) : (
                  <Text style={[styles.bodyText, { textAlign: 'center' }]}>Episode.{currentEpisodeIndex + 1}</Text>
                )}
                <Text style={[styles.text2xl, { textAlign: 'center' }]} numberOfLines={2}>
                  {currentUnit ? currentUnit.title : episode.title}
                </Text>
                <Text style={[styles.bodyTiny, { textAlign: 'center' }]} numberOfLines={1}>
                  <Text>{currentUnit ? `Ep.${currentEpisodeIndex + 1}` : ''}</Text>
                  <Text> {currentUnit ? episode.title : ''}</Text>
                </Text>
              </View>
              {/* Favorite button in top right */}
              <FavoriteButton
                itemId={unitId ?? episodeId}
                size={20}
                buttonStyle={{
                  position: 'absolute',
                  top: spacing.xl,
                  right: spacing.lg,
                  padding: spacing.sm,
                  zIndex: 10,
                }}
              />
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ gap: spacing.xl }}>
              {/* Progress bar */}
              <View style={{ paddingHorizontal: spacing['3xl'] }}>
                <Slider
                  style={{ width: '100%' }}
                  minimumValue={0}
                  maximumValue={mediaDuration || 1}
                  value={currentTime}
                  onSlidingStart={startSliding}
                  onValueChange={updateSlidingTime}
                  onSlidingComplete={stopSliding}
                  minimumTrackTintColor={colors.tabBarActive}
                  maximumTrackTintColor={colors.muted}
                  thumbTintColor={colors.tabBarActive}
                />
                <View style={{ height: spacing.sm }} />
                {/* Time labels */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.bodyTiny}>{formatTime(currentTime)}</Text>
                  <Text style={styles.bodyTiny}>-{formatTime(mediaDuration - currentTime)}</Text>
                </View>
              </View>

              {/* Main controls */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  paddingHorizontal: spacing['6xl'],
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (hasPrevEpisode) prevTrack()
                  }}
                  disabled={!hasPrevEpisode}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: spacing.sm }}
                >
                  <SkipBack
                    size={36}
                    color={!hasPrevEpisode ? colors.muted : colors.text}
                    fill={!hasPrevEpisode ? colors.muted : colors.text}
                  />
                </TouchableOpacity>

                {/* Previous Unit Button */}
                {hasUnits && (
                  <TouchableOpacity
                    onPress={() => prevChild()}
                    disabled={!hasPrevUnit}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: spacing.sm }}
                  >
                    <ChevronsLeft size={32} color={hasPrevUnit ? colors.text : colors.muted} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => skipBackward(30)}
                  disabled={currentTime < 30}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: spacing.sm, position: 'relative' }}
                >
                  <RotateCcw size={32} color={currentTime < 30 ? colors.muted : colors.text} />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: currentTime < 30 ? colors.muted : colors.text,
                      }}
                    >
                      30
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => (isPlaying ? pause() : resume())}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: spacing.sm }}
                >
                  {isPlaying ? (
                    <Pause size={64} color={colors.text} fill={colors.text} />
                  ) : (
                    <Play size={64} color={colors.text} fill={colors.text} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => skipForward(30)}
                  disabled={currentTime >= mediaDuration - 30}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: spacing.sm, position: 'relative' }}
                >
                  <RotateCw size={32} color={currentTime >= mediaDuration - 30 ? colors.muted : colors.text} />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: currentTime >= mediaDuration - 30 ? colors.muted : colors.text,
                      }}
                    >
                      30
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Next Unit Button */}
                {hasUnits && (
                  <TouchableOpacity
                    onPress={() => nextChild()}
                    disabled={!hasNextUnit}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: spacing.sm }}
                  >
                    <ChevronsRight size={32} color={hasNextUnit ? colors.text : colors.muted} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    if (hasNextEpisode) nextTrack()
                  }}
                  disabled={!hasNextEpisode}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: spacing.sm }}
                >
                  <SkipForward
                    size={36}
                    color={!hasNextEpisode ? colors.muted : colors.text}
                    fill={!hasNextEpisode ? colors.muted : colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Secondary controls */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                  paddingHorizontal: spacing['2xl'],
                }}
              >
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowSpeedMenu(!showSpeedMenu)
                      setShowTimerMenu(false)
                      setShowVolumeMenu(false)
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: showSpeedMenu ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Gauge size={20} color={showSpeedMenu ? colors.background : colors.text} />
                    {playbackRate !== 1.0 && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 8,
                          minWidth: 18,
                          backgroundColor: colors.text,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 8,
                            fontWeight: '600',
                            textAlign: 'center',
                            color: colors.background,
                          }}
                        >
                          {playbackRate}x
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      const modes: LoopMode[] = ['off', 'all', 'single']
                      const currentIndex = modes.indexOf(loopMode)
                      setLoopMode(modes[(currentIndex + 1) % modes.length])
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: loopMode !== 'off' ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Repeat size={20} color={loopMode !== 'off' ? colors.background : colors.text} />
                    {loopMode === 'single' && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: colors.text,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.background }}>1</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => setShuffleOn(!isShuffleOn)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isShuffleOn ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Shuffle size={20} color={isShuffleOn ? colors.background : colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowVolumeMenu(!showVolumeMenu)
                      setShowSpeedMenu(false)
                      setShowTimerMenu(false)
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: showVolumeMenu ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Volume2 size={20} color={showVolumeMenu ? colors.background : colors.text} />
                    {volume !== 100 && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 8,
                          minWidth: 18,
                          backgroundColor: colors.text,
                        }}
                      >
                        <Text style={{ fontSize: 8, fontWeight: '600', textAlign: 'center', color: colors.background }}>
                          {Math.floor(volume)}%
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => setShowChapterList(!showChapterList)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: showChapterList ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <List size={20} color={showChapterList ? colors.background : colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimerMenu(!showTimerMenu)
                      setShowSpeedMenu(false)
                      setShowVolumeMenu(false)
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: showTimerMenu ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Clock size={20} color={showTimerMenu ? colors.background : colors.text} />
                    {sleepTimer && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          paddingHorizontal: 4,
                          paddingVertical: 1,
                          borderRadius: 8,
                          minWidth: 18,
                          backgroundColor: colors.text,
                        }}
                      >
                        <Text style={{ fontSize: 8, fontWeight: '600', textAlign: 'center', color: colors.background }}>
                          {getSleepTimerLabel()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => setIsFullscreen(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Maximize size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.lg,
              marginTop: spacing['3xl'],
            }}
          >
            {/* Next Episode Display */}
            <View
              style={{
                opacity: hasNextEpisode && showNextEpisode ? 1 : 0,
                backgroundColor: colors.card,
                borderRadius: 999,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: hasNextEpisode && showNextEpisode ? 0.1 : 0,
                shadowRadius: 8,
                elevation: hasNextEpisode && showNextEpisode ? 4 : 0,
                borderWidth: 1,
                borderColor: hasNextEpisode && showNextEpisode ? colors.border : 'transparent',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                }}
              >
                <View style={{ width: 40, height: 40 }} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={[styles.bodyTiny, { fontSize: 9 }]}> </Text>
                  <Text style={styles.bodySmall}> </Text>
                  <Text style={styles.bodyTiny}> </Text>
                </View>
              </View>
              {hasNextEpisode && showNextEpisode && (
                <TouchableOpacity
                  onPress={nextTrack}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Svg width='40' height='40' style={{ position: 'absolute' }}>
                      <Defs>
                        <LinearGradient id='greenGradient' x1='0' y1='0' x2='1' y2='1'>
                          <Stop offset='0' stopColor='#10b981' stopOpacity='1' />
                          <Stop offset='1' stopColor='#059669' stopOpacity='1' />
                        </LinearGradient>
                      </Defs>
                      <Rect width='40' height='40' fill='url(#greenGradient)' />
                    </Svg>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>{currentEpisodeIndex + 2}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={[styles.bodyTiny, { fontSize: 9, letterSpacing: 0.5, fontWeight: '500' }]}>
                      次のエピソード
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={[styles.bodySmall, { color: colors.text }]}>Ep.{currentEpisodeIndex + 2}</Text>
                      <Text style={styles.titleMedium} numberOfLines={1}>
                        {episodes[currentEpisodeIndex + 1]?.title}
                      </Text>
                    </View>
                    <Text style={styles.bodyTiny}>
                      {Math.floor(episodes[currentEpisodeIndex + 1]?.duration / 60)}:
                      {(episodes[currentEpisodeIndex + 1]?.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      ) : (
        /* Episode List View */
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Full-width Thumbnail/Video */}
          <View style={{ paddingVertical: spacing.xl, backgroundColor: '#000' }}>
            <View
              ref={slotRef}
              onLayout={measureSlot}
              collapsable={false}
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                backgroundColor: currentContent.isVideo ? '#000' : 'transparent',
              }}
            >
              {!currentContent.isVideo && thumbnail && (
                <Image
                  source={{ uri: thumbnail }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  resizeMode='cover'
                />
              )}
            </View>
          </View>

          {/* Episode Info */}
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ gap: 2 }}>
              {currentUnit ? (
                <>
                  <Text style={[styles.bodySmall, { fontWeight: '600' }]} numberOfLines={1}>
                    Unit.{units.findIndex((ch) => ch.id === currentUnit?.id) + 1} {currentUnit.title}
                  </Text>
                  <Text style={styles.bodyTiny} numberOfLines={1}>
                    Ep.{currentEpisodeIndex + 1} {episode.title}
                  </Text>
                </>
              ) : (
                <Text style={[styles.bodySmall, { fontWeight: '600' }]} numberOfLines={1}>
                  Episode.{currentEpisodeIndex + 1} {episode.title}
                </Text>
              )}
            </View>
          </View>

          {/* Title and Filters */}
          <Text style={[styles.titleLarge, { padding: spacing.lg, paddingBottom: spacing.md }]}>エピソード一覧</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.lg,
              gap: spacing.md,
            }}
          >
            {/* Filter Buttons */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setFilterType('all')}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing['2xs'],
                  borderRadius: 20,
                  backgroundColor: filterType === 'all' ? colors.primary : colors.muted,
                }}
              >
                <Text
                  style={[
                    styles.bodyTiny,
                    {
                      color: filterType === 'all' ? colors.primaryForeground : colors.text,
                      fontWeight: '600',
                    },
                  ]}
                >
                  すべて
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterType('unplayed')}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing['2xs'],
                  borderRadius: 20,
                  backgroundColor: filterType === 'unplayed' ? colors.primary : colors.muted,
                }}
              >
                <Text
                  style={[
                    styles.bodyTiny,
                    {
                      color: filterType === 'unplayed' ? colors.primaryForeground : colors.text,
                      fontWeight: '600',
                    },
                  ]}
                >
                  未再生のみ
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort Dropdown */}
            <TouchableOpacity
              onPress={() => {
                const orders: Array<'default' | 'newest' | 'oldest'> = ['default', 'oldest', 'newest']
                const currentIndex = orders.indexOf(sortOrder)
                setSortOrder(orders[(currentIndex + 1) % orders.length])
              }}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing['2xs'],
                borderRadius: spacing.md,
                backgroundColor: colors.muted,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={[styles.bodyTiny, { fontWeight: '600' }]}>
                {sortOrder === 'default' ? 'デフォルト' : sortOrder === 'newest' ? '新着順' : '登録順'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Episode List */}
          <ScrollView style={{ flex: 1 }}>
            <EpisodeMediaList
              episodes={getSortedEpisodes()}
              onEpisodePress={(ep) => {
                if (ep.id !== episode.id) {
                  select(ep.id)
                }
              }}
              onUnitPress={(ep, unit) => select(ep.id, unit.id)}
            />
          </ScrollView>
        </View>
      )}

      {/* Speed Menu */}
      {showSpeedMenu && (
        <View
          style={{
            position: 'absolute',
            bottom: 180,
            left: spacing.lg,
            backgroundColor: colors.card,
            borderRadius: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.sm,
            minWidth: 100,
            zIndex: 20,
          }}
        >
          {speedOptions.map((speed) => (
            <TouchableOpacity
              key={speed}
              onPress={() => {
                setPlaybackRate(speed)
                setShowSpeedMenu(false)
              }}
              style={{ padding: spacing.md, borderRadius: spacing.md }}
            >
              <Text
                style={[
                  styles.textDefault,
                  {
                    color: playbackRate === speed ? colors.primary : colors.text,
                    fontWeight: playbackRate === speed ? '600' : '400',
                  },
                ]}
              >
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Timer Menu */}
      {showTimerMenu && (
        <View
          style={{
            position: 'absolute',
            bottom: 180,
            right: spacing.lg * 3.5,
            backgroundColor: colors.card,
            borderRadius: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.sm,
            minWidth: 100,
            zIndex: 20,
          }}
        >
          {timerOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => {
                setSleepTimer(option.value)
                setShowTimerMenu(false)
              }}
              style={{ padding: spacing.md, borderRadius: spacing.md }}
            >
              <Text
                style={[
                  styles.textDefault,
                  {
                    color: sleepTimer === option.value ? colors.primary : colors.text,
                    fontWeight: sleepTimer === option.value ? '600' : '400',
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Volume Menu */}
      {showVolumeMenu && (
        <View
          style={{
            position: 'absolute',
            bottom: 180,
            left: spacing.lg,
            right: spacing.lg,
            backgroundColor: colors.card,
            borderRadius: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            minWidth: 240,
            zIndex: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Volume2 size={16} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                value={volume}
                onValueChange={(value) => setVolume(value)}
                minimumTrackTintColor={colors.tabBarActive}
                maximumTrackTintColor={colors.muted}
                thumbTintColor={colors.tabBarActive}
              />
            </View>
            <Text style={[styles.bodyTiny, { width: 40, textAlign: 'right' }]}>{Math.floor(volume)}%</Text>
          </View>
        </View>
      )}

      {showChapterList && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
            zIndex: 30,
          }}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowChapterList(false)} />
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={styles.titleLarge}>チャプター</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => {
                    const newChapter: MyChapter = {
                      id: `my-chapter-${Date.now()}`,
                      time: currentTime,
                    }
                    saveMyChapters([...myChapters, newChapter])
                  }}
                  style={{
                    padding: spacing.sm,
                    borderRadius: spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Plus size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowChapterList(false)
                    setEditingChapterId(null)
                  }}
                  style={{
                    padding: spacing.sm,
                    borderRadius: 16,
                  }}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
              {myChapters.length > 0 && (
                <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      backgroundColor: colors.muted,
                    }}
                  >
                    <Text style={[styles.bodySmall, { fontWeight: '600' }]}>マイチャプター</Text>
                  </View>
                  {myChapters.map((myChapter, index) => (
                    <TouchableOpacity
                      key={myChapter.id}
                      onPress={() => {
                        if (editingChapterId !== myChapter.id) {
                          seek(myChapter.time)
                          setShowChapterList(false)
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={[styles.bodySmall, { width: 48 }]}>{formatTime(myChapter.time)}</Text>
                      {editingChapterId === myChapter.id ? (
                        <TextInput
                          style={[
                            styles.textDefault,
                            {
                              flex: 1,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.primary,
                              paddingVertical: 2,
                              color: colors.text,
                            },
                          ]}
                          value={editingChapterName}
                          onChangeText={setEditingChapterName}
                          onBlur={() => {
                            saveMyChapters(
                              myChapters.map((ch) =>
                                ch.id === myChapter.id ? { ...ch, name: editingChapterName || undefined } : ch,
                              ),
                            )
                            setEditingChapterId(null)
                            setEditingChapterName('')
                          }}
                          onSubmitEditing={() => {
                            saveMyChapters(
                              myChapters.map((ch) =>
                                ch.id === myChapter.id ? { ...ch, name: editingChapterName || undefined } : ch,
                              ),
                            )
                            setEditingChapterId(null)
                            setEditingChapterName('')
                          }}
                          autoFocus
                          placeholder={`マイチャプター${index + 1}`}
                          placeholderTextColor={colors.textSecondary}
                        />
                      ) : (
                        <Text style={[styles.textDefault, { flex: 1 }]} numberOfLines={1}>
                          {myChapter.name || `マイチャプター${index + 1}`}
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => {
                          setEditingChapterId(myChapter.id)
                          setEditingChapterName(myChapter.name || '')
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Pencil size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {myChapters.length === 0 && (
                <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing['3xl'], alignItems: 'center' }}>
                  <Text style={styles.bodySmall}>チャプターがありません</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
