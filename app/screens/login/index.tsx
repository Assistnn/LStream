import { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useAuth } from '../../hooks/AuthContext'
import { useTheme } from '../../hooks/ThemeContext'

export const LoginScreen = () => {
  const { styles } = useTheme()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>ログイン</Text>
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
        onPress={() => {
          // TODO: 認証 API 連携時にメール・パスワードを使用する
          void signIn('dummy-token')
        }}
      >
        <Text style={styles.buttonText}>ログイン</Text>
      </TouchableOpacity>
    </View>
  )
}
