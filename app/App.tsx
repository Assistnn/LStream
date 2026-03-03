import { NavigationContainer } from '@react-navigation/native'
import { useContext } from 'react'
import { StatusBar, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'

import { AuthProvider, useAuth } from './hooks/AuthContext'
import { ThemeContext, ThemeProvider } from './hooks/ThemeContext'
import { LoginScreen } from './screens/login'
import { MainScreen } from './screens/main'
import { SplashScreen } from './screens/splash'

enableScreens()

export default () => (
  <ThemeProvider>
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  </ThemeProvider>
)

const AppContent = () => {
  const { styles, statusBarStyle } = useContext(ThemeContext)!
  const safeAreaInsets = useSafeAreaInsets()
  const { status } = useAuth()
  return (
    <>
      <StatusBar barStyle={statusBarStyle} />
      <View
        style={[
          {
            flex: 1,
            paddingTop: safeAreaInsets.top,
            backgroundColor: styles.screenContainer.backgroundColor,
          },
        ]}
      >
        <NavigationContainer>
          {status === 'loading' && <SplashScreen />}
          {status === 'signedOut' && <LoginScreen />}
          {status === 'signedIn' && <MainScreen />}
        </NavigationContainer>
      </View>
    </>
  )
}
