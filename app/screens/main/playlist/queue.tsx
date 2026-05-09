import { useNavigation } from '@react-navigation/native'
import { ChevronLeft, ListMusic, Pause, Play } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '../../../components/ui/EmptyState'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'
import { QUEUE_ITEM_HEIGHT, QueueItemRow } from './components/QueueItemRow'
import { formatTotalDuration, toPlayableTrack } from './utils'

export const QueueScreen = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const {
    queue,
    autoPlayNext,
    currentContent,
    state,
    controls,
    navigation: playerNav,
    queueActions,
    playingPlaylistId,
  } = usePlayer()

  const isPlayingQueue = playingPlaylistId === '__queue__'
  const isActuallyPlaying = isPlayingQueue && state.playbackState === 'playing'
  const isLoading = isPlayingQueue && state.playbackState === 'loading'
  const [activeSwipeRowId, setActiveSwipeRowId] = useState<string | null>(null)

  // Drag-and-drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const dragStartIndexRef = useRef<number>(-1)
  const dragTranslate = useRef(new Animated.Value(0)).current

  const handleDragStart = (index: number) => {
    dragStartIndexRef.current = index
    dragTranslate.setValue(0)
    setDraggingIndex(index)
    setTargetIndex(index)
  }

  const handleDragMove = (dy: number) => {
    dragTranslate.setValue(dy)
    if (dragStartIndexRef.current < 0) return
    const offset = Math.round(dy / QUEUE_ITEM_HEIGHT)
    const raw = dragStartIndexRef.current + offset
    const clamped = Math.max(0, Math.min(queue.length - 1, raw))
    setTargetIndex(clamped)
  }

  const handleDragEnd = () => {
    if (dragStartIndexRef.current >= 0 && targetIndex !== null && targetIndex !== dragStartIndexRef.current) {
      queueActions.reorderQueue(dragStartIndexRef.current, targetIndex)
    }
    setDraggingIndex(null)
    setTargetIndex(null)
    dragStartIndexRef.current = -1
    dragTranslate.setValue(0)
  }

  const total = useMemo(() => queue.reduce((s, i) => s + i.duration, 0), [queue])

  const displayItems = (() => {
    if (draggingIndex === null || targetIndex === null) return queue.map((item, idx) => ({ item, idx }))
    const arr = queue.slice()
    const [moved] = arr.splice(draggingIndex, 1)
    arr.splice(targetIndex, 0, moved)
    return arr.map((item) => ({ item, idx: queue.findIndex((q) => q.id === item.id) }))
  })()

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView scrollEnabled={draggingIndex === null} contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.text3xl}>再生キュー</Text>
              <Text style={styles.bodySmall}>
                {queue.length}件のメディア ・ 合計 {formatTotalDuration(total)}
              </Text>
            </View>
          </View>

          {queue.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                if (!isPlayingQueue) {
                  playerNav.playFromList(queue.map(toPlayableTrack), queue[0].trackId, queue[0].childId, {
                    playlistId: '__queue__',
                  })
                } else if (isActuallyPlaying) {
                  controls.pause()
                } else {
                  controls.resume()
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                backgroundColor: isActuallyPlaying ? colors.text : colors.foreground,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size={14} color={colors.background} />
              ) : isActuallyPlaying ? (
                <Pause size={14} color={colors.background} fill={colors.background} />
              ) : (
                <Play size={14} color={colors.background} fill={colors.background} />
              )}
              <Text style={[styles.textBold, { color: colors.background }]}>
                {isActuallyPlaying ? '停止' : isLoading ? '読み込み中' : 'すべて再生'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-play toggle */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            padding: spacing.lg,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.textBold}>連続再生</Text>
            <Text style={styles.bodySmall}>次のコンテンツを自動で再生</Text>
          </View>
          <Switch
            value={autoPlayNext}
            onValueChange={queueActions.setAutoPlayNext}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        </View>

        {/* Queue list */}
        <View style={{ marginTop: spacing.xl, position: 'relative' }}>
          {queue.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title='再生キューが空です'
              description='「プレイリスト」や各メディアから追加できます'
            />
          ) : (
            <>
              {displayItems.map(({ item, idx }) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  isPlaying={
                    playingPlaylistId === '__queue__' &&
                    currentContent?.episodeId === item.trackId &&
                    currentContent.unitId === item.childId
                  }
                  isDragging={draggingIndex === idx}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onRemove={() => {
                    const isCurrentlyPlaying =
                      isPlayingQueue &&
                      currentContent?.episodeId === item.trackId &&
                      currentContent.unitId === item.childId
                    queueActions.removeFromQueue(item.id)
                    if (isCurrentlyPlaying && currentContent?.hasNextTrack) {
                      playerNav.nextTrack()
                    }
                  }}
                  activeSwipeRowId={activeSwipeRowId}
                  setActiveSwipeRowId={setActiveSwipeRowId}
                />
              ))}

              {draggingIndex !== null && (
                <Animated.View
                  pointerEvents='none'
                  style={{
                    position: 'absolute',
                    top: draggingIndex * QUEUE_ITEM_HEIGHT,
                    left: 0,
                    right: 0,
                    height: QUEUE_ITEM_HEIGHT,
                    transform: [{ translateY: dragTranslate }],
                    backgroundColor: colors.card,
                    borderRadius: borderRadius.lg,
                    opacity: 0.9,
                    elevation: 6,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  }}
                >
                  <QueueItemRow
                    key='ghost'
                    item={queue[draggingIndex]}
                    index={draggingIndex}
                    isPlaying={false}
                    isDragging={false}
                    onDragStart={() => {}}
                    onDragMove={() => {}}
                    onDragEnd={() => {}}
                    onRemove={() => {}}
                    activeSwipeRowId={null}
                    setActiveSwipeRowId={() => {}}
                  />
                </Animated.View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
