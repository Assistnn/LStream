import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const FavoritesChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>お気に入り child 画面</Text>
}
