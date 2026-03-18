import { LucideIcon } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon
  title: string
  description?: string
}) => {
  const { styles, colors, spacing } = useTheme()
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 3,
      }}
    >
      {Icon && (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <Icon size={32} color={colors.textSecondary} />
        </View>
      )}
      <Text style={[styles.titleLarge, { color: colors.text, marginBottom: spacing.xs }]}>{title}</Text>
      {description && <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{description}</Text>}
    </View>
  )
}
