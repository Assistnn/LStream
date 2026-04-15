import { Clock, Pencil, Pin, Trash2 } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native'

import type { Playlist } from '../../../../hooks/PlaylistContext'
import { usePlaylist } from '../../../../hooks/PlaylistContext'
import { useTheme } from '../../../../hooks/ThemeContext'
import { formatAlarmTime, formatTotalDuration, getTotalDuration } from '../utils'
import { PlaylistCover } from './PlaylistCover'

const SWIPE_LEFT_OPEN = -160
const SWIPE_RIGHT_OPEN = 80
const THRESHOLD = 40

export const PlaylistRow = ({
  playlist,
  onPress,
  onEdit,
  onDelete,
}: {
  playlist: Playlist
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const { togglePin, activeSwipeRowId, setActiveSwipeRowId } = usePlaylist()
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
    if (activeSwipeRowId !== playlist.id && currentXRef.current !== 0) {
      snapTo(0)
    }
  }, [activeSwipeRowId, playlist.id])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 2 && Math.abs(g.dx) > 6,
      onPanResponderGrant: () => {
        setActiveSwipeRowId(playlist.id)
      },
      onPanResponderMove: (_, g) => {
        const base = currentXRef.current
        const next = Math.max(SWIPE_LEFT_OPEN, Math.min(SWIPE_RIGHT_OPEN, base + g.dx))
        translateX.setValue(next)
      },
      onPanResponderRelease: (_, g) => {
        const end = currentXRef.current
        if (end < -THRESHOLD && g.dx < 0) {
          snapTo(SWIPE_LEFT_OPEN)
        } else if (end > THRESHOLD && g.dx > 0) {
          snapTo(SWIPE_RIGHT_OPEN)
        } else {
          snapTo(0)
          setActiveSwipeRowId(null)
        }
      },
      onPanResponderTerminate: () => snapTo(0),
    }),
  ).current

  const total = getTotalDuration(playlist)

  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      {/* Right-side swipe (pin) background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: SWIPE_RIGHT_OPEN,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            togglePin(playlist.id)
            snapTo(0)
            setActiveSwipeRowId(null)
          }}
          style={{ alignItems: 'center', gap: 2 }}
        >
          <Pin size={20} color='#FFFFFF' fill={playlist.isPinned ? '#FFFFFF' : 'transparent'} />
          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>{playlist.isPinned ? '解除' : 'ピン'}</Text>
        </TouchableOpacity>
      </View>

      {/* Left-side swipe (edit / delete) background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: -SWIPE_LEFT_OPEN,
          flexDirection: 'row',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onEdit()
            snapTo(0)
            setActiveSwipeRowId(null)
          }}
          style={{
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            gap: 2,
          }}
        >
          <Pencil size={20} color='#FFFFFF' />
          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            onDelete()
            snapTo(0)
            setActiveSwipeRowId(null)
          }}
          style={{
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.destructive,
            gap: 2,
          }}
        >
          <Trash2 size={20} color='#FFFFFF' />
          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>削除</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground row */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }], backgroundColor: colors.card }}
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
            gap: spacing.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        >
          <View>
            <PlaylistCover
              gradient={playlist.gradient}
              coverImage={playlist.coverImage}
              size={64}
              borderRadius={borderRadius.lg}
            />
            {playlist.isPinned && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 22,
                  height: 22,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pin size={12} color='#FFFFFF' fill='#FFFFFF' />
              </View>
            )}
          </View>

          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.textBold} numberOfLines={1}>
              {playlist.name}
            </Text>
            {playlist.description.length > 0 && (
              <Text style={styles.bodySmall} numberOfLines={1}>
                {playlist.description}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Text style={styles.bodyTiny}>{playlist.items.length}メディア</Text>
              <Text style={styles.bodyTiny}>{formatTotalDuration(total)}</Text>
              {playlist.alarm?.enabled && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} color={colors.textSecondary} />
                  <Text style={styles.bodyTiny}>{formatAlarmTime(playlist.alarm)}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}
