import { Play } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { Label } from '../../../../components/ui/Label'
import { useTheme } from '../../../../hooks/ThemeContext'

// TODO: APIレスポンス調整中、UIはたぶんFix
export const NewsCard = ({
  episode,
  onPress,
}: {
  episode: {
    id: string
    title: string
    img: string
    duration: number
    category: string
    type: 'episode' | 'series'
    itemType: 'audio' | 'video'
  }
  onPress?: () => void
}) => {
  const { styles, spacing, borderRadius, colors } = useTheme()
  return (
    <TouchableOpacity style={{ width: 160, flexDirection: 'column', gap: spacing.xs }} onPress={onPress}>
      <View
        style={{
          position: 'relative',
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          width: '100%',
          aspectRatio: 1,
        }}
      >
        <Image source={{ uri: episode.img }} style={{ width: '100%', aspectRatio: 1 }} />
        <Label
          type='small'
          text={episode.itemType === 'video' ? 'VIDEO' : 'AUDIO'}
          style={{
            position: 'absolute',
            top: spacing['2xs'],
            left: spacing['2xs'],
          }}
        />
        <Label
          type='small'
          text={(() => {
            const minutes = Math.floor(episode.duration / 60)
            const secs = episode.duration % 60
            return `${minutes}:${secs.toString().padStart(2, '0')}`
          })()}
          style={{
            position: 'absolute',
            bottom: spacing['2xs'],
            left: spacing['2xs'],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: spacing['2xs'],
            right: spacing['2xs'],
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.overlayLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Play color={'#000000'} size={12} fill={'#000000'} />
        </View>
      </View>
      <Text style={styles.textContentTitleSmall} numberOfLines={2}>
        {episode.title}
      </Text>
      <Text style={[styles.textCaption]}>{episode.category}</Text>
    </TouchableOpacity>
  )
}
