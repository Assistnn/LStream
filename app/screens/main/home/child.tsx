import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const HomeChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>ホーム child 画面</Text>
}
