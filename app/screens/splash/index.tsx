import { View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const SplashScreen = () => {
  const { styles } = useTheme()
  return <View style={styles.screenContainer} />
}
