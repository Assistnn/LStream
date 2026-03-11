import { FlatList, Text, View } from 'react-native'

// import { EpisodeListItem } from '../../../../components/listitem/EpisodeListItem'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { ThemedRefreshControl } from '../../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../../hooks/ThemeContext'
import { useGetNewArrivals } from '../../../../usecases/useGetNewArrivals'

export const NewArrivalsScreen = () => {
  const { styles, colors, spacing, typography } = useTheme()
  const { data: episodes, loading, refetch } = useGetNewArrivals()
  return (
    <View style={[styles.screenContainer]}>
      <View style={{ height: 0.5, backgroundColor: colors.border }} />
      {loading && episodes === null ? (
        <LoadingSpinner />
      ) : !episodes || episodes.length === 0 ? (
        <EmptyState icon='📭' title='新着エピソードがありません' description='新しいエピソードはまだありません' />
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.episode_id.toString()}
          refreshControl={<ThemedRefreshControl refreshing={episodes !== null && loading} onRefresh={refetch} />}
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
              <Text style={{ fontSize: typography.fontSize.base, color: colors.textSecondary }}>
                {episodes.length}件のメディア
              </Text>
            </View>
          }
          renderItem={() => null}
          // renderItem={({ item }) => (
          //   <EpisodeListItem
          //     variant='default'
          //     episode={item}
          //     onPress={() => console.log('Episode pressed:', item.id)}
          //     menuItems={[
          //       { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist:', item.id) },
          //       { label: '再生キューに追加', onPress: () => console.log('Add to queue:', item.id) },
          //       { label: 'ダウンロード', onPress: () => console.log('Download:', item.id) },
          //     ]}
          //   />
          // )}
        />
      )}
    </View>
  )
}
