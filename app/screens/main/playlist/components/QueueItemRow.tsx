import { GripVertical, Trash2 } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Animated, Image, PanResponder, Text, TouchableOpacity, View } from 'react-native'

import type { PlaylistItem } from '../../../../hooks/PlaylistContext'
import { usePlaylist } from '../../../../hooks/PlaylistContext'
import { useTheme } from '../../../../hooks/ThemeContext'
import { formatDuration } from '../utils'

const SWIPE_OPEN = 96
const THRESHOLD = 40

export const QueueItemRow = ({
  item,
  index,
  onPress,
  isPlaying,
}: {
  item: PlaylistItem
  index: number
  onPress: () => void
  isPlaying: boolean
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const { removeFromQueue, activeSwipeRowId, setActiveSwipeRowId } = usePlaylist()
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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 2 && Math.abs(g.dx) > 6,
      onPanResponderGrant: () => {
        setActiveSwipeRowId(item.id)
      },
      onPanResponderMove: (_, g) => {
        const base = currentXRef.current
        const next = Math.max(0, Math.min(SWIPE_OPEN, base + g.dx))
        translateX.setValue(next)
      },
      onPanResponderRelease: () => {
        const end = currentXRef.current
        if (end > THRESHOLD) {
          snapTo(SWIPE_OPEN)
        } else {
          snapTo(0)
          setActiveSwipeRowId(null)
        }
      },
      onPanResponderTerminate: () => snapTo(0),
    }),
  ).current

  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Delete background (shown on right-swipe) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: SWIPE_OPEN,
          backgroundColor: colors.destructive,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            removeFromQueue(item.id)
            setActiveSwipeRowId(null)
          }}
          style={{ alignItems: 'center', gap: 2 }}
        >
          <Trash2 size={20} color='#FFFFFF' />
          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>削除</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground row */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }], backgroundColor: isPlaying ? colors.secondary : colors.card }}
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
            gap: spacing.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          <GripVertical size={18} color={colors.textTertiary} />
          <Text style={[styles.bodySmall, { width: 20, textAlign: 'center' }]}>{index + 1}</Text>
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: 56, height: 56, borderRadius: borderRadius.md, backgroundColor: colors.muted }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.textBold} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.bodySmall} numberOfLines={1}>
              {item.seriesTitle}
            </Text>
            <Text style={styles.bodyTiny}>{formatDuration(item.duration)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}
