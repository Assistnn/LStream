import { CheckSquare, Download, Lock, MoreVertical, Square, Trash2, Unlock } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import { Animated, Image, Modal, PanResponder, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useDownload } from '../../../hooks/DownloadContext'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'

const SWIPE_THRESHOLD = 80
const ACTION_WIDTH = 80

const SwipeableRow = ({
  isLocked,
  selectMode,
  onToggleSelect,
  onDelete,
  onToggleLock,
  onPress,
  children,
}: {
  isLocked: boolean
  selectMode: boolean
  onToggleSelect: () => void
  onDelete: () => void
  onToggleLock: () => void
  onPress: () => void
  children: React.ReactNode
}) => {
  const { colors } = useTheme()
  const translateX = useRef(new Animated.Value(0)).current
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !selectMode && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (selectMode) {
              onToggleSelect()
            } else {
              onPress()
            }
          }}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export const DownloadScreen = ({ navigation }: { navigation: { goBack: () => void } }) => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const { downloads, deleteDownloads, toggleLock } = useDownload()
  const {
    navigation: { play },
  } = usePlayer()
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const totalSize = downloads.reduce((sum, d) => sum + d.sizeMB, 0)

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const handleDeleteAll = () => {
    const unlockedIds = downloads.filter((d) => !d.isLocked).map((d) => d.id)
    if (unlockedIds.length === 0) {
      showToast('削除可能なメディアがありません')
      return
    }
    deleteDownloads(unlockedIds)
    showToast(`${unlockedIds.length}件を削除しました`)
    setShowDeleteMenu(false)
  }

  const handleSelectDelete = () => {
    if (selectedIds.size === 0) {
      showToast('削除するアイテムを選択してください')
      return
    }
    deleteDownloads(Array.from(selectedIds))
    showToast(`${selectedIds.size}件を削除しました`)
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handlePlay = (item: (typeof downloads)[0]) => {
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
  }

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          height: 56,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.navBar,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
          <TouchableOpacity
            onPress={() => {
              if (selectMode) {
                setSelectMode(false)
                setSelectedIds(new Set())
              } else {
                navigation.goBack()
              }
            }}
            style={{ padding: spacing.xs }}
          >
            <Text style={[styles.bodyText, { color: colors.primary }]}>{selectMode ? 'キャンセル' : '← 戻る'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titleMedium, { marginBottom: 0 }]}>{selectMode ? '選択を削除' : 'ダウンロード'}</Text>
            <Text style={styles.bodyTiny}>
              {downloads.length}件 · {totalSize.toFixed(1)}MB
            </Text>
          </View>
        </View>

        {selectMode ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setSelectedIds(new Set(downloads.map((d) => d.id)))}
              style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
            >
              <Text style={[styles.bodySmall, { color: colors.primary }]}>すべて選択</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSelectDelete}
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
        ) : (
          downloads.length > 0 && (
            <TouchableOpacity onPress={() => setShowDeleteMenu(true)} style={{ padding: spacing.xs }}>
              <MoreVertical size={24} color={colors.text} />
            </TouchableOpacity>
          )
        )}
      </View>

      {downloads.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.muted,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Download size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.titleMedium}>ダウンロードがありません</Text>
          <Text style={[styles.bodySmall, { textAlign: 'center' }]}>
            ダウンロードしたコンテンツがここに表示されます
          </Text>
        </View>
      ) : (
        <ScrollView>
          {downloads.map((item) => (
            <SwipeableRow
              key={item.id}
              isLocked={item.isLocked}
              selectMode={selectMode}
              onToggleSelect={() => {
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(item.id)) next.delete(item.id)
                  else next.add(item.id)
                  return next
                })
              }}
              onDelete={() => {
                deleteDownloads([item.id])
                showToast('1件を削除しました')
              }}
              onToggleLock={() => toggleLock(item.id)}
              onPress={() => handlePlay(item)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: selectMode && selectedIds.has(item.id) ? colors.primaryLight + '20' : colors.card,
                }}
              >
                {selectMode && (
                  <View>
                    {selectedIds.has(item.id) ? (
                      <CheckSquare size={28} color={colors.primary} />
                    ) : (
                      <Square size={28} color={colors.textTertiary} />
                    )}
                  </View>
                )}

                {item.isLocked && !selectMode && <Lock size={16} color={colors.textSecondary} />}

                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: borderRadius.md,
                    overflow: 'hidden',
                    backgroundColor: colors.muted,
                  }}
                >
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={{ width: 64, height: 64 }} resizeMode='cover' />
                  ) : (
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.bodyText, { fontWeight: '600' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.bodyTiny} numberOfLines={1}>
                    {item.seriesTitle}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <Text style={styles.bodyTiny}>{item.sizeMB.toFixed(1)}MB</Text>
                    <Text style={styles.bodyTiny}>再生 {item.playCount}回</Text>
                  </View>
                </View>
              </View>
            </SwipeableRow>
          ))}
        </ScrollView>
      )}

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
              onPress={handleDeleteAll}
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
              onPress={() => setShowDeleteMenu(false)}
              style={{
                paddingVertical: spacing.md,
                alignItems: 'center',
                borderRadius: borderRadius.md,
              }}
            >
              <Text style={styles.bodySmall}>キャンセル</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
