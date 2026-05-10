import { ChevronLeft, ChevronRight, Mail, QrCode, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../../../hooks/ThemeContext'

export const AddTenantModal = ({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean
  onClose: () => void
  onSubmit: (tenantCode: string) => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<'select' | 'manual'>('select')
  const [tenantCode, setTenantCode] = useState('')

  const handleClose = () => {
    setStep('select')
    setTenantCode('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: borderRadius['3xl'],
            borderTopRightRadius: borderRadius['3xl'],
            paddingBottom: insets.bottom,
          }}
        >
          <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.muted,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
            }}
          >
            {step === 'manual' ? (
              <TouchableOpacity onPress={() => setStep('select')}>
                <ChevronLeft color={colors.text} size={24} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}
            <Text style={styles.titleLarge}>{step === 'select' ? 'アカウント追加' : '手動入力'}</Text>
            <TouchableOpacity onPress={handleClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
            {step === 'select' && (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.bodySmall}>サービスアカウントを追加する方法を選択してください</Text>
                <View style={{ gap: spacing.sm }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.secondary,
                      borderRadius: borderRadius.xl,
                    }}
                    onPress={() => setStep('manual')}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail color={colors.primary} size={20} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text style={styles.textDefault}>手動入力</Text>
                      <Text style={styles.bodySmall}>テナントコードで追加</Text>
                    </View>
                    <ChevronRight color={colors.textSecondary} size={20} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.secondary,
                      borderRadius: borderRadius.xl,
                    }}
                    onPress={() => Alert.alert('準備中', 'QRコード読み込み機能は準備中です')}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <QrCode color={colors.accent} size={20} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text style={styles.textDefault}>QRコード読み込み</Text>
                      <Text style={styles.bodySmall}>マイページのQRをスキャン</Text>
                    </View>
                    <ChevronRight color={colors.textSecondary} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'manual' && (
              <View style={{ gap: spacing.lg }}>
                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.textDefault}>テナントコード</Text>
                  <TextInput
                    style={[styles.inputText, styles.input]}
                    placeholder='テナントコード'
                    placeholderTextColor={colors.textTertiary}
                    value={tenantCode}
                    onChangeText={setTenantCode}
                    autoCapitalize='none'
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={{
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.xl,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    if (!tenantCode.trim()) {
                      Alert.alert('エラー', 'テナントコードを入力してください')
                      return
                    }
                    const code = tenantCode.trim()
                    setStep('select')
                    setTenantCode('')
                    onSubmit(code)
                  }}
                >
                  <Text style={[styles.textDefault, { color: colors.primaryForeground }]}>次へ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}
