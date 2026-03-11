import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ThemeMode } from '../../hooks/ThemeContext'

const KEYS = {
  THEME_MODE: 'themeMode',
  SHOW_NEXT_EPISODE: 'showNextEpisode',
  HISTORY_RETENTION_DAYS: 'historyRetentionDays',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  MOBILE_DATA_ENABLED: 'mobileDataEnabled',
} as const

export const StorageRepository = {
  async getThemeMode(): Promise<ThemeMode> {
    try {
      const value = await AsyncStorage.getItem(KEYS.THEME_MODE)
      if (value === 'light' || value === 'dark' || value === 'system') {
        return value
      }
      return 'system'
    } catch (error) {
      console.error('Failed to get themeMode:', error)
      return 'system'
    }
  },

  async setThemeMode(mode: ThemeMode) {
    try {
      await AsyncStorage.setItem(KEYS.THEME_MODE, mode)
    } catch (error) {
      console.error('Failed to set themeMode:', error)
    }
  },
  async getShowNextEpisode() {
    try {
      const value = await AsyncStorage.getItem(KEYS.SHOW_NEXT_EPISODE)
      return value === null ? true : (JSON.parse(value) as boolean)
    } catch (error) {
      console.error('Failed to get showNextEpisode:', error)
      return true
    }
  },

  async setShowNextEpisode(value: boolean) {
    try {
      await AsyncStorage.setItem(KEYS.SHOW_NEXT_EPISODE, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set showNextEpisode:', error)
    }
  },

  async getHistoryRetentionDays() {
    try {
      const value = await AsyncStorage.getItem(KEYS.HISTORY_RETENTION_DAYS)
      return value !== null ? parseInt(value, 10) : 30
    } catch (error) {
      console.error('Failed to get historyRetentionDays:', error)
      return 30
    }
  },

  async setHistoryRetentionDays(days: number) {
    try {
      await AsyncStorage.setItem(KEYS.HISTORY_RETENTION_DAYS, days.toString())
    } catch (error) {
      console.error('Failed to set historyRetentionDays:', error)
    }
  },

  async getNotificationsEnabled() {
    try {
      const value = await AsyncStorage.getItem(KEYS.NOTIFICATIONS_ENABLED)
      return value === null ? false : (JSON.parse(value) as boolean)
    } catch (error) {
      console.error('Failed to get notificationsEnabled:', error)
      return false
    }
  },

  async setNotificationsEnabled(value: boolean) {
    try {
      await AsyncStorage.setItem(KEYS.NOTIFICATIONS_ENABLED, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set notificationsEnabled:', error)
    }
  },

  async getMobileDataEnabled() {
    try {
      const value = await AsyncStorage.getItem(KEYS.MOBILE_DATA_ENABLED)
      return value === null ? false : (JSON.parse(value) as boolean)
    } catch (error) {
      console.error('Failed to get mobileDataEnabled:', error)
      return false
    }
  },

  async setMobileDataEnabled(value: boolean) {
    try {
      await AsyncStorage.setItem(KEYS.MOBILE_DATA_ENABLED, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set mobileDataEnabled:', error)
    }
  },

  async getAllSettings() {
    const [showNextEpisode, historyRetentionDays, notificationsEnabled, mobileDataEnabled] = await Promise.all([
      this.getShowNextEpisode(),
      this.getHistoryRetentionDays(),
      this.getNotificationsEnabled(),
      this.getMobileDataEnabled(),
    ])

    return {
      showNextEpisode,
      historyRetentionDays,
      notificationsEnabled,
      mobileDataEnabled,
    }
  },
}
