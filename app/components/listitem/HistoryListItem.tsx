import { Play } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import { ApiRepository } from '../../repositories/api/ApiRepository'
import type { PlaybackHistoryItem } from '../../repositories/api/IApiRepository'
import { seriesMediaToTrack } from '../../screens/main/playlist/utils'

const apiRepository = new ApiRepository()

export const HistoryListItem = ({ item, isTop }: { item: PlaybackHistoryItem; isTop: boolean }) => {
  const { colors, spacing, styles, borderRadius } = useTheme()
  const {
    navigation: { play },
  } = usePlayer()

  const playedDate = new Date(item.date)
  const dateStr = `${playedDate.getMonth() + 1}/${playedDate.getDate()}`

  const handlePlay = async () => {
    try {
      const seriesData = await apiRepository.getSeries(item.series_id)
      const tracks =
        seriesData.episodes.length > 0
          ? seriesData.episodes.map(seriesMediaToTrack)
          : [
              {
                id: seriesData.series_id,
                mediaType: seriesData.type_media,
                url: seriesData.url,
                img: seriesData.img,
                title: seriesData.title,
                duration: seriesData.duration,
                progress: seriesData.progress,
                parentTitle: '',
                chapters: seriesData.chapters,
              },
            ]
      play(seriesData.series_id, tracks, item.item_id)
    } catch (error) {
      console.error('Failed to play from history:', error)
    }
  }

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderTopWidth: isTop ? 1 : 0,
        borderTopColor: colors.border,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}
      onPress={handlePlay}
    >
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.img }} style={{ width: 64, height: 64, borderRadius: borderRadius.md }} />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={20} color='#FFFFFF' fill='#FFFFFF' />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.titleLarge, { marginBottom: spacing.xs }]} numberOfLines={1}>
          {item.title_series}
        </Text>
        <Text style={[styles.bodyText, { marginBottom: spacing.xs }]} numberOfLines={1}>
          {item.title_media} • {dateStr}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1, height: 4, backgroundColor: colors.muted, borderRadius: borderRadius.full }}>
            <View
              style={[
                {
                  height: 4,
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.full,
                },
                { width: `${item.progress}%` },
              ]}
            />
          </View>
          <Text style={styles.bodySmall}>{Math.round(item.progress)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
