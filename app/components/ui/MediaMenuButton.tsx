import { MoreVertical } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import { Dimensions, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'
import { isFavoriteEpisode } from '../../usecases/useGetFavorites'
import { toggleFavorite } from '../../usecases/useUpdateFavorite'

const MENU_WIDTH = 160

export const MediaMenuButton = ({
  seriesId,
  mediaId,
  mediaType = 'media',
  size = 16,
  iconColor,
  buttonStyle,
  onPress,
}: {
  seriesId: number
  mediaId: number
  mediaType?: 'series' | 'episode' | 'unit' | 'media'
  size?: number
  iconColor?: string
  buttonStyle?: ViewStyle
  onPress?: () => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuStyle, setMenuStyle] = useState<ViewStyle>({})
  const anchorRef = useRef<View>(null)

  const isFavorited = isFavoriteEpisode(seriesId, mediaType === 'series' ? 0 : mediaId)

  const menuItems = [
    { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist:', mediaType, mediaId) },
    { label: '再生キューに追加', onPress: () => console.log('Add to queue:', mediaType, mediaId) },
    { label: 'ダウンロード', onPress: () => console.log('Download:', mediaType, mediaId) },
    {
      label: isFavorited ? 'お気に入りから削除' : 'お気に入りに追加',
      onPress: () => (mediaType === 'series' ? toggleFavorite(seriesId, 0) : toggleFavorite(0, mediaId)),
    },
  ]

  const showMenu = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get('window').width
      const screenHeight = Dimensions.get('window').height

      // ボタンの右端にメニューの右端を合わせる
      let left = x + width - MENU_WIDTH
      const top = y + height + spacing.xs

      // 左端からはみ出る場合
      if (left < 16) {
        left = 16
      }

      // 右端からはみ出る場合
      if (left + MENU_WIDTH > screenWidth - 16) {
        left = screenWidth - MENU_WIDTH - 16
      }

      const style: ViewStyle = { left }

      // 下にはみ出る場合は上に表示
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
          <View
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: borderRadius.md,
                }}
                onPress={() => {
                  item.onPress()
                  setMenuVisible(false)
                }}
              >
                <Text style={styles.textDefault}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
