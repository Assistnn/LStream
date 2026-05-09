import notifee from '@notifee/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useContext, useEffect } from 'react'
import { StatusBar, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'

import { ensureChannel } from './hooks/alarmService'
import { ApiErrorProvider } from './hooks/api/ApiErrorContext'
import { AuthProvider, useAuth } from './hooks/AuthContext'
import { PlayerProvider } from './hooks/PlayerContext'
import { ThemeContext, ThemeProvider } from './hooks/ThemeContext'
import { useAlarmHandler } from './hooks/useAlarmHandler'
import { LoginScreen } from './screens/login'
import { MainScreen } from './screens/main'
import { SplashScreen } from './screens/splash'

enableScreens()

export default () => (
  <ThemeProvider>
    <SafeAreaProvider>
      <ApiErrorProvider>
        <AuthProvider>
          <PlayerProvider>
            <AlarmHandler />
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </ApiErrorProvider>
    </SafeAreaProvider>
  </ThemeProvider>
)

const AlarmHandler = () => {
  useEffect(() => {
    void notifee.requestPermission()
    void ensureChannel()
  }, [])
  useAlarmHandler()
  return null
}

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
