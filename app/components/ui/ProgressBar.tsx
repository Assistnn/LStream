import { View, type ViewStyle } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const ProgressBar = ({
  progress,
  height = 6,
  rounded = true,
  style,
}: {
  progress: number // 0-100
  height?: number
  rounded?: boolean
  style?: ViewStyle
}) => {
  const { colors } = useTheme()
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          height,
          backgroundColor: colors.mutedForeground,
          borderRadius: rounded ? 9999 : 0,
        },
        style,
      ]}
    >
      <View
        style={[
          {
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            backgroundColor: colors.primary,
            height,
            borderRadius: rounded ? 9999 : 0,
          },
        ]}
      />
    </View>
  )
}
