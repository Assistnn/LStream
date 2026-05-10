import { CheckSquare, Clock, Download, Lock, MoreVertical, Square, Trash2, Unlock } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HistoryListItem } from '../../../components/listitem/HistoryListItem'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useDownload } from '../../../hooks/DownloadContext'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetHistory } from '../../../usecases/useGetHistory'

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 80

const SwipeableDownloadRow = ({
  isLocked,
  onDelete,
  onToggleLock,
  children,
}: {
  isLocked: boolean
  onDelete: () => void
  onToggleLock: () => void
  children: React.ReactNode
}) => {
  const { colors } = useTheme()
  const translateX = useRef(new Animated.Value(0)).current
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start()
        } else if (g.dx > SWIPE_THRESHOLD) {
          Animated.spring(translateX, { toValue: ACTION_WIDTH, useNativeDriver: true }).start()
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
        }
      },
    }),
  ).current

  const resetSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
  }

  return (
    <View style={{ overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          flexDirection: 'row',
        }}
      >
        <TouchableOpacity
          style={{
            width: ACTION_WIDTH,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            onToggleLock()
            resetSwipe()
          }}
        >
          {isLocked ? <Unlock size={24} color='#FFFFFF' /> : <Lock size={24} color='#FFFFFF' />}
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{
            width: ACTION_WIDTH,
            backgroundColor: colors.destructive,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            onDelete()
            resetSwipe()
          }}
        >
          <Trash2 size={24} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{ transform: [{ translateX }], backgroundColor: colors.card }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  )
}

