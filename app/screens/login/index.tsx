import { useEffect, useRef } from 'react'
import { ActivityIndicator, Alert, Animated, Easing, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '../../hooks/ThemeContext'
import { useOAuthLogin } from '../../hooks/useOAuthLogin'

export const LoginScreen = () => {
  const { styles, colors } = useTheme()
  const { startLogin, loading, error } = useOAuthLogin()

  const pingAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [pingAnim, pulseAnim])

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                opacity: pingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                transform: [{ scale: pingAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryLight,
                opacity: 0.2,
                transform: [{ scale: pulseAnim }],
              }}
            />
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  marginLeft: 4,
                  borderLeftWidth: 20,
                  borderTopWidth: 12,
                  borderBottomWidth: 12,
                  borderLeftColor: '#FFFFFF',
                  borderTopColor: 'transparent',
                  borderBottomColor: 'transparent',
                }}
              />
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 }}>L</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>STREAM</Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.textSecondary,
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Workspace
            </Text>
          </View>
        </View>

        <View style={{ gap: 12, paddingBottom: 48 }}>
          <TouchableOpacity
            style={{
              height: 44,
              backgroundColor: colors.primary,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.6 : 1,
            }}
            onPress={() => void startLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>ログイン</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: 44,
              backgroundColor: colors.background,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => Alert.alert('TODO')}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>アカウント作成</Text>
          </TouchableOpacity>
          {error && <Text style={[styles.bodySmall, { color: colors.destructive, textAlign: 'center' }]}>{error}</Text>}
        </View>
      </View>
    </SafeAreaView>
  )
}
