import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { colors, useTheme } from '../../hooks/ThemeContext'

export const Label = ({
  type,
  text,
  style,
}: {
  type: 'large' | 'small'
  text: string
  style?: StyleProp<ViewStyle>
}) => {
  const { spacing, typography } = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: colors.light.overlayDark,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 9999,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.light.primaryForeground,
          fontSize: type === 'large' ? typography.fontSize.sm : typography.fontSize.xs,
          fontWeight: typography.fontWeight.bold,
          letterSpacing: 0.5,
        }}
      >
        {text}
      </Text>
    </View>
  )
}
