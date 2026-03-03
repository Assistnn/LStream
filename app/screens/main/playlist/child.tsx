import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const PlaylistChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>プレイリスト child 画面</Text>
}
