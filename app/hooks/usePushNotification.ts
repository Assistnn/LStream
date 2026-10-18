import notifee, { AndroidImportance } from '@notifee/react-native'
import { getMessaging, getToken, onMessage, onTokenRefresh } from '@react-native-firebase/messaging'
import { useEffect } from 'react'

const PUSH_CHANNEL_ID = 'push'

export const usePushNotification = () => {
  useEffect(() => {
    const messaging = getMessaging()

    const init = async () => {
      await notifee.createChannel({ id: PUSH_CHANNEL_ID, name: 'お知らせ', importance: AndroidImportance.HIGH })
      const token = await getToken(messaging)
      // TODO: 端末登録 API（段階3）ができたらサーバーへ送る。それまでは Firebase コンソールのテスト送信用に開発ビルドでのみ表示する
      if (__DEV__) console.log('[FCM] token:', token)
    }
    void init().catch((e: unknown) => console.warn('[FCM] init failed', e))

    const unsubscribeRefresh = onTokenRefresh(messaging, (token) => {
      if (__DEV__) console.log('[FCM] token refreshed:', token)
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
      unsubscribeRefresh()
      unsubscribeMessage()
    }
  }, [])
}
