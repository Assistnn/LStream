import { Text, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const DownloadScreen = () => {
  const { styles } = useTheme()
  return (
    <View style={styles.screenContainer}>
      <Text>ダウンロード管理画面</Text>
    </View>
  )
}
