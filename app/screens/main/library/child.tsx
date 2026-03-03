import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const LibraryChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>ライブラリ child 画面</Text>
}
