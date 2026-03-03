import { Text } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const HistoryChildScreen = () => {
  const { styles } = useTheme()
  return <Text style={styles.tabContentText}>履歴 child 画面</Text>
}
