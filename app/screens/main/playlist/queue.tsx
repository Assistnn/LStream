import { Text, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const QueueScreen = () => {
  const { styles } = useTheme()
  return (
    <View style={styles.screenContainer}>
      <Text>再生キュー画面</Text>
    </View>
  )
}
