import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { NativeModules, TurboModuleRegistry } from 'react-native'

const WebAuthSessionModule = (TurboModuleRegistry.get('WebAuthSessionModule') ??
  NativeModules.WebAuthSessionModule) as {
  openAuthSession: (url: string, host: string, path: string) => Promise<string>
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

const AuthContext = createContext<
  | {
      status: AuthStatus
      token: string | null
      signIn: (token: string) => Promise<void>
      signOut: () => Promise<void>
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
  }>({
    status: 'loading',
    token: null,
  })

  useEffect(() => {
    const restoreToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken')
        if (storedToken) {
          setState({ status: 'signedIn', token: storedToken })
        } else {
          setState({ status: 'signedOut', token: null })
        }
      } catch {
        setState({ status: 'signedOut', token: null })
      }
    }
    void restoreToken()
  }, [])

  const value = useMemo(
    () => ({
      status: state.status,
      token: state.token,
      signIn: async (token: string) => {
        setState({ status: 'signedIn', token })
        try {
          await AsyncStorage.setItem('authToken', token)
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
        setState({ status: 'signedOut', token: null })
        try {
          await AsyncStorage.removeItem('authToken')
        } catch {
          // ignore
        }
      },
    }),
    [state.status, state.token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
