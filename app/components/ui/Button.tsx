import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, type TouchableOpacityProps, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const Button = ({
  variant = 'primary',
  size = 'medium',
  loading,
  icon,
  fillIcon = false,
  children,
  ...props
}: TouchableOpacityProps & {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  icon?: ReactNode
  fillIcon?: boolean
  children: string
}) => {
  const { styles, spacing } = useTheme()

  const containerStyles = {
    primary: styles.button,
    secondary: styles.buttonSecondary,
    tertiary: styles.buttonTertiary,
  }

  const textStyles = {
    primary: styles.buttonText,
    secondary: styles.buttonSecondaryText,
    tertiary: styles.buttonTertiaryText,
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }
      case 'large':
        return { paddingHorizontal: spacing['3xl'], paddingVertical: spacing.lg }
      default:
        return {}
    }
  }

  const textColor = textStyles[variant].color

  const renderIcon = () => {
    if (!icon) return null
    if (isValidElement(icon)) {
      const iconProps: { color: string; fill?: string } = { color: textColor }
      if (fillIcon) {
        iconProps.fill = textColor
      }
      return cloneElement(icon as ReactElement<{ color?: string; fill?: string }>, iconProps)
    }
    return icon
  }

  return (
    <TouchableOpacity
      style={[containerStyles[variant], { width: '100%' }, getSizeStyle(), props.disabled && { opacity: 0.5 }]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {renderIcon()}
          <Text style={textStyles[variant]}>{children}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
