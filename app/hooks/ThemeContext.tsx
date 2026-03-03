import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'

export const lightStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  tabContentText: {
    fontSize: 20,
    color: '#000000',
  },
  mainContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#f0f4ff',
  },
  tabLabel: {
    fontSize: 12,
    color: '#555555',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    color: '#000000',
  },
})

export const darkStyles = StyleSheet.create({
  ...lightStyles,
  screenContainer: {
    ...lightStyles.screenContainer,
    backgroundColor: '#000000',
  },
  title: {
    ...lightStyles.title,
    color: '#ffffff',
  },
  tabContentText: {
    ...lightStyles.tabContentText,
    color: '#ffffff',
  },
  tabBar: {
    ...lightStyles.tabBar,
    backgroundColor: '#111111',
    borderTopColor: '#222222',
  },
  tabLabel: {
    ...lightStyles.tabLabel,
    color: '#cccccc',
  },
  tabLabelActive: {
    ...lightStyles.tabLabelActive,
    color: '#4da3ff',
  },
  description: {
    ...lightStyles.description,
    color: '#cccccc',
  },
  input: {
    ...lightStyles.input,
    color: '#ffffff',
    borderColor: '#555555',
  },
})

export type ThemeMode = 'light' | 'dark' | 'system'

export type ThemeValue = {
  themeMode: ThemeMode
  styles: typeof lightStyles | typeof darkStyles
  statusBarStyle: 'light-content' | 'dark-content'
  tabBarActiveTintColor: string
  tabBarInactiveTintColor: string
  setThemeMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeValue | undefined>(undefined)

export const useTheme = () => {
  const theme = useContext(ThemeContext)
  if (!theme) {
    throw new Error('useTheme must be used within ThemeContext.Provider')
  }
  return theme
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemPrefersDark = useColorScheme() === 'dark'
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('themeMode')
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeMode(stored)
        }
      } catch {
        // ignore
      }
    }

    void loadTheme()
  }, [])

  const setThemeModeAndPersist = async (mode: ThemeMode) => {
    setThemeMode(mode)
    try {
      await AsyncStorage.setItem('themeMode', mode)
    } catch {
      // ignore
    }
  }

  const value: ThemeValue = useMemo(
    () => ({
      themeMode,
      styles: isDarkMode ? darkStyles : lightStyles,
      statusBarStyle: isDarkMode ? 'light-content' : 'dark-content',
      tabBarActiveTintColor: isDarkMode ? '#4da3ff' : '#007AFF',
      tabBarInactiveTintColor: isDarkMode ? '#ffffff99' : '#555555',
      setThemeMode: setThemeModeAndPersist,
    }),
    [isDarkMode, themeMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
