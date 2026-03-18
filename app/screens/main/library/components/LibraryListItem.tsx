import { Download, Heart } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { MediaMenuButton } from '../../../../components/ui/MediaMenuButton'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { LibraryItem } from '../../../../repositories/api/IApiRepository'

export const LibraryListItem = ({ item, onPress }: { item: LibraryItem; onPress?: () => void }) => {
  const { styles, colors, spacing, borderRadius } = useTheme()
  const isSingleEpisode = item.num_total === 1

  const progressPercent = (item.num_comp / item.num_total) * 100

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      onPress={onPress}
    >
      {/* Thumbnail with badge */}
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.img }} style={{ width: 80, height: 80, borderRadius: borderRadius.sm }} />
        {!isSingleEpisode && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: borderRadius.full,
            }}
          >
            <Text style={[styles.bodySmall, { color: '#FFFFFF', fontSize: 11 }]}>{item.num_total}</Text>
          </View>
        )}
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
          {!isSingleEpisode && (
            <>
              <Text style={[styles.bodySmall]}>•</Text>
              <Text style={[styles.bodySmall]}>{item.num_total}メディア</Text>
            </>
          )}
          <Text style={[styles.bodySmall]}>•</Text>
          <Download size={14} color={colors.primary} />
        </View>

        {/* Progress bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {!isSingleEpisode && (
            <>
              <View
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: colors.muted,
                  borderRadius: borderRadius.full,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text style={[styles.bodySmall]}>{Math.round(progressPercent)}%</Text>
            </>
          )}

          {/* Play count */}
          {item.num_times > 0 && (
            <Text
              style={[
                styles.bodyTiny,
                {
                  backgroundColor: isSingleEpisode ? 'transparent' : colors.accentBackground,
                  color: colors.accent,
                  paddingHorizontal: isSingleEpisode ? 0 : spacing.sm,
                  paddingVertical: isSingleEpisode ? 0 : spacing.sm,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              {item.num_times.toLocaleString()}回再生
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={{ alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
        <TouchableOpacity style={{ padding: spacing.xs }}>
          <Heart size={24} color={colors.text} fill={item.is_favorite ? colors.text : 'transparent'} />
        </TouchableOpacity>
        <MediaMenuButton mediaId={item.series_id} mediaType='series' size={20} />
      </View>
    </TouchableOpacity>
  )
}
