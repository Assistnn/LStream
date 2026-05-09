/**
 * @format
 */

import notifee, { EventType } from '@notifee/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppRegistry } from 'react-native'

import App from './App'
import { name as appName } from './app.json'

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail.notification?.data
  if (!data?.playlistId) return

  if (type === EventType.PRESS || type === EventType.DELIVERED) {
    await AsyncStorage.setItem(
      '@alarm/pendingPlay',
      JSON.stringify({ playlistId: data.playlistId, random: data.random }),
    )
  }
})

AppRegistry.registerComponent(appName, () => App)
