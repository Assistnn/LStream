import { Delete, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../../../hooks/ThemeContext'
import { StorageRepository } from '../../../../repositories/storage'

export const SetPasscodeModal = ({
  visible,
  onClose,
  onComplete,
}: {
  visible: boolean
  onClose: () => void
  onComplete: () => void
}) => {
  const { colors, spacing, styles } = useTheme()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [firstCode, setFirstCode] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleClose = () => {
    setStep('enter')
    setFirstCode('')
    setCode('')
    setError(false)
    onClose()
  }

  const handleDigit = useCallback(
    (digit: string) => {
      if (code.length >= 6) return
      const next = code + digit
      setCode(next)
      setError(false)

      if (next.length === 6) {
        if (step === 'enter') {
          setFirstCode(next)
          setCode('')
          setStep('confirm')
        } else {
          if (next === firstCode) {
            void StorageRepository.setPasscode(next).then(() => {
              setStep('enter')
              setFirstCode('')
              setCode('')
              onComplete()
            })
          } else {
            setError(true)
            setCode('')
          }
        }
      }
    },
    [code, step, firstCode, onComplete],
  )

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing['3xl'],
          paddingBottom: insets.bottom,
        }}
      >
        <TouchableOpacity
          style={{ position: 'absolute', top: insets.top + spacing.lg, right: spacing.lg }}
          onPress={handleClose}
        >
          <X color={colors.text} size={24} />
        </TouchableOpacity>

        <Text style={styles.textXl}>{step === 'enter' ? 'パスコードを入力' : 'もう一度入力してください'}</Text>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: i < code.length ? colors.primary : colors.muted,
              }}
            />
          ))}
        </View>

        {error && <Text style={[styles.bodySmall, { color: colors.destructive }]}>パスコードが一致しません</Text>}

        <View style={{ gap: spacing.lg, alignItems: 'center' }}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: spacing.lg }}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colors.secondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleDigit(digit)}
                >
                  <Text style={[styles.text2xl, { fontWeight: '400' }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View style={{ width: 72, height: 72 }} />
            <TouchableOpacity
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => handleDigit('0')}
            >
              <Text style={[styles.text2xl, { fontWeight: '400' }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                setCode((prev) => prev.slice(0, -1))
                setError(false)
              }}
            >
              <Delete color={colors.textSecondary} size={28} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
