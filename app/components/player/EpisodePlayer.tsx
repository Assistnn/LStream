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
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
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
  const {
    currentContent,
    state: { playbackState, currentTime, duration: mediaDuration },
    controls: { pause, resume, skipForward, skipBackward, startSliding, stopSliding, updateSlidingTime },
    navigation: { playNextEpisode, playPreviousEpisode, playNextUnit, playPreviousUnit, selectEpisode },
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
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'unplayed'>('all')
  const [sortOrder, setSortOrder] = useState<'default' | 'newest' | 'oldest'>('default')
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
  }, [visible, setPlayerExpanded])

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

  const toggleEpisodeExpansion = (episodeId: number) => {
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(episodeId)) {
        newSet.delete(episodeId)
      } else {
        newSet.add(episodeId)
      }
      return newSet
    })
  }

  const getSortedEpisodes = () => {
    let filtered = [...episodes]

    if (filterType === 'unplayed') {
      filtered = filtered.filter((ep) => ep.progress < ep.duration)
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
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ gap: spacing.xl }}>
              {/* Artwork or Video slot (PlayerVideo overlays this at MainScreen level) */}
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
              {/* Episode Info */}
              <View
                style={{
                  paddingHorizontal: spacing.lg,
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <View style={{ gap: 4 }}>
                  {currentUnit ? (
                    <Text style={[styles.bodyText, { textAlign: 'center' }]}>
                      Unit.{units.findIndex((ch) => ch.item_id === currentUnit?.item_id) + 1}
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
                    top: 0,
                    right: spacing.lg,
                    padding: spacing.sm,
                    zIndex: 10,
                  }}
                />
              </View>

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
                    if (hasPrevEpisode) playPreviousEpisode()
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
                    onPress={() => playPreviousUnit()}
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
                  <Text
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      textAlign: 'center',
                      lineHeight: 48,
                      fontSize: 10,
                      fontWeight: '700',
                      color: currentTime < 30 ? colors.muted : colors.text,
                    }}
                  >
                    30
                  </Text>
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
                  <Text
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      textAlign: 'center',
                      lineHeight: 48,
                      fontSize: 10,
                      fontWeight: '700',
                      color: currentTime >= mediaDuration - 30 ? colors.muted : colors.text,
                    }}
                  >
                    30
                  </Text>
                </TouchableOpacity>

                {/* Next Unit Button */}
                {hasUnits && (
                  <TouchableOpacity
                    onPress={() => playNextUnit()}
                    disabled={!hasNextUnit}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: spacing.sm }}
                  >
                    <ChevronsRight size={32} color={hasNextUnit ? colors.text : colors.muted} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    if (hasNextEpisode) playNextEpisode()
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
                      const modes: Array<'off' | 'single' | 'all'> = ['off', 'single', 'all']
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
                          {volume}%
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => setShowEpisodeList(!showEpisodeList)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: showEpisodeList ? colors.text : 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <List size={20} color={showEpisodeList ? colors.background : colors.text} />
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
          <View>
            {/* Next Episode Display */}
            {hasNextEpisode && (
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingBottom: spacing.lg,
                  marginTop: spacing.lg,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 999,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={playNextEpisode}
                    style={{
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
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                        {currentEpisodeIndex + 2}
                      </Text>
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
                </View>
              </View>
            )}
          </View>
        </>
      ) : (
        /* Episode List View */
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Mini Player at top */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing['2xs'],
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 56, height: 56, borderRadius: spacing.xs }}
              resizeMode='cover'
            />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.bodyTiny, { marginBottom: 2 }]}>
                {currentUnit
                  ? `Unit.${units.findIndex((ch) => ch.item_id === currentUnit?.item_id) + 1}`
                  : `Episode.${currentEpisodeIndex + 1}`}
              </Text>
              <Text style={[styles.textDefault, { fontWeight: '500' }]} numberOfLines={1}>
                {currentUnit ? currentUnit.title : episode.title}
              </Text>
              {currentUnit && (
                <Text style={styles.bodyTiny} numberOfLines={1}>
                  Ep.{currentEpisodeIndex + 1} {episode.title}
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
            {getSortedEpisodes().map((ep, index) => {
              const isCurrentEpisode = ep.item_id === episode.item_id
              const isExpanded = expandedEpisodes.has(ep.item_id)
              const hasUnits = ep.units && ep.units.length > 0

              return (
                <View key={ep.item_id}>
                  {/* Episode Row */}
                  <TouchableOpacity
                    onPress={() => {
                      if (hasUnits) {
                        toggleEpisodeExpansion(ep.item_id)
                      } else {
                        if (ep.item_id !== episode.item_id) {
                          selectEpisode(ep.item_id)
                        }
                        setShowEpisodeList(false)
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      gap: spacing.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: isCurrentEpisode && !currentUnit ? colors.muted : colors.background,
                    }}
                  >
                    <Image
                      source={{ uri: ep.img }}
                      style={{ width: 56, height: 56, borderRadius: spacing.xs }}
                      resizeMode='cover'
                    />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text
                        style={[
                          styles.textDefault,
                          {
                            fontWeight: '600',
                            marginBottom: 4,
                            color: isCurrentEpisode && !currentUnit ? colors.primary : colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        <Text style={[styles.bodyTiny, { color: colors.textSecondary }]}>Ep.{index + 1}</Text>{' '}
                        {ep.title}
                      </Text>

                      {hasUnits && ep.units && (
                        <Text style={[styles.bodyTiny, { marginBottom: 4 }]}>
                          {ep.units.length} Chapters{' '}
                          <Text style={[styles.bodyTiny, { color: colors.text, fontWeight: '500' }]}>
                            {formatTime(ep.duration)}
                          </Text>
                        </Text>
                      )}

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 20 }}>
                        {!hasUnits && (
                          <Text style={[styles.bodyTiny, { color: colors.text, fontWeight: '600' }]}>
                            {formatTime(ep.duration)}
                          </Text>
                        )}
                        {isCurrentEpisode && !currentUnit && (
                          <Text style={[styles.bodyTiny, { color: colors.primary, fontWeight: '700' }]}>再生中</Text>
                        )}
                        {hasUnits && (
                          <ChevronDown
                            size={16}
                            color={colors.textSecondary}
                            style={{
                              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                              marginLeft: 'auto',
                            }}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Chapters List */}
                  {hasUnits && isExpanded && ep.units && (
                    <View style={{ marginLeft: spacing['5xl'] }}>
                      {ep.units.map((unit, unitIndex) => {
                        const isCurrentUnit = currentUnit?.item_id === unit.item_id

                        return (
                          <TouchableOpacity
                            key={unit.item_id}
                            onPress={() => {
                              selectEpisode(ep.item_id, unit.item_id)
                              setShowEpisodeList(false)
                            }}
                            style={{
                              paddingVertical: spacing.md,
                              paddingRight: spacing.lg,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                              backgroundColor: isCurrentUnit ? colors.muted : colors.background,
                            }}
                          >
                            <Text
                              style={[
                                styles.textDefault,
                                {
                                  fontWeight: '500',
                                  marginBottom: 4,
                                  color: isCurrentUnit ? colors.primary : colors.text,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              <Text style={[styles.bodyTiny, { color: colors.textSecondary }]}>Un.{unitIndex + 1}</Text>{' '}
                              {unit.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                              <Text style={[styles.bodyTiny, { fontWeight: '600' }]}>{formatTime(unit.duration)}</Text>
                              {isCurrentUnit && (
                                <Text style={[styles.bodyTiny, { color: colors.primary, fontWeight: '700' }]}>
                                  再生中
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )}
                </View>
              )
            })}
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
            <Text style={[styles.bodyTiny, { width: 40, textAlign: 'right' }]}>{volume}%</Text>
          </View>
        </View>
      )}
    </View>
  )
}
