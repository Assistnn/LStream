import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'

import { StorageRepository } from '../repositories/storage'

// Color Palette (Based on Figma Make design system)
export const colors = {
  light: {
    // Base colors
    background: '#FFFFFF',
    foreground: '#030213',

    // Surface colors
    card: '#FFFFFF',
    cardForeground: '#030213',

    // UI elements
    primary: '#2563EB', // Blue-600
    primaryLight: '#60A5FA', // Blue-400
    primaryForeground: '#FFFFFF',
    secondary: '#F3F4F6', // Gray-100
    secondaryForeground: '#030213',
    muted: '#ECECF0',
    mutedForeground: '#717182',
    accent: '#8B5CF6',
    accentForeground: '#030213',
    destructive: '#DC2626', // Red-600
    destructiveForeground: '#FFFFFF',

    // Border & Input
    border: 'rgba(0, 0, 0, 0.1)',
    input: '#F3F3F5',
    inputForeground: '#030213',
    ring: '#B4B4BA',

    // Text colors
    text: '#030213',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Status bar
    statusBar: 'dark-content' as const,

    // Tab bar
    tabBarActive: '#2563EB',
    tabBarInactive: '#717182',

    // Overlay & Badge
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(255, 255, 255, 0.9)',
  },
  dark: {
    // Base colors
    background: '#111827', // Gray-900
    foreground: '#F9FAFB',

    // Surface colors
    card: '#1F2937', // Gray-800
    cardForeground: '#F9FAFB',

    // UI elements
    primary: '#3B82F6', // Blue-500
    primaryLight: '#60A5FA', // Blue-400
    primaryForeground: '#FFFFFF',
    secondary: '#374151', // Gray-700
    secondaryForeground: '#F9FAFB',
    muted: '#374151',
    mutedForeground: '#B4B4BA',
    accent: '#8B5CF6',
    accentForeground: '#F9FAFB',
    destructive: '#EF4444', // Red-500
    destructiveForeground: '#FFFFFF',

    // Border & Input
    border: '#374151',
    input: '#374151',
    inputForeground: '#F9FAFB',
    ring: '#6B7280',

    // Text colors
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#9CA3AF',

    // Status bar
    statusBar: 'light-content' as const,

    // Tab bar
    tabBarActive: '#60A5FA', // Blue-400
    tabBarInactive: '#B4B4BA',

    // Overlay & Badge
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(255, 255, 255, 0.9)',
  },
}

// Typography
const typography = {
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 40,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
}

// Spacing
const spacing = {
  xxs: 2,
  xs: 4,
  '2xs': 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
  '9xl': 120,
}

// Border Radius
const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  full: 9999,
}

// Light Theme Styles
export const lightStyles = StyleSheet.create({
  // - Containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexDirection: 'column',
    gap: spacing.xl,
  },

  // - Controls
  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.card,
  },

  // - Typography
  // ページ自体のタイトル
  textTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  // セクション・区切りのタイトル
  textSubtitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  // カードの中とかコンテンツのタイトル
  textContentTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  textContentTitleSmall: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  textBody: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.textSecondary,
  },
  textCaption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.textSecondary,
  },
  textAccent: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.primary,
  },

  // ----------- この下未整理

  // - Buttons
  button: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.light.primaryForeground,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonSecondary: {
    backgroundColor: colors.light.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.light.secondaryForeground,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: colors.light.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // - Inputs
  input: {
    backgroundColor: colors.light.input,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.light.inputForeground,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  inputFocused: {
    borderColor: colors.light.ring,
  },

  // -Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.light.card,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.light.tabBarActive,
    fontWeight: typography.fontWeight.semibold,
  },
})

// Dark Theme Styles
export const darkStyles = StyleSheet.create({
  ...lightStyles,
  // - Containers
  screenContainer: {
    ...lightStyles.screenContainer,
    backgroundColor: colors.dark.background,
  },

  // - Controls
  card: {
    ...lightStyles.card,
    backgroundColor: colors.dark.card,
    borderColor: colors.dark.border,
  },

  // - Typography
  textTitle: {
    ...lightStyles.textTitle,
    color: colors.dark.text,
  },
  textSubtitle: {
    ...lightStyles.textSubtitle,
    color: colors.dark.text,
  },
  textContentTitle: {
    ...lightStyles.textContentTitle,
    color: colors.dark.text,
  },
  textContentTitleSmall: {
    ...lightStyles.textContentTitleSmall,
    color: colors.dark.text,
  },
  textBody: {
    ...lightStyles.textBody,
    color: colors.dark.textSecondary,
  },
  textCaption: {
    ...lightStyles.textCaption,
    color: colors.dark.textSecondary,
  },
  textAccent: {
    ...lightStyles.textAccent,
    color: colors.dark.primary,
  },

  // ----------- この下未整理

  // - Buttons
  button: {
    ...lightStyles.button,
    backgroundColor: colors.dark.primary,
  },
  buttonText: {
    ...lightStyles.buttonText,
    color: colors.dark.primaryForeground,
  },
  buttonSecondary: {
    ...lightStyles.buttonSecondary,
    backgroundColor: colors.dark.secondary,
  },
  buttonSecondaryText: {
    ...lightStyles.buttonSecondaryText,
    color: colors.dark.secondaryForeground,
  },
  buttonOutline: {
    ...lightStyles.buttonOutline,
    borderColor: colors.dark.border,
  },
  buttonOutlineText: {
    ...lightStyles.buttonOutlineText,
    color: colors.dark.text,
  },

  // - Inputs
  input: {
    ...lightStyles.input,
    backgroundColor: colors.dark.input,
    color: colors.dark.inputForeground,
    borderColor: colors.dark.border,
  },
  inputFocused: {
    borderColor: colors.dark.primary,
  },

  // - Tab Bar
  tabBar: {
    ...lightStyles.tabBar,
    borderTopColor: colors.dark.border,
    backgroundColor: colors.dark.card,
  },
  tabLabelActive: {
    ...lightStyles.tabLabelActive,
    color: colors.dark.tabBarActive,
  },
})

// Export theme tokens for direct use
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
}

export type ThemeMode = 'light' | 'dark' | 'system'

export type ThemeValue = {
  themeMode: ThemeMode
  isDark: boolean
  styles: typeof lightStyles | typeof darkStyles
  colors: typeof colors.light | typeof colors.dark
  typography: typeof typography
  spacing: typeof spacing
  borderRadius: typeof borderRadius
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
      const mode = await StorageRepository.getThemeMode()
      setThemeMode(mode)
    }

    void loadTheme()
  }, [])

  const setThemeModeAndPersist = async (mode: ThemeMode) => {
    setThemeMode(mode)
    await StorageRepository.setThemeMode(mode)
  }

  const value: ThemeValue = useMemo(
    () => ({
      themeMode,
      isDark: isDarkMode,
      styles: isDarkMode ? darkStyles : lightStyles,
      colors: isDarkMode ? colors.dark : colors.light,
      typography,
      spacing,
      borderRadius,
      statusBarStyle: isDarkMode ? colors.dark.statusBar : colors.light.statusBar,
      tabBarActiveTintColor: isDarkMode ? colors.dark.tabBarActive : colors.light.tabBarActive,
      tabBarInactiveTintColor: isDarkMode ? colors.dark.tabBarInactive : colors.light.tabBarInactive,
      setThemeMode: setThemeModeAndPersist,
    }),
    [isDarkMode, themeMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
