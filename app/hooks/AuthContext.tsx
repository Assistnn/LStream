import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Alert, NativeModules, TurboModuleRegistry } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import { apiRepository } from '../repositories/api'
import { apiClient } from '../repositories/api/core/client'
import { OAUTH_CONFIG } from '../repositories/api/core/config'

const WebAuthSessionModule = (TurboModuleRegistry.get('WebAuthSessionModule') ??
  NativeModules.WebAuthSessionModule) as {
  openAuthSession: (url: string, host: string, path: string) => Promise<string>
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

export type OAuthTenant = {
  account: string
  server_id: string
  friend_id: number
  email: string
  first_name: string
  last_name: string
}

const tenantKey = (t: OAuthTenant) => `${t.account}-${t.server_id}`

type AuthState = {
  status: AuthStatus
  tenants: OAuthTenant[]
  activeTenantKey: string | null
}

const SIGNED_OUT: AuthState = { status: 'signedOut', tenants: [], activeTenantKey: null }

// テナント一覧を受け取り、今のテナントが残っていればそのまま、無ければ先頭を選ぶ
const withTenants = (tenants: OAuthTenant[], currentKey: string | null): AuthState => {
  const activeTenantKey =
    currentKey && tenants.some((t) => tenantKey(t) === currentKey)
      ? currentKey
      : tenants[0]
        ? tenantKey(tenants[0])
        : null
  const activeTenant = tenants.find((t) => tenantKey(t) === activeTenantKey) ?? null
  apiClient.setActiveServerId(activeTenant?.server_id ?? null)
  apiClient.setActiveFriendId(activeTenant?.friend_id ?? null)
  return { status: 'signedIn', tenants, activeTenantKey }
}

const saveTenants = async ({ tenants, activeTenantKey }: AuthState) => {
  try {
    await AsyncStorage.setItem('oauthTenants', JSON.stringify(tenants))
    if (activeTenantKey) {
      await AsyncStorage.setItem('activeTenantKey', activeTenantKey)
    } else {
      await AsyncStorage.removeItem('activeTenantKey')
    }
  } catch {
    // ignore
  }
}

const clearSession = async () => {
  apiClient.setActiveServerId(null)
  apiClient.setActiveFriendId(null)
  await apiClient.clearTokens()
  try {
    await AsyncStorage.multiRemove(['oauthTenants', 'activeTenantKey'])
  } catch {
    // ignore
  }
}

const AuthContext = createContext<
  | {
      status: AuthStatus
      tenants: OAuthTenant[]
      activeTenant: OAuthTenant | null
      setActiveTenant: (tenant: OAuthTenant) => Promise<void>
      signIn: (tenants?: OAuthTenant[]) => Promise<void>
      signOut: () => Promise<void>
      refreshTenants: () => Promise<boolean>
    }
  | undefined
>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: 'loading', tenants: [], activeTenantKey: null })

  useEffect(() => {
    const restoreToken = async () => {
      try {
        const [storedToken, storedTenants, storedActiveKey] = await Promise.all([
          apiClient.getToken(),
          AsyncStorage.getItem('oauthTenants'),
          AsyncStorage.getItem('activeTenantKey'),
        ])
        if (!storedToken) {
          apiClient.setActiveServerId(null)
          apiClient.setActiveFriendId(null)
          setState(SIGNED_OUT)
          return
        }
        setState(withTenants(storedTenants ? (JSON.parse(storedTenants) as OAuthTenant[]) : [], storedActiveKey))
      } catch {
        apiClient.setActiveServerId(null)
        apiClient.setActiveFriendId(null)
        setState(SIGNED_OUT)
      }
    }
    void restoreToken()
  }, [])

  useEffect(() => {
    apiClient.setAuthListener({
      onTokensRefreshed: (tenants) => {
        setState((prev) => {
          if (prev.status !== 'signedIn') return prev
          const next = withTenants(tenants as OAuthTenant[], prev.activeTenantKey)
          void saveTenants(next)
          return next
        })
      },
      onSessionExpired: () => {
        void clearSession()
        setState(SIGNED_OUT)
        Alert.alert('ログインの有効期限が切れました', 'もう一度ログインしてください')
      },
    })
    return () => apiClient.setAuthListener(null)
  }, [])

  const value = useMemo(
    () => ({
      status: state.status,
      tenants: state.tenants,
      activeTenant: state.tenants.find((t) => tenantKey(t) === state.activeTenantKey) ?? null,
      setActiveTenant: async (tenant: OAuthTenant) => {
        const key = tenantKey(tenant)
        apiClient.setActiveServerId(tenant.server_id ?? null)
        apiClient.setActiveFriendId(tenant.friend_id ?? null)
        setState((prev) => ({ ...prev, activeTenantKey: key }))
        try {
          await AsyncStorage.setItem('activeTenantKey', key)
        } catch {
          // ignore
        }
      },
      // トークンは useOAuthLogin が apiClient.setTokens で保存済み
      signIn: async (tenants: OAuthTenant[] = []) => {
        const next = withTenants(tenants, null)
        setState(next)
        await saveTenants(next)
      },
      signOut: async () => {
        // ログアウト後にこの会員宛ての通知が届かないよう、トークンを消す前に端末の結びつきを外す
        try {
          await apiRepository.unregisterDevice(await DeviceInfo.getUniqueId())
        } catch {
          // ignore
        }
        // この端末のアクセストークン・リフレッシュトークンをログインサーバーで失効させる
        await apiClient.revokeTokens()
        try {
          await WebAuthSessionModule.openAuthSession(
            `${OAUTH_CONFIG.baseURL}/logout`,
            OAUTH_CONFIG.host,
            OAUTH_CONFIG.callbackPath,
          )
        } catch {
          // ignore
        }
        await clearSession()
        setState(SIGNED_OUT)
      },
      // テナント追加の後に、トークンを更新して最新のテナント一覧を受け取る（一覧は onTokensRefreshed で反映）
      refreshTenants: () => apiClient.refreshToken(),
    }),
    [state.status, state.tenants, state.activeTenantKey],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
