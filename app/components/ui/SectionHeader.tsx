import { Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const SectionHeader = ({
  title,
  action,
  onActionPress,
}: {
  title: string
  action?: string
  onActionPress?: () => void
}) => {
  const { styles, colors, typography, spacing } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
      }}
    >
      <Text style={styles.textSubtitle}>{title}</Text>
      {action && onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <Text
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary,
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
