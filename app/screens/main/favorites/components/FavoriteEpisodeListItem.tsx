import { Download } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { MediaMenuButton } from '../../../../components/ui/MediaMenuButton'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { EpisodeSummary } from '../../../../repositories/api/IApiRepository'

export const FavoriteEpisodeListItem = ({ item, onPress }: { item: EpisodeSummary; onPress?: () => void }) => {
  const { styles, colors, spacing, borderRadius } = useTheme()

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
      onPress={onPress}
    >
      {/* Thumbnail */}
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.img }} style={{ width: 80, height: 80, borderRadius: borderRadius.sm }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.sm }}>
        {/* Title */}
        <Text style={[styles.titleLarge]} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Meta info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[styles.bodySmall]}>{item.category}</Text>
          <Text style={[styles.bodySmall]}>•</Text>
          <Text style={[styles.bodySmall]}>{formatDuration(item.duration)}</Text>
          <Text style={[styles.bodySmall]}>•</Text>
          <Download size={14} color={colors.primary} />
        </View>

        {/* Play count */}
        {item.num_times > 0 && (
          <Text
            style={[
              styles.bodyTiny,
              {
                color: colors.accent,
              },
            ]}
          >
            {item.num_times.toLocaleString()}回再生
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
        <MediaMenuButton
          seriesId={item.series_id}
          mediaId={item.item_id}
          mediaType='episode'
          size={20}
          mediaInfo={{
            title: item.title,
            seriesTitle: item.category,
            thumbnail: item.img,
            duration: item.duration,
          }}
        />
      </View>
    </TouchableOpacity>
  )
}
