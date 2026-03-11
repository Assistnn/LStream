import { Heart } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EpisodeListItem } from '../../../components/listitem/EpisodeListItem'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetFavorites } from '../../../usecases/useGetFavorites'

export const FavoritesTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, typography, borderRadius } = useTheme()
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
                <Text
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  シリーズ ({series?.length ?? 0})
                </Text>
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
                <Text
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  エピソード ({episodes?.length ?? 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ height: 0.5, backgroundColor: colors.border, marginTop: spacing['2xl'] }} />
            {activeTab === 'series' ? (
              <View style={{ padding: spacing.lg }}>
                <Text style={{ color: colors.textSecondary }}>シリーズのお気に入りがここに表示されます</Text>
              </View>
            ) : !episodes || episodes.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <EmptyState
                  icon='💜'
                  title='お気に入りのエピソードがありません'
                  description='エピソードをお気に入りに追加してみましょう'
                />
              </View>
            ) : (
              <FlatList
                data={episodes}
                keyExtractor={(item) => String(item.episode_id)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <EpisodeListItem
                    episode={item}
                    onPress={() => console.log('Episode pressed:', item.episode_id)}
                    menuItems={[
                      { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist:', item.episode_id) },
                      { label: '再生キューに追加', onPress: () => console.log('Add to queue:', item.episode_id) },
                      { label: 'ダウンロード', onPress: () => console.log('Download:', item.episode_id) },
                    ]}
                  />
                )}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
