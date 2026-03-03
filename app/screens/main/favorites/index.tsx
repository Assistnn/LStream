import { useNavigation } from '@react-navigation/native'
import { Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const FavoritesTabScreen = () => {
  const { styles } = useTheme()
  const navigation = useNavigation()
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.tabContentText}>お気に入り画面</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FavoritesChild' as never)}>
        <Text style={styles.buttonText}>child へ</Text>
      </TouchableOpacity>
    </View>
  )
}
