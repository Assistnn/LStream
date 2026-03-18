import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { colors, useTheme } from '../../hooks/ThemeContext'
import { ProgressBar } from './ProgressBar'

export const SeriesProgessBar = ({
  variant = 'light',
  num_comp,
  num_total,
  style,
}: {
  variant?: 'light' | 'dark'
  num_comp: number
  num_total: number
  style?: StyleProp<ViewStyle>
}) => {
  const { spacing, borderRadius, styles } = useTheme()
  const progressPercent = (num_comp / num_total) * 100
  const textColor = variant === 'light' ? colors.light.textSecondary : colors.dark.textSecondary
  return (
    <View
      style={{
        backgroundColor: variant === 'light' ? colors.light.overlayLight : colors.dark.card,
        borderWidth: variant === 'light' ? 0 : 1,
        borderColor: colors.dark.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        flexDirection: 'column',
        gap: spacing.sm,
        justifyContent: 'center',
        ...style,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={[styles.bodySmall, { color: textColor }]}>
          {num_comp}/{num_total} 完了
        </Text>
        <Text style={[styles.bodySmall, { color: textColor }]}>{Math.round(progressPercent)}%</Text>
      </View>
      <ProgressBar progress={progressPercent} height={4} />
    </View>
  )
}