export const HistoryTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const [activeTab, setActiveTab] = useState<'history' | 'download'>('history')
  const { data: history, loading: historyLoading, refetch: refetchHistory } = useGetHistory()
  const { downloads, downloadProgress, deleteDownloads, toggleLock, cancelDownload } = useDownload()
  const {
    navigation: { play },
  } = usePlayer()
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const totalSize = downloads.reduce((sum, d) => sum + d.sizeMB, 0)

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
        refreshControl={
          <ThemedRefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              if (activeTab === 'history') await refetchHistory()
              setRefreshing(false)
            }}
          />
        }
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
            onPress={() => {
              setActiveTab('history')
              setSelectMode(false)
              setSelectedIds(new Set())
            }}
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
        {activeTab === 'history' ? (
          historyLoading || history === null ? (
            <LoadingSpinner />
          ) : !history || history.length === 0 ? (
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
        ) : (
          <View>
            {/* Download header */}
            {selectMode ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <TouchableOpacity onPress={() => setSelectedIds(new Set(downloads.map((d) => d.id)))}>
                  <Text style={[styles.bodySmall, { color: colors.primary }]}>すべて選択</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectMode(false)
                      setSelectedIds(new Set())
                    }}
                  >
                    <Text style={styles.bodySmall}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedIds.size === 0) {
                        showToast('削除するアイテムを選択してください')
                        return
                      }
                      deleteDownloads(Array.from(selectedIds))
                      showToast(`${selectedIds.size}件を削除しました`)
                      setSelectMode(false)
                      setSelectedIds(new Set())
                    }}
                    disabled={selectedIds.size === 0}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      backgroundColor: selectedIds.size > 0 ? colors.destructive : colors.muted,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Text style={[styles.bodySmall, { color: '#FFFFFF' }]}>削除 ({selectedIds.size})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <Text style={styles.bodySmall}>
                  {downloads.length}件 · {totalSize.toFixed(1)}MB
                </Text>
                {downloads.length > 0 && (
                  <TouchableOpacity onPress={() => setShowDeleteMenu(true)}>
                    <MoreVertical size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {downloads.length === 0 && downloadProgress.size === 0 ? (
              <EmptyState
                icon={Download}
                title='ダウンロードがありません'
                description='ダウンロードしたコンテンツがここに表示されます'
              />
            ) : (
              <FlatList
                data={[
                  ...Array.from(downloadProgress.entries()).map(([id, p]) => ({
                    _type: 'progress' as const,
                    id,
                    ...p,
                  })),
                  ...downloads.map((d) => ({ _type: 'done' as const, ...d })),
                ]}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) =>
                  item._type === 'progress' ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={{ width: 64, height: 64, borderRadius: borderRadius.sm }}
                      />
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={[styles.bodyText, { fontWeight: '600' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.bodyTiny} numberOfLines={1}>
                          {item.seriesTitle}
                        </Text>
                        <View
                          style={{
                            height: 4,
                            backgroundColor: colors.muted,
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: 4,
                              width: item.total > 0 ? `${(item.received / item.total) * 100}%` : '0%',
                              backgroundColor: colors.primary,
                              borderRadius: 2,
                            }}
                          />
                        </View>
                        <Text style={styles.bodyTiny}>
                          {item.total > 0 ? `${Math.round((item.received / item.total) * 100)}%` : 'ダウンロード中...'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => cancelDownload(item.id)} style={{ padding: spacing.xs }}>
                        <Text style={[styles.bodyTiny, { color: colors.destructive }]}>中止</Text>
                      </TouchableOpacity>
                    </View>
                  ) : selectMode ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(item.id)) next.delete(item.id)
                          else next.add(item.id)
                          return next
                        })
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        backgroundColor: selectedIds.has(item.id) ? colors.primaryLight + '20' : colors.card,
                      }}
                    >
                      {selectedIds.has(item.id) ? (
                        <CheckSquare size={28} color={colors.primary} />
                      ) : (
                        <Square size={28} color={colors.textTertiary} />
                      )}
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={{ width: 64, height: 64, borderRadius: borderRadius.sm }}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.bodyText, { fontWeight: '600' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.bodyTiny} numberOfLines={1}>
                          {item.seriesTitle}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                          <Text style={styles.bodyTiny}>{item.sizeMB.toFixed(1)}MB</Text>
                          <Text style={styles.bodyTiny}>·</Text>
                          <Text style={styles.bodyTiny}>再生 {item.playCount}回</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <SwipeableDownloadRow
                      isLocked={item.isLocked}
                      onDelete={() => {
                        deleteDownloads([item.id])
                        showToast('1件を削除しました')
                      }}
                      onToggleLock={() => toggleLock(item.id)}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          play(item.seriesId, [
                            {
                              id: item.mediaId,
                              mediaType: item.mediaType,
                              url: item.originalUrl,
                              img: item.thumbnail,
                              title: item.title,
                              duration: item.duration,
                              progress: 0,
                              parentTitle: item.seriesTitle,
                            },
                          ])
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.md,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                        }}
                      >
                        <View style={{ position: 'relative' }}>
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={{ width: 64, height: 64, borderRadius: borderRadius.sm }}
                          />
                          {item.isLocked && (
                            <View
                              style={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                width: 20,
                                height: 20,
                                backgroundColor: colors.primary,
                                borderRadius: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Lock size={12} color='#FFFFFF' />
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[styles.bodyText, { fontWeight: '600' }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.bodyTiny} numberOfLines={1}>
                            {item.seriesTitle}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            <Text style={styles.bodyTiny}>{item.sizeMB.toFixed(1)}MB</Text>
                            <Text style={styles.bodyTiny}>·</Text>
                            <Text style={styles.bodyTiny}>再生 {item.playCount}回</Text>
                          </View>
                        </View>

                        <Download size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </SwipeableDownloadRow>
                  )
                }
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Delete Menu */}
      <Modal visible={showDeleteMenu} transparent animationType='fade' onRequestClose={() => setShowDeleteMenu(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowDeleteMenu(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: spacing.lg,
              gap: spacing.xs,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                const unlockedIds = downloads.filter((d) => !d.isLocked).map((d) => d.id)
                if (unlockedIds.length === 0) {
                  showToast('削除可能なメディアがありません')
                } else {
                  deleteDownloads(unlockedIds)
                  showToast(`${unlockedIds.length}件を削除しました`)
                }
                setShowDeleteMenu(false)
              }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md }}
            >
              <Text style={[styles.bodyText, { fontWeight: '600' }]}>すべてを削除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowDeleteMenu(false)
                setSelectMode(true)
                setSelectedIds(new Set())
              }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md }}
            >
              <Text style={[styles.bodyText, { fontWeight: '600' }]}>選択を削除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowDeleteMenu(false)
                Alert.alert('確認', 'ロックされているものも含め、すべてが削除されますがよろしいですか？', [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: 'OK',
                    style: 'destructive',
                    onPress: () => {
                      deleteDownloads(
                        downloads.map((d) => d.id),
                        true,
                      )
                      showToast('すべてのダウンロードを削除しました')
                    },
                  },
                ])
              }}
              style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md }}
            >
              <Text style={[styles.bodyText, { fontWeight: '600', color: colors.destructive }]}>完全に削除</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteMenu(false)}
              style={{ paddingVertical: spacing.md, alignItems: 'center', borderRadius: borderRadius.md }}
            >
              <Text style={styles.bodySmall}>キャンセル</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <View
          style={{
            position: 'absolute',
            bottom: 80,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: 24,
            }}
          >
            <Text style={[styles.bodySmall, { color: '#FFFFFF' }]}>{toastMessage}</Text>
          </View>
        </View>
      )}
    </View>
  )
}
