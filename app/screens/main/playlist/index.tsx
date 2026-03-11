import { useNavigation } from '@react-navigation/native'
import { Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../../hooks/ThemeContext'

export const PlaylistTabScreen = () => {
  const { styles } = useTheme()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <Text>プレイリスト画面</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PlaylistChild' as never)}>
        <Text style={styles.buttonText}>child へ</Text>
      </TouchableOpacity>
    </View>
  )
}
