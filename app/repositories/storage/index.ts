import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ThemeMode } from '../../hooks/ThemeContext'

export type LoopMode = 'off' | 'single' | 'all'

const KEYS = {
  THEME_MODE: 'themeMode',
  SHOW_NEXT_EPISODE: 'showNextEpisode',
  HISTORY_RETENTION_DAYS: 'historyRetentionDays',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  MOBILE_DATA_ENABLED: 'mobileDataEnabled',
  PLAYBACK_RATE: 'playbackRate',
  LOOP_MODE: 'loopMode',
  IS_SHUFFLE_ON: 'isShuffleOn',
  PLAYED_ITEM_IDS: 'playedItemIds',
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

  async getPlaybackRate(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(KEYS.PLAYBACK_RATE)
      return value !== null ? parseFloat(value) : 1.0
    } catch (error) {
      console.error('Failed to get playbackRate:', error)
      return 1.0
    }
  },

  async setPlaybackRate(rate: number) {
    try {
      await AsyncStorage.setItem(KEYS.PLAYBACK_RATE, rate.toString())
    } catch (error) {
      console.error('Failed to set playbackRate:', error)
    }
  },

  async getLoopMode(): Promise<LoopMode> {
    try {
      const value = await AsyncStorage.getItem(KEYS.LOOP_MODE)
      if (value === 'off' || value === 'single' || value === 'all') return value
      return 'off'
    } catch (error) {
      console.error('Failed to get loopMode:', error)
      return 'off'
    }
  },

  async setLoopMode(mode: LoopMode) {
    try {
      await AsyncStorage.setItem(KEYS.LOOP_MODE, mode)
    } catch (error) {
      console.error('Failed to set loopMode:', error)
    }
  },

  async getIsShuffleOn(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.IS_SHUFFLE_ON)
      return value === null ? false : (JSON.parse(value) as boolean)
    } catch (error) {
      console.error('Failed to get isShuffleOn:', error)
      return false
    }
  },

  async setIsShuffleOn(value: boolean) {
    try {
      await AsyncStorage.setItem(KEYS.IS_SHUFFLE_ON, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set isShuffleOn:', error)
    }
  },

  async getPlayedItemIds(): Promise<number[]> {
    try {
      const value = await AsyncStorage.getItem(KEYS.PLAYED_ITEM_IDS)
      return value ? (JSON.parse(value) as number[]) : []
    } catch (error) {
      console.error('Failed to get playedItemIds:', error)
      return []
    }
  },

  async addPlayedItemId(itemId: number) {
    try {
      const ids = await this.getPlayedItemIds()
      if (!ids.includes(itemId)) {
        ids.push(itemId)
        await AsyncStorage.setItem(KEYS.PLAYED_ITEM_IDS, JSON.stringify(ids))
      }
      return ids
    } catch (error) {
      console.error('Failed to add playedItemId:', error)
      return []
    }
  },

  async getPlayerSettings() {
    const [playbackRate, loopMode, isShuffleOn] = await Promise.all([
      this.getPlaybackRate(),
      this.getLoopMode(),
      this.getIsShuffleOn(),
    ])
    return { playbackRate, loopMode, isShuffleOn }
  },

  async savePlayerSettings(settings: { playbackRate: number; loopMode: LoopMode; isShuffleOn: boolean }) {
    await Promise.all([
      this.setPlaybackRate(settings.playbackRate),
      this.setLoopMode(settings.loopMode),
      this.setIsShuffleOn(settings.isShuffleOn),
    ])
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
