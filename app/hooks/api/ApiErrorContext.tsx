import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { Alert, Linking, Platform } from 'react-native'

import { ApiResponseException, ApiResultCode, AppVersionException } from '../../repositories/api/core/errors'

type ApiErrorContextType = {
  handleError: (error: unknown) => void
}

// アップデートが必要なときに開くストアのページ
// App Store は国の指定（/us/ 等）を付けず、端末の国のストアを開かせる
const IOS_STORE_URL = 'https://apps.apple.com/app/id6806906910'
// Google Play はアプリ ID（applicationId）で決まる。公開後に正式な URL を確認して差し替える
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=jp.lseed.lstream'

const ApiErrorContext = createContext<ApiErrorContextType | undefined>(undefined)

export const useApiError = () => {
  const context = useContext(ApiErrorContext)
  if (!context) {
    throw new Error('useApiError must be used within ApiErrorProvider')
  }
  return context
}

export const ApiErrorProvider = ({ children }: { children: ReactNode }) => {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof AppVersionException) {
      Alert.alert('アップデートが必要です', `バージョン ${error.necessaryVersion} 以上が必要です`, [
        {
          text: 'アップデート',
          onPress: () => {
            const storeUrl = Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL
            void Linking.openURL(storeUrl)
          },
        },
      ])
      return
    }

    if (error instanceof ApiResponseException) {
      if (error.result === ApiResultCode.ErrorWithAlert) {
        Alert.alert(error.title || 'エラー', error.message)
        return
      }

      if (error.result === ApiResultCode.ErrorNoAlert) {
        console.warn('API Error (no alert):', error.message)
        return
      }

      if (error.result === ApiResultCode.TokenError) {
        console.warn('Token error handled automatically')
        return
      }
    }

    console.error('Unexpected error:', error)
    Alert.alert('エラー', 'エラーが発生しました。しばらくしてからもう一度お試しください。')
  }, [])

  const value = useMemo(() => ({ handleError }), [handleError])

  return <ApiErrorContext.Provider value={value}>{children}</ApiErrorContext.Provider>
}
