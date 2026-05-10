import { Delete, Fingerprint } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Modal, Text, TouchableOpacity, View } from 'react-native'
import ReactNativeBiometrics from 'react-native-biometrics'

import { useAuth } from '../hooks/AuthContext'
import { useTheme } from '../hooks/ThemeContext'
import { StorageRepository } from '../repositories/storage'

const rnBiometrics = new ReactNativeBiometrics()

export const LockScreen = () => {
  const { colors, spacing, styles } = useTheme()
  const { status } = useAuth()
  const [locked, setLocked] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [hasPasscode, setHasPasscode] = useState(false)
  const [enteredCode, setEnteredCode] = useState('')
  const [error, setError] = useState(false)
  const appState = useRef(AppState.currentState)
  const initialCheckDone = useRef(false)

  const loadSettings = useCallback(async () => {
    const [bio, passcode] = await Promise.all([
      StorageRepository.getBiometricEnabled(),
      StorageRepository.getPasscode(),
    ])
    setBiometricEnabled(bio)
    setHasPasscode(passcode !== null)
    return { bio, hasPasscode: passcode !== null }
  }, [])

  const tryBiometric = useCallback(async () => {
    try {
      const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'ロックを解除' })
      if (success) {
        setLocked(false)
        setEnteredCode('')
      }
    } catch {
      // biometric failed, user can use passcode
    }
  }, [])

  useEffect(() => {
    if (status !== 'signedIn') return

    const check = async () => {
      const { bio, hasPasscode: hasPC } = await loadSettings()
      if ((bio || hasPC) && !initialCheckDone.current) {
        initialCheckDone.current = true
        setLocked(true)
        if (bio) {
          await tryBiometric()
        }
      }
    }
    void check()
  }, [status, loadSettings, tryBiometric])

  useEffect(() => {
    if (status !== 'signedIn') return

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const checkLock = async () => {
          const { bio, hasPasscode: hasPC } = await loadSettings()
          if (bio || hasPC) {
            setLocked(true)
            setEnteredCode('')
            setError(false)
            if (bio) {
              await tryBiometric()
            }
          }
        }
        void checkLock()
      }
      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [status, loadSettings, tryBiometric])

  const handleDigit = useCallback(
    (digit: string) => {
      if (enteredCode.length >= 6) return
      const next = enteredCode + digit
      setEnteredCode(next)
      setError(false)

      if (next.length === 6) {
        void StorageRepository.getPasscode().then((stored) => {
          if (stored === next) {
            setLocked(false)
            setEnteredCode('')
          } else {
            setError(true)
            setEnteredCode('')
          }
        })
      }
    },
    [enteredCode],
  )

  if (!locked || status !== 'signedIn') return null

  return (
    <Modal visible animationType='fade'>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing['3xl'],
        }}
      >
        <Text style={styles.textXl}>ロックを解除</Text>

        {hasPasscode && (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: i < enteredCode.length ? colors.primary : colors.muted,
                  }}
                />
              ))}
            </View>

            {error && (
              <Text style={[styles.bodySmall, { color: colors.destructive }]}>パスコードが正しくありません</Text>
            )}

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
                {biometricEnabled ? (
                  <TouchableOpacity
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => void tryBiometric()}
                  >
                    <Fingerprint color={colors.primary} size={28} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 72, height: 72 }} />
                )}
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
                    setEnteredCode((prev) => prev.slice(0, -1))
                    setError(false)
                  }}
                >
                  <Delete color={colors.textSecondary} size={28} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {!hasPasscode && biometricEnabled && (
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => void tryBiometric()}
          >
            <Fingerprint color={colors.primary} size={36} />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  )
}
