import { MoreVertical } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import { Dimensions, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'

import { useDownload } from '../../hooks/DownloadContext'
import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import { AddToPlaylistModal } from '../../screens/main/playlist/components/AddToPlaylistModal'
import { isFavoriteEpisode } from '../../usecases/useGetFavorites'
import { toggleFavorite } from '../../usecases/useUpdateFavorite'

const MENU_WIDTH = 180

export type MediaInfo = {
  title: string
  seriesTitle: string
  thumbnail: string
  duration: number
  url: string
  contentMediaType: number
}

export const MediaMenuButton = ({
  seriesId,
  mediaId,
  mediaType = 'media',
  size = 16,
  iconColor,
  buttonStyle,
  onPress,
  mediaInfo,
  onAddAllToQueue,
  onDownloadAll,
}: {
  seriesId: number
  mediaId: number
  mediaType?: 'series' | 'episode' | 'unit' | 'media'
  size?: number
  iconColor?: string
  buttonStyle?: ViewStyle
  onPress?: () => void
  mediaInfo?: MediaInfo
  onAddAllToQueue?: () => void
  onDownloadAll?: () => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const {
    queueActions: { addToQueue },
  } = usePlayer()
  const { startDownload, isDownloaded, isDownloading } = useDownload()
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuStyle, setMenuStyle] = useState<ViewStyle>({})
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false)
  const anchorRef = useRef<View>(null)

  const isFavorited = isFavoriteEpisode(seriesId, mediaType === 'series' ? 0 : mediaId)

  const canAddToCollection = !!mediaInfo || mediaType === 'series'
  const itemForCollection =
    canAddToCollection && mediaInfo && mediaType !== 'series'
      ? {
          seriesId,
          episodeId: mediaType === 'unit' ? 0 : mediaId,
          unitId: mediaType === 'unit' ? mediaId : undefined,
          title: mediaInfo.title,
          seriesTitle: mediaInfo.seriesTitle,
          thumbnail: mediaInfo.thumbnail,
          duration: mediaInfo.duration,
          url: mediaInfo.url,
          mediaType: mediaInfo.contentMediaType,
        }
      : null

  const menuItems = [
    {
      label: 'プレイリストに追加',
      disabled: !canAddToCollection,
      onPress: () => {
        if (canAddToCollection) setAddToPlaylistOpen(true)
      },
    },
    {
      label: '再生キューに追加',
      disabled: !canAddToCollection,
      onPress: () => {
        if (itemForCollection) {
          addToQueue({
            trackId: itemForCollection.episodeId,
            childId: itemForCollection.unitId,
            title: itemForCollection.title,
            parentTitle: itemForCollection.seriesTitle,
            thumbnail: itemForCollection.thumbnail,
            duration: itemForCollection.duration,
            url: itemForCollection.url,
            mediaType: itemForCollection.mediaType,
          })
        } else if (onAddAllToQueue) {
          onAddAllToQueue()
        }
      },
    },
    ...(mediaInfo
      ? [
          {
            label: isDownloaded(mediaId)
              ? 'ダウンロード済み'
              : isDownloading(mediaId)
                ? 'ダウンロード中...'
                : 'ダウンロード',
            disabled: isDownloaded(mediaId) || isDownloading(mediaId),
            onPress: () => {
              startDownload({
                seriesId,
                mediaId,
                title: mediaInfo.title,
                seriesTitle: mediaInfo.seriesTitle,
                thumbnail: mediaInfo.thumbnail,
                duration: mediaInfo.duration,
                mediaType: mediaInfo.contentMediaType,
                url: mediaInfo.url,
              })
            },
          },
        ]
      : onDownloadAll
        ? [
            {
              label: 'ダウンロード',
              disabled: false,
              onPress: () => onDownloadAll(),
            },
          ]
        : []),
    {
      label: isFavorited ? 'お気に入りから削除' : 'お気に入りに追加',
      disabled: false,
      onPress: () => (mediaType === 'series' ? toggleFavorite(seriesId, 0) : toggleFavorite(0, mediaId)),
    },
  ]

  const showMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get('window').width
      const screenHeight = Dimensions.get('window').height

      let left = x + width - MENU_WIDTH
      const top = y + height + spacing.xs

      if (left < 16) {
        left = 16
      }

      if (left + MENU_WIDTH > screenWidth - 16) {
        left = screenWidth - MENU_WIDTH - 16
      }

      const style: ViewStyle = { left }

      if (top + 200 > screenHeight) {
        style.bottom = screenHeight - y + spacing.xs
      } else {
        style.top = top
      }

      setMenuStyle(style)
      setMenuVisible(true)
    })
  }, [spacing.xs])

  return (
    <View ref={anchorRef} collapsable={false}>
      <TouchableOpacity
        style={buttonStyle ?? { padding: 2 }}
        onPress={(e) => {
          e.stopPropagation()
          showMenu()
          onPress?.()
        }}
      >
        <MoreVertical size={size} color={iconColor ?? colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType='fade' onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuVisible(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              ...menuStyle,
              width: MENU_WIDTH,
              backgroundColor: colors.card,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.xs,
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                disabled={item.disabled}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: borderRadius.md,
                  opacity: item.disabled ? 0.4 : 1,
                }}
                onPress={() => {
                  item.onPress()
                  setMenuVisible(false)
                }}
              >
                <Text style={styles.textDefault}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <AddToPlaylistModal
        visible={addToPlaylistOpen}
        item={itemForCollection}
        seriesId={mediaType === 'series' ? seriesId : undefined}
        onClose={() => setAddToPlaylistOpen(false)}
      />
    </View>
  )
}
