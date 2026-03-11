import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export type ContextMenuItem = {
  label: string
  onPress: () => void
  icon?: React.ReactNode
  isSelected?: boolean
}

export const ContextMenu = ({
  visible,
  onClose,
  items,
  position = 'right',
  anchorY,
}: {
  visible: boolean
  onClose: () => void
  items: ContextMenuItem[]
  position?: 'left' | 'center' | 'right'
  anchorY?: number
}) => {
  const { colors, spacing, typography, borderRadius } = useTheme()

  const getPositionStyle = () => {
    switch (position) {
      case 'left':
        return { left: spacing.md }
      case 'center':
        return { alignSelf: 'center' as const }
      case 'right':
        return { right: spacing.md }
    }
  }

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
        }}
        onPress={onClose}
      >
        <View
          style={{
            position: 'absolute',
            top: anchorY ?? spacing.xl,
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.xs,
            ...getPositionStyle(),
          }}
        >
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
                backgroundColor: item.isSelected ? colors.primaryLight : 'transparent',
                borderRadius: borderRadius.md,
              }}
              onPress={() => {
                item.onPress()
                onClose()
              }}
            >
              {item.icon && <View>{item.icon}</View>}
              <Text
                style={{
                  fontSize: typography.fontSize.base,
                  color: item.isSelected ? colors.primary : colors.text,
                  fontWeight: item.isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}
