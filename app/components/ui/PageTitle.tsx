import type { ComponentType, ReactNode } from 'react'
import { Text, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const PageTitle = ({
  icon: Icon,
  title,
  children,
}: {
  icon?: ComponentType<{ color: string; size: number }>
  title: string
  children?: ReactNode
}) => {
  const { styles, spacing, colors } = useTheme()
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          },
        ]}
      >
        {Icon && <Icon color={colors.text} size={32} />}
        <Text style={[styles.text3xl]}>{title}</Text>
      </View>
      {children}
    </View>
  )
}
