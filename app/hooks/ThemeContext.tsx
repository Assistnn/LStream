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
    navBar: '#FFFFFF',
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
    accent: '#C084FC',
    accentBackground: 'rgba(88, 28, 135, 0.3)',
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
    navBar: '#1F2937',
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
    accent: '#C084FC',
    accentBackground: 'rgba(88, 28, 135, 0.3)',
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
    '6xl': 64,
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
  '3xl': 20,
  '4xl': 24,
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
    paddingBottom: spacing.xl,
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
  // Title系（text色 - 見出し・強調したいテキスト）
  text3xl: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  text2xl: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  textXl: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  titleLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },
  titleMedium: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.text,
  },
  titleLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.light.text,
  },

  // General系（text色 - 一般テキスト）
  textDefault: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.text,
  },
  textBold: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.light.text,
  },

  // Body系（textSecondary色 - 本文・補足情報・メタ情報）
  bodyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.textSecondary,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.textSecondary,
  },
  bodyTiny: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.light.textSecondary,
  },

  // Link系（primary色 - アクション可能）
  linkText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.light.primary,
  },

  // - Buttons
  button: {
    backgroundColor: '#111827',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: '#111827',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonTertiary: {
    backgroundColor: colors.light.card,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTertiaryText: {
    color: colors.light.cardForeground,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },

  // - Inputs
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.light.input,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  inputFocused: {
    borderColor: colors.light.primary,
  },
  inputText: {
    fontSize: typography.fontSize.base,
    color: colors.light.inputForeground,
  },

  // -Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.light.navBar,
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
  text3xl: {
    ...lightStyles.text3xl,
    color: colors.dark.text,
  },
  text2xl: {
    ...lightStyles.text2xl,
    color: colors.dark.text,
  },
  textXl: {
    ...lightStyles.textXl,
    color: colors.dark.text,
  },
  titleLarge: {
    ...lightStyles.titleLarge,
    color: colors.dark.text,
  },
  titleMedium: {
    ...lightStyles.titleMedium,
    color: colors.dark.text,
  },
  titleLabel: {
    ...lightStyles.titleLabel,
    color: colors.dark.text,
  },
  textDefault: {
    ...lightStyles.textDefault,
    color: colors.dark.text,
  },
  textBold: {
    ...lightStyles.textBold,
    color: colors.dark.text,
  },
  bodyText: {
    ...lightStyles.bodyText,
    color: colors.dark.textSecondary,
  },
  bodySmall: {
    ...lightStyles.bodySmall,
    color: colors.dark.textSecondary,
  },
  bodyTiny: {
    ...lightStyles.bodyTiny,
    color: colors.dark.textSecondary,
  },
  linkText: {
    ...lightStyles.linkText,
    color: colors.dark.primary,
  },

  // - Buttons
  button: {
    ...lightStyles.button,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    ...lightStyles.buttonText,
    color: '#111827',
  },
  buttonSecondary: {
    ...lightStyles.buttonSecondary,
    backgroundColor: '#1F2937',
  },
  buttonSecondaryText: {
    ...lightStyles.buttonSecondaryText,
    color: '#FFFFFF',
  },
  buttonTertiary: {
    ...lightStyles.buttonTertiary,
    backgroundColor: colors.dark.card,
  },
  buttonTertiaryText: {
    ...lightStyles.buttonTertiaryText,
    color: colors.dark.cardForeground,
  },

  // - Inputs
  input: {
    ...lightStyles.input,
    backgroundColor: colors.dark.input,
    borderColor: colors.dark.border,
  },
  inputFocused: {
    ...lightStyles.inputFocused,
  },
  inputText: {
    ...lightStyles.inputText,
    color: colors.dark.inputForeground,
  },

  // - Tab Bar
  tabBar: {
    ...lightStyles.tabBar,
    borderTopColor: colors.dark.border,
    backgroundColor: colors.dark.navBar,
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
