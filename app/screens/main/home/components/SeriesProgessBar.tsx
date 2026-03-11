import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { ProgressBar } from '../../../../components/ui/ProgressBar'
import { colors, useTheme } from '../../../../hooks/ThemeContext'

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
  const { spacing, borderRadius, typography } = useTheme()
  const progressPercent = (num_comp / num_total) * 100
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
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: variant === 'light' ? colors.light.textSecondary : colors.dark.textSecondary,
          }}
        >
          {num_comp}/{num_total} 完了
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: variant === 'light' ? colors.light.textSecondary : colors.dark.textSecondary,
          }}
        >
          {Math.round(progressPercent)}%
        </Text>
      </View>
      <ProgressBar progress={progressPercent} height={4} />
    </View>
  )
}
