import { Image, Text, TouchableOpacity, View } from 'react-native'

import { FavoriteButton } from '../../../../components/ui/FavoriteButton'
import { MediaMenuButton } from '../../../../components/ui/MediaMenuButton'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { LibraryItem } from '../../../../repositories/api/IApiRepository'

export const LibraryCard = ({ item, onPress }: { item: LibraryItem; onPress?: () => void }) => {
  const { styles, colors, spacing, borderRadius } = useTheme()
  const isSingleEpisode = item.num_total === 1

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        flexDirection: 'column',
        gap: spacing.xs,
      }}
      onPress={onPress}
    >
      <View
        style={{
          position: 'relative',
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          width: '100%',
          aspectRatio: 1,
        }}
      >
        <Image source={{ uri: item.img }} style={{ width: '100%', height: '100%' }} />
        <FavoriteButton
          seriesId={item.series_id}
          itemId={0}
          size={24}
          buttonStyle={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.sm,
          }}
        />
        {!isSingleEpisode && (
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.sm,
              borderRadius: borderRadius.sm,
            }}
          >
            <Text style={[styles.bodySmall, { color: '#FFFFFF', padding: spacing.xxs }]}>{item.num_total}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.titleLarge, { height: 40 }]} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={{ height: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {item.num_times > 0 && (
          <Text style={[styles.bodySmall, { color: colors.accent }]}>{item.num_times.toLocaleString()}回再生</Text>
        )}
        {!isSingleEpisode && (
          <MediaMenuButton
            seriesId={item.series_id}
            mediaId={item.series_id}
            mediaType='series'
            size={16}
            buttonStyle={{ padding: spacing['2xs'] }}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}
