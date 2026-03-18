import { Play } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { Label } from '../../../../components/ui/Label'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { HomeNewsItem } from '../../../../repositories/api/IApiRepository'

export const NewsCard = ({ news, onPress }: { news: HomeNewsItem; onPress?: () => void }) => {
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
        <Image source={{ uri: news.img }} style={{ width: '100%', aspectRatio: 1 }} />
        <Label
          text={news.category}
          style={{
            position: 'absolute',
            top: spacing['2xs'],
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
      <Text style={styles.titleLarge} numberOfLines={2}>
        {news.title}
      </Text>
      <Text style={[styles.bodySmall]}>{news.num_total}話</Text>
    </TouchableOpacity>
  )
}
