import notifee, { AndroidImportance, EventType } from '@notifee/react-native'
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging'
import { useEffect } from 'react'
import { Linking } from 'react-native'
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

// LSEED のアプリ通知で設定した「タップしたときに開く URL」を開く
const openLink = (data: { [key: string]: unknown } | undefined) => {
  const link = typeof data?.link === 'string' ? data.link : ''
  if (!/^https?:\/\//.test(link)) return
  void Linking.openURL(link).catch((e: unknown) => console.warn('[FCM] open link failed', e))
}

export const usePushNotification = () => {
  const { status, activeTenant } = useAuth()
  const signedIn = status === 'signedIn' && activeTenant !== null

  useEffect(() => {
    const messaging = getMessaging()

    void notifee
      .createChannel({ id: PUSH_CHANNEL_ID, name: 'お知らせ', importance: AndroidImportance.HIGH })
      .catch((e: unknown) => console.warn('[FCM] channel failed', e))

    // アプリを閉じていた・裏にあったときに通知をタップして開いた場合
    void getInitialNotification(messaging).then((message) => openLink(message?.data))
    const unsubscribeOpened = onNotificationOpenedApp(messaging, (message) => openLink(message.data))
    // アプリ表示中に notifee で出した通知をタップした場合
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) openLink(detail.notification?.data)
    })

    // アプリ表示中は OS が通知を出さないため、notifee で表示する
    const unsubscribeMessage = onMessage(messaging, async (message) => {
      if (!message.notification) return
      await notifee.displayNotification({
        title: message.notification.title,
        body: message.notification.body,
        data: message.data,
        android: { channelId: PUSH_CHANNEL_ID, pressAction: { id: 'default' } },
      })
    })

    return () => {
      unsubscribeOpened()
      unsubscribeForeground()
      unsubscribeMessage()
    }
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
