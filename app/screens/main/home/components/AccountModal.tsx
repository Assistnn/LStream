import { Check, Fingerprint, Lock, Plus, ShieldCheck, X } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import ReactNativeBiometrics from 'react-native-biometrics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../../../../hooks/AuthContext'
import { useTheme } from '../../../../hooks/ThemeContext'
import { StorageRepository } from '../../../../repositories/storage'
import { useGetMe } from '../../../../usecases/useGetMe'
import { SetPasscodeModal } from './SetPasscodeModal'

const rnBiometrics = new ReactNativeBiometrics()

export const AccountModal = ({
  visible,
  onClose,
  onAddTenant,
}: {
  visible: boolean
  onClose: () => void
  onAddTenant: () => void
}) => {
  const { colors, spacing, borderRadius, styles } = useTheme()
  const insets = useSafeAreaInsets()
  const { signOut } = useAuth()
  const { data: me } = useGetMe()
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [passcodeEnabled, setPasscodeEnabled] = useState(false)
  const [showSetPasscode, setShowSetPasscode] = useState(false)

  const activeTenant = me?.tenants.find((t) => t.is_active)

  useEffect(() => {
    if (!visible) return
    const load = async () => {
      const [bio, passcode] = await Promise.all([
        StorageRepository.getBiometricEnabled(),
        StorageRepository.getPasscode(),
      ])
      setBiometricEnabled(bio)
      setPasscodeEnabled(passcode !== null)
    }
    void load()
  }, [visible])

  const toggleBiometric = useCallback(async (value: boolean) => {
    if (value) {
      const { available } = await rnBiometrics.isSensorAvailable()
      if (!available) {
        Alert.alert('エラー', 'この端末では生体認証を利用できません')
        return
      }
      const { success } = await rnBiometrics.simplePrompt({ promptMessage: '生体認証を有効にする' })
      if (!success) return
    }
    setBiometricEnabled(value)
    await StorageRepository.setBiometricEnabled(value)
  }, [])

  const togglePasscode = useCallback(async (value: boolean) => {
    if (value) {
      setShowSetPasscode(true)
    } else {
      Alert.alert('パスコードを削除', 'パスコードロックを無効にしますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '無効にする',
          style: 'destructive',
          onPress: async () => {
            setPasscodeEnabled(false)
            await StorageRepository.setPasscode(null)
          },
        },
      ])
    }
  }, [])

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: borderRadius['3xl'],
            borderTopRightRadius: borderRadius['3xl'],
            maxHeight: '85%',
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
            <Text style={styles.textXl}>アカウント</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: spacing.lg }}>
            <View style={{ gap: spacing['2xl'] }}>
              {me && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.lg,
                    paddingVertical: spacing.lg,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#6366F1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>
                      {me.user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text style={styles.titleLarge}>{me.user_name}</Text>
                    <Text style={styles.bodySmall}>{me.email}</Text>
                    {activeTenant && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={[styles.bodyTiny, { color: colors.textTertiary }]}>━━</Text>
                        <Text style={[styles.bodyTiny, { color: colors.textTertiary }]}>
                          {activeTenant.name}・{activeTenant.code}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={{ gap: spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={styles.titleMedium}>テナント</Text>
                  <TouchableOpacity onPress={onAddTenant}>
                    <Plus color={colors.primary} size={20} />
                  </TouchableOpacity>
                </View>

                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.secondary,
                      borderRadius: borderRadius.xl,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#6366F1',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>L</Text>
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text style={styles.textDefault}>すべてのテナント</Text>
                      <Text style={styles.bodySmall}>LStream</Text>
                    </View>
                  </View>

                  {me?.tenants.map((tenant) => (
                    <View
                      key={tenant.tenant_id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.md,
                        backgroundColor: tenant.is_active ? colors.accentBackground : colors.secondary,
                        borderRadius: borderRadius.xl,
                        ...(tenant.is_active && { borderWidth: 1, borderColor: colors.primary }),
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: '#6366F1',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                          {me.user_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: spacing.xxs }}>
                        <Text style={styles.textDefault}>{me.user_name}</Text>
                        <Text style={styles.bodySmall}>{me.email}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Text style={[styles.bodyTiny, { color: colors.textTertiary }]}>━━</Text>
                          <Text style={[styles.bodyTiny, { color: colors.textTertiary }]}>
                            {tenant.name}・{tenant.code}
                          </Text>
                        </View>
                      </View>
                      {tenant.is_active && <Check color={colors.primary} size={20} />}
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ShieldCheck color={colors.text} size={20} />
                  <Text style={styles.titleMedium}>セキュリティ</Text>
                </View>

                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.secondary,
                      borderRadius: borderRadius.xl,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Fingerprint color={colors.primary} size={20} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text style={styles.textDefault}>Face ID / Touch ID</Text>
                      <Text style={styles.bodySmall}>生体認証でロック解除</Text>
                    </View>
                    <Switch
                      value={biometricEnabled}
                      onValueChange={(v) => void toggleBiometric(v)}
                      trackColor={{ false: colors.muted, true: colors.primary }}
                      thumbColor='#FFFFFF'
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: colors.secondary,
                      borderRadius: borderRadius.xl,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Lock color={colors.accent} size={20} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text style={styles.textDefault}>パスコードロック</Text>
                      <Text style={styles.bodySmall}>6桁のパスコードを設定</Text>
                    </View>
                    <Switch
                      value={passcodeEnabled}
                      onValueChange={(v) => void togglePasscode(v)}
                      trackColor={{ false: colors.muted, true: colors.primary }}
                      thumbColor='#FFFFFF'
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.destructive,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  onClose()
                  void signOut()
                }}
              >
                <Text style={[styles.textDefault, { color: colors.destructive }]}>ログアウト</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      <SetPasscodeModal
        visible={showSetPasscode}
        onClose={() => setShowSetPasscode(false)}
        onComplete={() => {
          setPasscodeEnabled(true)
          setShowSetPasscode(false)
        }}
      />
    </Modal>
  )
}
