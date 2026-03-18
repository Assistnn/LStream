import { Text, View } from 'react-native'

import { useTheme } from '../../../hooks/ThemeContext'

export const EpisodeListScreen = () => {
  const { styles } = useTheme()
  return (
    <View style={styles.screenContainer}>
      <Text>エピソード一覧画面</Text>
    </View>
  )
}
