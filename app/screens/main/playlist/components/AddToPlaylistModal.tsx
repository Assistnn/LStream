import { List, Plus, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '../../../../components/ui/EmptyState'
import type { PlaylistItem } from '../../../../hooks/PlaylistContext'
import { usePlaylist } from '../../../../hooks/PlaylistContext'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { SeriesMedia } from '../../../../repositories/api/IApiRepository'
import { apiRepository } from '../../../../repositories/api'
import { CreatePlaylistModal } from './CreatePlaylistModal'
import { PlaylistCover } from './PlaylistCover'

const seriesToPlaylistItems = (
  seriesId: number,
  seriesTitle: string,
  episodes: SeriesMedia[],
): Omit<PlaylistItem, 'id'>[] =>
  episodes.flatMap((ep) =>
    ep.units && ep.units.length > 0
      ? ep.units.map((unit) => ({
          seriesId,
          episodeId: ep.item_id,
          unitId: unit.item_id,
          title: unit.title,
          seriesTitle,
          thumbnail: unit.img || ep.img,
          duration: unit.duration,
        }))
      : [
          {
            seriesId,
            episodeId: ep.item_id,
            title: ep.title,
            seriesTitle,
            thumbnail: ep.img,
            duration: ep.duration,
          },
        ],
  )

export const AddToPlaylistModal = ({
  visible,
  onClose,
  item,
  seriesId,
}: {
  visible: boolean
  onClose: () => void
  item: Omit<PlaylistItem, 'id'> | null
  seriesId?: number
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const insets = useSafeAreaInsets()
  const { playlists, addItemToPlaylist, addItemsToPlaylist, createPlaylist } = usePlaylist()
  const [createOpen, setCreateOpen] = useState(false)

  const addToPlaylist = async (playlistId: string) => {
    if (seriesId) {
      const series = await apiRepository.getSeries(seriesId)
      const items = seriesToPlaylistItems(seriesId, series.title, series.episodes)
      addItemsToPlaylist(playlistId, items)
    } else if (item) {
      addItemToPlaylist(playlistId, item)
    }
  }

  const handleSelect = (playlistId: string) => {
    void addToPlaylist(playlistId)
    onClose()
  }

  return (
    <>
      <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius['2xl'],
              borderTopRightRadius: borderRadius['2xl'],
              maxHeight: '70%',
              paddingBottom: insets.bottom,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={styles.textXl}>プレイリストに追加</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setCreateOpen(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: borderRadius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.foreground,
                  }}
                >
                  <Plus size={18} color={colors.background} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
              {playlists.length === 0 ? (
                <View style={{ padding: spacing.lg }}>
                  <EmptyState
                    icon={List}
                    title='プレイリストがありません'
                    description='新しいプレイリストを作成してください'
                  />
                  <TouchableOpacity
                    onPress={() => setCreateOpen(true)}
                    style={{
                      marginTop: spacing.lg,
                      paddingVertical: spacing.md,
                      borderRadius: borderRadius.full,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: spacing.sm,
                    }}
                  >
                    <Plus size={18} color={colors.text} />
                    <Text style={styles.textBold}>プレイリストを追加</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                playlists.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleSelect(p.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      borderRadius: borderRadius.xl,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }}
                  >
                    <PlaylistCover
                      gradient={p.gradient}
                      coverImage={p.coverImage}
                      size={48}
                      borderRadius={borderRadius.lg}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.textBold} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.bodySmall}>{p.items.length}メディア</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CreatePlaylistModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          const newId = createPlaylist(payload)
          setCreateOpen(false)
          void addToPlaylist(newId)
          onClose()
        }}
      />
    </>
  )
}
