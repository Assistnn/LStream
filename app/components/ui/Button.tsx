import { ActivityIndicator, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const Button = ({
  variant = 'primary',
  size = 'medium',
  loading,
  children,
  ...props
}: TouchableOpacityProps & {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: string
}) => {
  const { styles, colors, spacing } = useTheme()

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary
      case 'outline':
        return styles.buttonOutline
      default:
        return styles.button
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondaryText
      case 'outline':
        return styles.buttonOutlineText
      default:
        return styles.buttonText
    }
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

  return (
    <TouchableOpacity
      style={[getButtonStyle(), getSizeStyle(), props.disabled && { opacity: 0.5 }]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryForeground : colors.text} />
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}
