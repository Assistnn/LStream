import { Heart } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetFavorites } from '../../../usecases/useGetFavorites'
import { FavoriteEpisodeListItem } from './components/FavoriteEpisodeListItem'
import { FavoriteSeriesListItem } from './components/FavoriteSeriesListItem'

export const FavoritesTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const [activeTab, setActiveTab] = useState<'series' | 'episode'>('series')
  const { series, episodes, loading, refetch } = useGetFavorites()
  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <ThemedRefreshControl refreshing={series !== null && episodes !== null && loading} onRefresh={refetch} />
        }
      >
        <PageTitle icon={Heart} title='お気に入り' />
        {loading && series === null && episodes === null ? (
          <LoadingSpinner />
        ) : (
          <View>
            {/* Tab Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                marginHorizontal: spacing.lg,
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.xs,
                backgroundColor: colors.card,
                borderRadius: borderRadius.md,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  backgroundColor: activeTab === 'series' ? colors.muted : 'transparent',
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                }}
                onPress={() => setActiveTab('series')}
              >
                <Text style={styles.textBold}>シリーズ ({series?.length ?? 0})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  backgroundColor: activeTab === 'episode' ? colors.muted : 'transparent',
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                }}
                onPress={() => setActiveTab('episode')}
              >
                <Text style={styles.textBold}>エピソード ({episodes?.length ?? 0})</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'series' ? (
              !series || series.length === 0 ? (
                <View style={{ padding: spacing.lg, marginTop: spacing.xl }}>
                  <EmptyState
                    icon={Heart}
                    title='お気に入りのシリーズがありません'
                    description='シリーズをお気に入りに追加してみましょう'
                  />
                </View>
              ) : (
                <FlatList
                  style={{ marginTop: spacing.xl }}
                  data={series}
                  keyExtractor={(item) => item.series_id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <FavoriteSeriesListItem
                      item={item}
                      onPress={() => console.log('Series pressed:', item.series_id)}
                    />
                  )}
                />
              )
            ) : !episodes || episodes.length === 0 ? (
              <View style={{ padding: spacing.lg, marginTop: spacing.xl }}>
                <EmptyState
                  icon={Heart}
                  title='お気に入りのエピソードがありません'
                  description='エピソードをお気に入りに追加してみましょう'
                />
              </View>
            ) : (
              <FlatList
                style={{ marginTop: spacing.xl }}
                data={episodes}
                keyExtractor={(item) => `${item.series_id}-${item.item_id}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <FavoriteEpisodeListItem item={item} onPress={() => console.log('Episode pressed:', item.item_id)} />
                )}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
