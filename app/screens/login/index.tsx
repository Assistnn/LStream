import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../hooks/AuthContext'
import { useTheme } from '../../hooks/ThemeContext'
import { useLogin } from '../../usecases/useLogin'

export const LoginScreen = () => {
  const { styles } = useTheme()
  const { signIn } = useAuth()
  const { execute, loading } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.screenContainer}>
        <Text>ログイン</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder='メールアドレス'
          keyboardType='email-address'
          autoCapitalize='none'
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder='パスワード'
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            const response = await execute({
              friend_id: email,
              friend_pw: password,
              tenant_code: 'mock-tenant',
              device_token: 'mock-device-token',
              device_uuid: 'mock-device-uuid',
            })
            if (response?.result === 1) {
              await signIn(response.token)
            }
          }}
          disabled={loading}
        >
          <Text style={styles.button}>ログイン</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
