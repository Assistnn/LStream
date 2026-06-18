import { sha256 } from 'js-sha256'
import { useCallback, useState } from 'react'
import { NativeModules, TurboModuleRegistry } from 'react-native'

import { apiClient } from '../repositories/api/core/client'
import { useAuth } from './AuthContext'

const WebAuthSessionModule = (TurboModuleRegistry.get('WebAuthSessionModule') ??
  NativeModules.WebAuthSessionModule) as {
  openAuthSession: (url: string, host: string, path: string) => Promise<string>
}

const generateRandom = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const useOAuthLogin = () => {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startLogin = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const state = generateRandom(40)
      const codeVerifier = generateRandom(128)

      const hash = sha256.arrayBuffer(codeVerifier)
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const params = new URLSearchParams({
        client_id: '019e9136-9104-71f2-bca4-a7bbdb2fb91d',
        redirect_uri: 'https://login.lseed.app/app/lstream',
        response_type: 'code',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })

      const callbackUrl: string = await WebAuthSessionModule.openAuthSession(
        `https://login.lseed.app/oauth/authorize?${params.toString()}`,
        'login.lseed.app',
        '/app/lstream',
      )

      const callbackParams = new URL(callbackUrl).searchParams
      const code = callbackParams.get('code')
      const returnedState = callbackParams.get('state')

      if (!code || returnedState !== state) {
        setError('認証に失敗しました')
        return
      }

      const response = await fetch('https://login.lseed.app/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: '019e9136-9104-71f2-bca4-a7bbdb2fb91d',
          code_verifier: codeVerifier,
          redirect_uri: 'https://login.lseed.app/app/lstream',
          code,
        }).toString(),
      })
      const tokenResponse = await response.json()
      console.log('[OAuth] tenants:', tokenResponse.tenants)

      if (!tokenResponse.access_token) {
        setError('トークンの取得に失敗しました')
        return
      }

      await apiClient.setToken(tokenResponse.access_token)
      if (tokenResponse.refresh_token) {
        await apiClient.setRefreshToken(tokenResponse.refresh_token)
      }
      await signIn(tokenResponse.access_token, tokenResponse.tenants ?? [])
    } catch (e: unknown) {
      if (e instanceof Error && (e.message?.includes('cancelled') || e.message?.includes('USER_CANCELLED'))) return
      setError('認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [signIn])

  return { startLogin, loading, error }
}
