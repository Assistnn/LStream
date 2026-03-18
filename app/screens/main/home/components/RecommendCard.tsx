import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native'

import { SeriesProgessBar } from '../../../../components/ui/SeriesProgessBar'
import { useTheme } from '../../../../hooks/ThemeContext'
import type { SeriesSummaryDetail } from '../../../../repositories/api/IApiRepository'

const { width: screenWidth } = Dimensions.get('window')

export const RecommendCard = ({ series, onPress }: { series: SeriesSummaryDetail; onPress?: () => void }) => {
  const { styles, spacing } = useTheme()
  return (
    <TouchableOpacity style={[styles.card, { width: screenWidth * 0.85 }]} onPress={onPress}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: series.img }} style={{ width: '100%', aspectRatio: 16 / 9 }} />
        <SeriesProgessBar
          style={{
            position: 'absolute',
            bottom: spacing.md,
            left: spacing.md,
            right: spacing.md,
          }}
          variant='light'
          num_comp={series.num_comp}
          num_total={series.num_total}
        />
      </View>

      <View style={{ padding: spacing.md, flexDirection: 'column', gap: spacing.sm }}>
        <Text style={styles.linkText}>{series.category}</Text>
        <Text style={styles.textXl} numberOfLines={2}>
          {series.title}
        </Text>
        {series.description && (
          <Text style={styles.bodyText} numberOfLines={2}>
            {series.description}
          </Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.bodySmall}>{series.num_total}メディア</Text>
          <Text style={styles.bodySmall}>
            合計{' '}
            {(() => {
              const hours = Math.floor(series.duration / 3600)
              const minutes = Math.floor((series.duration % 3600) / 60)
              return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:00` : `${minutes}:00`
            })()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
