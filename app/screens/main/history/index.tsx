import { Clock, Download } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EpisodeListItem } from '../../../components/listitem/EpisodeListItem'
import { HistoryListItem } from '../../../components/listitem/HistoryListItem'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { refetchFavorites, useGetFavorites } from '../../../usecases/useGetFavorites'
import { useGetHistory } from '../../../usecases/useGetHistory'

export const HistoryTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const [activeTab, setActiveTab] = useState<'history' | 'download'>('history')
  const { data: history, loading: historyLoading, refetch: refetchHistory } = useGetHistory()
  const favorites = useGetFavorites()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefetch = async () => {
    setRefreshing(true)
    if (activeTab === 'history') {
      await refetchHistory()
    } else {
      await refetchFavorites()
    }
    setRefreshing(false)
  }

  const groupHistoryByDate = (items: NonNullable<typeof history>) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    return items.reduce(
      (acc, item) => {
        const playedDate = new Date(item.date)
        playedDate.setHours(0, 0, 0, 0)

        let label: string
        if (playedDate.getTime() === today.getTime()) {
          label = '今日'
        } else if (playedDate.getTime() === yesterday.getTime()) {
          label = '昨日'
        } else {
          label = `${playedDate.getMonth() + 1}/${playedDate.getDate()}`
        }

        if (!acc[label]) {
          acc[label] = []
        }
        acc[label].push(item)
        return acc
      },
      {} as Record<string, typeof items>,
    )
  }
  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={<ThemedRefreshControl refreshing={refreshing} onRefresh={handleRefetch} />}
      >
        <PageTitle icon={Clock} title='履歴' />
        {/* Tab Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginHorizontal: spacing.lg,
            paddingHorizontal: spacing.xs,
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              backgroundColor: activeTab === 'history' ? colors.muted : 'transparent',
              borderRadius: borderRadius.md,
              alignItems: 'center',
            }}
            onPress={() => setActiveTab('history')}
          >
            <Text style={styles.textBold}>再生履歴</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              backgroundColor: activeTab === 'download' ? colors.muted : 'transparent',
              borderRadius: borderRadius.md,
              alignItems: 'center',
            }}
            onPress={() => setActiveTab('download')}
          >
            <Text style={styles.textBold}>ダウンロード</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {(activeTab === 'history' && (historyLoading || history === null)) ||
        (activeTab === 'download' && !favorites) ? (
          <LoadingSpinner />
        ) : activeTab === 'history' ? (
          !history || history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title='再生履歴がありません'
              description='コンテンツを再生すると履歴が表示されます'
            />
          ) : (
            <View>
              {Object.entries(groupHistoryByDate(history)).map(([dateLabel, items]) => (
                <View key={dateLabel}>
                  <View
                    style={{
                      marginTop: spacing.sm,
                      paddingVertical: spacing.lg,
                      paddingHorizontal: spacing.xl,
                    }}
                  >
                    <Text style={styles.textXl}>{dateLabel}</Text>
                  </View>
                  {items.map((historyItem, index) => (
                    <HistoryListItem
                      key={`${historyItem.series_id}-${historyItem.item_id}-${historyItem.date}`}
                      item={historyItem}
                      isTop={index === 0}
                    />
                  ))}
                </View>
              ))}
            </View>
          )
        ) : !favorites || !favorites.episodes || favorites.episodes.length === 0 ? (
          <EmptyState
            icon={Download}
            title='ダウンロードしたエピソードがありません'
            description='エピソードをダウンロードしてみましょう'
          />
        ) : (
          <FlatList
            data={favorites.episodes}
            keyExtractor={(item) => `${item.series_id}-${item.item_id}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <EpisodeListItem
                episode={item}
                onPress={() => console.log('Episode pressed:', item.item_id)}
                menuItems={[
                  { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist:', item.item_id) },
                  { label: '再生キューに追加', onPress: () => console.log('Add to queue:', item.item_id) },
                  { label: 'ダウンロード', onPress: () => console.log('Download:', item.item_id) },
                ]}
              />
            )}
          />
        )}
      </ScrollView>
    </View>
  )
}
