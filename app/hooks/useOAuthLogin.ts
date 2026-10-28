import { sha256 } from 'js-sha256'
import { useCallback, useState } from 'react'
import { NativeModules, TurboModuleRegistry } from 'react-native'

import type { OAuthTokenResponse } from '../repositories/api/core/client'
import { apiClient } from '../repositories/api/core/client'
import { OAUTH_CONFIG } from '../repositories/api/core/config'
import type { OAuthTenant } from './AuthContext'
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

  const startAuth = useCallback(async (mode: 'login' | 'register' = 'login') => {
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
        client_id: OAUTH_CONFIG.clientId,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        response_type: 'code',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        ...(mode === 'register' ? { screen: 'register' } : {}),
      })

      const callbackUrl: string = await WebAuthSessionModule.openAuthSession(
        `${OAUTH_CONFIG.baseURL}/oauth/authorize?${params.toString()}`,
        OAUTH_CONFIG.host,
        OAUTH_CONFIG.callbackPath,
      )

      const callbackParams = new URL(callbackUrl).searchParams
      const code = callbackParams.get('code')
      const returnedState = callbackParams.get('state')

      if (!code || returnedState !== state) {
        setError('認証に失敗しました')
        return
      }

      const response = await fetch(`${OAUTH_CONFIG.baseURL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: OAUTH_CONFIG.clientId,
          code_verifier: codeVerifier,
          redirect_uri: OAUTH_CONFIG.redirectUri,
          code,
        }).toString(),
      })
      const tokenResponse = (await response.json()) as OAuthTokenResponse
      if (__DEV__) {
        console.log('[OAuth] tenants:', tokenResponse.tenants)
      }

      if (!tokenResponse.access_token) {
        setError('トークンの取得に失敗しました')
        return
      }

      await apiClient.setTokens({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? null,
      })
      await signIn((tokenResponse.tenants ?? []) as OAuthTenant[])
    } catch (e: unknown) {
      if (e instanceof Error && (e.message?.includes('cancelled') || e.message?.includes('USER_CANCELLED'))) return
      setError('認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [signIn])

  return {
    startLogin: useCallback(() => startAuth('login'), [startAuth]),
    startSignup: useCallback(() => startAuth('register'), [startAuth]),
    loading,
    error,
  }
}
