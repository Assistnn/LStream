import { Text, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const EmptyState = ({
  icon = '📭',
  title,
  description,
}: {
  icon?: string
  title: string
  description?: string
}) => {
  const { styles, colors, spacing } = useTheme()
  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing['3xl'],
        },
      ]}
    >
      <Text style={{ fontSize: 64 }}>{icon}</Text>
      <Text style={[{ marginTop: spacing.lg, textAlign: 'center' }]}>{title}</Text>
      {description && (
        <Text style={[styles.textBody, { marginTop: spacing.sm, color: colors.textSecondary, textAlign: 'center' }]}>
          {description}
        </Text>
      )}
    </View>
  )
}
