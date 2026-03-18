import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { colors, useTheme } from '../../hooks/ThemeContext'

export const Label = ({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) => {
  const { spacing, styles } = useTheme()
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
        style={[
          styles.titleLabel,
          {
            color: colors.light.primaryForeground,
            letterSpacing: 0.5,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}
