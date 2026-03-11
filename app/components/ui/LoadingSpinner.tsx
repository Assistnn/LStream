import { ActivityIndicator, Text, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const LoadingSpinner = ({ size = 'large', text }: { size?: 'small' | 'large'; text?: string }) => {
  const { styles, colors, spacing } = useTheme()
  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <ActivityIndicator size={size} color={colors.primaryLight} />
      {text && <Text style={[styles.textBody, { marginTop: spacing.md, color: colors.textSecondary }]}>{text}</Text>}
    </View>
  )
}
