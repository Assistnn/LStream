import { MoreVertical } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'
import type { EpisodeSummary } from '../../repositories/api/IApiRepository'
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu'

export const EpisodeListItem = ({
  episode,
  onPress,
  menuItems,
  playCount,
}: {
  episode: EpisodeSummary
  onPress?: () => void
  menuItems?: ContextMenuItem[]
  playCount?: number
}) => {
  const { colors, spacing, styles, borderRadius } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchorY, setMenuAnchorY] = useState<number | undefined>(undefined)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}
      onPress={onPress}
    >
      <Image source={{ uri: episode.img }} style={{ width: 80, height: 80, borderRadius: borderRadius.sm }} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={styles.textBold} numberOfLines={2}>
          {episode.title}
        </Text>
        <Text style={styles.bodySmall} numberOfLines={1}>
          {episode.category}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={styles.bodySmall}>{formatDuration(episode.duration)}</Text>
          {(playCount ?? episode.num_times) > 0 && (
            <>
              <Text style={styles.bodySmall}>•</Text>
              <Text style={styles.bodySmall}>{playCount ?? episode.num_times}回再生</Text>
            </>
          )}
        </View>
      </View>
      {menuItems && menuItems.length > 0 && (
        <TouchableOpacity
          onPress={(e) => {
            const layout = e.nativeEvent
            setMenuAnchorY(layout.pageY)
            setMenuVisible(true)
          }}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      {menuItems && (
        <ContextMenu
          visible={menuVisible}
          items={menuItems}
          onClose={() => setMenuVisible(false)}
          position='right'
          anchorY={menuAnchorY}
        />
      )}
    </TouchableOpacity>
  )
}
