import { Text, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const ContentDetailScreen = () => {
  const { styles } = useTheme()
  return (
    <View style={styles.screenContainer}>
      <Text>コンテンツ詳細画面</Text>
    </View>
  )
}
