import { Image, Text, TouchableOpacity, View } from 'react-native'

import { Label } from '../../../../components/ui/Label'
import { ProgressBar } from '../../../../components/ui/ProgressBar'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { SeriesItemWithItemId } from '../../../../repositories/api/IApiRepository'

export const RecentCard = ({ item, onPress }: { item: SeriesItemWithItemId; onPress?: () => void }) => {
  const { styles, spacing, borderRadius } = useTheme()

  // 単体エピソード
  if (item.num_total === 0) {
    return (
      <TouchableOpacity style={{ width: 160, flexDirection: 'column', gap: spacing.xs }} onPress={onPress}>
        <Image
          source={{ uri: item.img }}
          style={{ borderRadius: borderRadius.sm, overflow: 'hidden', width: '100%', aspectRatio: 1 }}
        />
        <Text style={styles.textContentTitleSmall} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.textCaption]}>
          {(() => {
            const minutes = Math.floor(item.duration / 60)
            const seconds = item.duration % 60
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
          })()}
        </Text>
      </TouchableOpacity>
    )
  }

  const progressPercent = (item.num_comp / item.num_total) * 100
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
        <Image source={{ uri: item.img }} style={{ width: '100%', aspectRatio: 1 }} />
        <Label
          type='small'
          text={`${item.num_total}話`}
          style={{
            position: 'absolute',
            top: spacing['2xs'],
            left: spacing['2xs'],
          }}
        />
        <ProgressBar
          progress={progressPercent}
          rounded={false}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 }}
        />
      </View>
      <Text style={styles.textContentTitleSmall} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.textCaption]}>{item.num_total}メディア</Text>
    </TouchableOpacity>
  )
}
