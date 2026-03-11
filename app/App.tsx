import { NavigationContainer } from '@react-navigation/native'
import { useContext } from 'react'
import { StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'

import { ApiErrorProvider } from './hooks/api/ApiErrorContext'
import { AuthProvider, useAuth } from './hooks/AuthContext'
import { ThemeContext, ThemeProvider } from './hooks/ThemeContext'
import { LoginScreen } from './screens/login'
import { MainScreen } from './screens/main'
import { SplashScreen } from './screens/splash'

enableScreens()

export default () => (
  <ThemeProvider>
    <SafeAreaProvider>
      <ApiErrorProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ApiErrorProvider>
    </SafeAreaProvider>
  </ThemeProvider>
)

const AppContent = () => {
  const { styles, statusBarStyle } = useContext(ThemeContext)!
  const { status } = useAuth()
  return (
    <>
      <StatusBar barStyle={statusBarStyle} />
      <View
        style={{
          flex: 1,
          backgroundColor: styles.screenContainer.backgroundColor,
        }}
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
