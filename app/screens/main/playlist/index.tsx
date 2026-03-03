import { useNavigation } from '@react-navigation/native'
import { Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const PlaylistTabScreen = () => {
  const { styles } = useTheme()
  const navigation = useNavigation()
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.tabContentText}>プレイリスト画面</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PlaylistChild' as never)}>
        <Text style={styles.buttonText}>child へ</Text>
      </TouchableOpacity>
    </View>
  )
}
