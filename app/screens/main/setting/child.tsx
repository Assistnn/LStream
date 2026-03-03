import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const SettingsChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>設定 child 画面</Text>
}
