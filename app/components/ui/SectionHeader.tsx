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
  const { styles, spacing } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={styles.text2xl}>{title}</Text>
      {action && onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.linkText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
