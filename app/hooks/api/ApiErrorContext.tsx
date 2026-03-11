import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { Alert, Linking, Platform } from 'react-native'

import { ApiResponseException, ApiResultCode, AppVersionException } from '../../repositories/api/core/errors'

type ApiErrorContextType = {
  handleError: (error: unknown) => void
}

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
            const storeUrl =
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/idXXXXXXXXXX'
                : 'https://play.google.com/store/apps/details?id=com.yourapp'
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
