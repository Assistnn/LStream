import notifee, { AndroidImportance } from '@notifee/react-native'
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
} from '@react-native-firebase/messaging'
import { useEffect } from 'react'
import DeviceInfo from 'react-native-device-info'

import { apiRepository } from '../repositories/api'
import { useAuth } from './AuthContext'

const PUSH_CHANNEL_ID = 'push'

const registerDevice = async (token: string) => {
  const status = await hasPermission(getMessaging())
  await apiRepository.registerDevice({
    installation_id: await DeviceInfo.getUniqueId(),
    push_token: token,
    push_enabled: status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL,
  })
}

export const usePushNotification = () => {
  const { status, activeTenant } = useAuth()
  const signedIn = status === 'signedIn' && activeTenant !== null

  useEffect(() => {
    const messaging = getMessaging()

    void notifee
      .createChannel({ id: PUSH_CHANNEL_ID, name: 'お知らせ', importance: AndroidImportance.HIGH })
      .catch((e: unknown) => console.warn('[FCM] channel failed', e))

    // アプリ表示中は OS が通知を出さないため、notifee で表示する
    return onMessage(messaging, async (message) => {
      if (!message.notification) return
      await notifee.displayNotification({
        title: message.notification.title,
        body: message.notification.body,
        data: message.data,
        android: { channelId: PUSH_CHANNEL_ID, pressAction: { id: 'default' } },
      })
    })
  }, [])

  // 端末は会員単位で登録する（どのテナントのサーバーから登録しても同じ端末の行が更新される）
  useEffect(() => {
    if (!signedIn) return
    const messaging = getMessaging()

    void getToken(messaging)
      .then(async (token) => {
        if (__DEV__) console.log('[FCM] token:', token)
        await registerDevice(token)
      })
      .catch((e: unknown) => console.warn('[FCM] register failed', e))

    return onTokenRefresh(messaging, (token) => {
      void registerDevice(token).catch((e: unknown) => console.warn('[FCM] register failed', e))
    })
  }, [signedIn])
}
