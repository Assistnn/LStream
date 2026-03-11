import { Text, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const PlaylistDetailScreen = () => {
  const { styles } = useTheme()
  return (
    <View style={styles.screenContainer}>
      <Text>プレイリスト詳細画面</Text>
    </View>
  )
}
