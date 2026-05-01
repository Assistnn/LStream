import { useCallback, useState } from 'react'
import { authorize } from 'react-native-app-auth'

import { apiClient } from '../repositories/api/core/client'
import { useAuth } from './AuthContext'

export const useOAuthLogin = () => {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startLogin = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await authorize({
        clientId: '019d4cf4-5131-7013-a558-a03999a25318',
        redirectUrl: 'https://login.lseed.app/app/lstream',
        scopes: [],
        serviceConfiguration: {
          authorizationEndpoint: 'https://login.lseed.app/oauth/authorize',
          tokenEndpoint: 'https://login.lseed.app/oauth/token',
        },
        usePKCE: true,
      })

      await apiClient.setToken(result.accessToken)
      if (result.refreshToken) {
        await apiClient.setRefreshToken(result.refreshToken)
      }
      await signIn(result.accessToken)
    } catch {
      setError('認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [signIn])

  return { startLogin, loading, error }
}
