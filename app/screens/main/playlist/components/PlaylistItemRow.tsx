import { GripVertical, MoreVertical, Trash2 } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Animated, Image, PanResponder, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../../../hooks/ThemeContext'
import type { PlaylistItem } from '../../../../repositories/playlist'
import { formatDuration } from '../utils'
import { AudioIndicator } from './AudioIndicator'

const SWIPE_OPEN = -96
const THRESHOLD = 40

export const ITEM_HEIGHT = 72

export const PlaylistItemRow = ({
  item,
  index,
  onPress,
  onMenuPress,
  isPlaying,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRemove,
  activeSwipeRowId,
  setActiveSwipeRowId,
}: {
  item: PlaylistItem
  playlistId: string
  index: number
  onPress: () => void
  onMenuPress: () => void
  isPlaying: boolean
  isDragging: boolean
  onDragStart: (index: number) => void
  onDragMove: (dy: number) => void
  onDragEnd: () => void
  onRemove: () => void
  activeSwipeRowId: string | null
  setActiveSwipeRowId: (id: string | null) => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const translateX = useRef(new Animated.Value(0)).current
  const currentXRef = useRef(0)

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      currentXRef.current = value
    })
    return () => translateX.removeListener(id)
  }, [translateX])

  const snapTo = (value: number) => {
    Animated.spring(translateX, { toValue: value, useNativeDriver: true, bounciness: 0 }).start()
  }

  useEffect(() => {
    if (activeSwipeRowId !== item.id && currentXRef.current !== 0) {
      snapTo(0)
    }
  }, [activeSwipeRowId, item.id])

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 2 && Math.abs(g.dx) > 6,
      onPanResponderGrant: () => setActiveSwipeRowId(item.id),
      onPanResponderMove: (_, g) => {
        const base = currentXRef.current
        const next = Math.max(SWIPE_OPEN, Math.min(0, base + g.dx))
        translateX.setValue(next)
      },
      onPanResponderRelease: () => {
        const end = currentXRef.current
        if (end < THRESHOLD * -1) {
          snapTo(SWIPE_OPEN)
        } else {
          snapTo(0)
          setActiveSwipeRowId(null)
        }
      },
      onPanResponderTerminate: () => snapTo(0),
    }),
  ).current

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => onDragStart(index),
      onPanResponderMove: (_, g) => onDragMove(g.dy),
      onPanResponderRelease: () => onDragEnd(),
      onPanResponderTerminate: () => onDragEnd(),
    }),
  ).current

  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: ITEM_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: isDragging ? 0 : 1,
      }}
    >
      {/* Delete background (revealed on left-swipe) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: -SWIPE_OPEN,
          backgroundColor: colors.destructive,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onRemove()
            setActiveSwipeRowId(null)
          }}
          style={{ alignItems: 'center', gap: 2 }}
        >
          <Trash2 size={20} color='#FFFFFF' />
          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>削除</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...swipeResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          backgroundColor: isPlaying ? colors.secondary : colors.card,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (currentXRef.current !== 0) {
              snapTo(0)
              setActiveSwipeRowId(null)
              return
            }
            onPress()
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 8,
            paddingHorizontal: '5%',
            height: ITEM_HEIGHT,
          }}
        >
          <View {...dragResponder.panHandlers}>
            <GripVertical size={20} color={colors.textTertiary} />
          </View>

          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: 56, height: 56, borderRadius: borderRadius.md, backgroundColor: colors.muted }}
            />
            {isPlaying ? (
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  borderRadius: borderRadius.md,
                }}
              >
                <AudioIndicator color='#FFFFFF' />
              </View>
            ) : null}
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.textBold} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.bodySmall} numberOfLines={1}>
              {item.seriesTitle}
            </Text>
            <Text style={styles.bodyTiny}>{formatDuration(item.duration)}</Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              onMenuPress()
            }}
            style={{ padding: spacing.xs }}
          >
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}
