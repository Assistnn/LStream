import { MoreVertical } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'
import type { Episode } from '../../repositories/api/IApiRepository'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'

export const EpisodeListItem = ({
  episode,
  onPress,
  menuItems,
  playCount,
}: {
  episode: Episode
  variant?: 'default'
  onPress?: () => void
  menuItems?: ContextMenuItem[]
  playCount?: number
}) => {
  const { colors, spacing, typography, borderRadius } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchorY, setMenuAnchorY] = useState(0)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours * 60 + minutes}:00`
    }
    return `${minutes}:00`
  }

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          style={{
            marginLeft: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            flex: 1,
          }}
          onPress={onPress}
        >
          <View>
            {episode.img ? (
              <Image
                source={{ uri: episode.img }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: borderRadius.sm,
                }}
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.muted,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ fontSize: typography.fontSize['2xl'] }}>
                  {episode.type_media === 1 ? '🎬' : '🎵'}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, justifyContent: 'center', minWidth: 0, gap: spacing.xs }}>
            <Text
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text,
                marginBottom: spacing.xxs,
              }}
              numberOfLines={1}
            >
              {episode.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text,
                }}
                numberOfLines={1}
              >
                {formatDuration(episode.duration)}
              </Text>
              {playCount !== undefined && (
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.accent,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                  numberOfLines={1}
                >
                  {playCount >= 10000
                    ? `${(playCount / 10000).toFixed(1)}万回再生`
                    : `${playCount.toLocaleString()}回再生`}
                </Text>
              )}
              <Text
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.textSecondary,
                }}
                numberOfLines={1}
              >
                {episode.type_media === 1 ? '動画' : '音声'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: spacing.md,
          }}
          onPress={(e) => {
            e.currentTarget.measure((_x, _y, _width, height, _pageX, pageY) => {
              setMenuAnchorY(pageY + height)
              setMenuVisible(true)
            })
          }}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {menuItems && (
        <ContextMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={menuItems}
          position='right'
          anchorY={menuAnchorY}
        />
      )}
    </>
  )
}
