import { Sparkles } from 'lucide-react-native'
import { FlatList, Text, View } from 'react-native'

import { EpisodeListItem } from '../../../../components/listitem/EpisodeListItem'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { MediaMenuButton } from '../../../../components/ui/MediaMenuButton'
import { useThemedRefreshControl } from '../../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../../hooks/ThemeContext'
import { useGetNewArrivals } from '../../../../usecases/useGetNewArrivals'

export const NewArrivalsScreen = () => {
  const { styles, colors, spacing } = useTheme()
  const { data: episodes, loading, refetch } = useGetNewArrivals()
  const refreshControl = useThemedRefreshControl(episodes !== null && loading, refetch)
  return (
    <View style={[styles.screenContainer]}>
      <View style={{ height: 0.5, backgroundColor: colors.border }} />
      {loading && episodes === null ? (
        <LoadingSpinner />
      ) : !episodes || episodes.length === 0 ? (
        <EmptyState icon={Sparkles} title='新着エピソードがありません' description='新しいエピソードはまだありません' />
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => `${item.series_id}-${item.item_id}`}
          refreshControl={refreshControl}
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                backgroundColor: colors.card,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={styles.bodyText}>{episodes.length}件のメディア</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EpisodeListItem
              episode={item}
              onPress={() => console.log('Episode pressed:', item.item_id)}
              menuButton={
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
                    url: '',
                    contentMediaType: 0,
                  }}
                />
              }
            />
          )}
        />
      )}
    </View>
  )
}
