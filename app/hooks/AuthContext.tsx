import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { NativeModules, TurboModuleRegistry } from 'react-native'

import { apiClient } from '../repositories/api/core/client'

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

const AuthContext = createContext<
  | {
      status: AuthStatus
      token: string | null
      tenants: OAuthTenant[]
      activeTenant: OAuthTenant | null
      setActiveTenant: (tenant: OAuthTenant) => Promise<void>
      signIn: (token: string, tenants?: OAuthTenant[]) => Promise<void>
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
  const [state, setState] = useState<{
    status: AuthStatus
    token: string | null
    tenants: OAuthTenant[]
    activeTenantKey: string | null
  }>({
    status: 'loading',
    token: null,
    tenants: [],
    activeTenantKey: null,
  })

  useEffect(() => {
    const restoreToken = async () => {
      try {
        const [storedToken, storedTenants, storedActiveKey] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('oauthTenants'),
          AsyncStorage.getItem('activeTenantKey'),
        ])
        const tenants = storedTenants ? (JSON.parse(storedTenants) as OAuthTenant[]) : []
        const activeTenantKey =
          storedActiveKey && tenants.some((t) => tenantKey(t) === storedActiveKey)
            ? storedActiveKey
            : (tenants[0] ? tenantKey(tenants[0]) : null)
        const activeTenant = tenants.find((t) => tenantKey(t) === activeTenantKey) ?? null
        apiClient.setActiveServerId(activeTenant?.server_id ?? null)
        apiClient.setActiveFriendId(activeTenant?.friend_id ?? null)
        if (storedToken) {
          setState({ status: 'signedIn', token: storedToken, tenants, activeTenantKey })
        } else {
          setState({ status: 'signedOut', token: null, tenants: [], activeTenantKey: null })
        }
      } catch {
        apiClient.setActiveServerId(null)
        apiClient.setActiveFriendId(null)
        setState({ status: 'signedOut', token: null, tenants: [], activeTenantKey: null })
      }
    }
    void restoreToken()
  }, [])

  const value = useMemo(
    () => ({
      status: state.status,
      token: state.token,
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
      signIn: async (token: string, tenants: OAuthTenant[] = []) => {
        const activeTenantKey = tenants[0] ? tenantKey(tenants[0]) : null
        apiClient.setActiveServerId(tenants[0]?.server_id ?? null)
        apiClient.setActiveFriendId(tenants[0]?.friend_id ?? null)
        setState({ status: 'signedIn', token, tenants, activeTenantKey })
        try {
          await AsyncStorage.setItem('authToken', token)
          await AsyncStorage.setItem('oauthTenants', JSON.stringify(tenants))
          if (activeTenantKey) {
            await AsyncStorage.setItem('activeTenantKey', activeTenantKey)
          } else {
            await AsyncStorage.removeItem('activeTenantKey')
          }
        } catch {
          // ignore
        }
      },
      signOut: async () => {
        try {
          await WebAuthSessionModule.openAuthSession(
            'https://login.lseed.app/logout',
            'login.lseed.app',
            '/app/lstream',
          )
        } catch {
          // ignore
        }
        apiClient.setActiveServerId(null)
        apiClient.setActiveFriendId(null)
        setState({ status: 'signedOut', token: null, tenants: [], activeTenantKey: null })
        try {
          await AsyncStorage.removeItem('authToken')
          await AsyncStorage.removeItem('oauthTenants')
          await AsyncStorage.removeItem('activeTenantKey')
        } catch {
          // ignore
        }
      },
      refreshTenants: async () => {
        try {
          const refreshToken = await apiClient.getRefreshToken()
          if (!refreshToken) return false

          const response = await fetch('https://login.lseed.app/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: '019e9136-9104-71f2-bca4-a7bbdb2fb91d',
              refresh_token: refreshToken,
            }).toString(),
          })
          const tokenResponse = await response.json()
          if (!tokenResponse.access_token) return false

          const newTenants = (tokenResponse.tenants ?? []) as OAuthTenant[]
          const currentActiveKey = state.activeTenantKey
          const newActiveTenantKey =
            currentActiveKey && newTenants.some((t) => tenantKey(t) === currentActiveKey)
              ? currentActiveKey
              : newTenants[0]
                ? tenantKey(newTenants[0])
                : null
          const newActiveTenant = newTenants.find((t) => tenantKey(t) === newActiveTenantKey) ?? null

          apiClient.setActiveServerId(newActiveTenant?.server_id ?? null)
          apiClient.setActiveFriendId(newActiveTenant?.friend_id ?? null)
          await apiClient.setToken(tokenResponse.access_token)
          if (tokenResponse.refresh_token) {
            await apiClient.setRefreshToken(tokenResponse.refresh_token)
          }

          setState({
            status: 'signedIn',
            token: tokenResponse.access_token,
            tenants: newTenants,
            activeTenantKey: newActiveTenantKey,
          })

          try {
            await AsyncStorage.setItem('authToken', tokenResponse.access_token)
            await AsyncStorage.setItem('oauthTenants', JSON.stringify(newTenants))
            if (newActiveTenantKey) {
              await AsyncStorage.setItem('activeTenantKey', newActiveTenantKey)
            } else {
              await AsyncStorage.removeItem('activeTenantKey')
            }
          } catch {
            // ignore
          }
          return true
        } catch {
          return false
        }
      },
    }),
    [state.status, state.token, state.tenants, state.activeTenantKey],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
