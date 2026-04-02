import { useEffect, useState } from 'react'

import { apiRepository } from '../repositories/api'
import type { SettingsResponse } from '../repositories/api/IApiRepository'

const CACHE_DURATION_MS = 5 * 60 * 1000

let cachedSettings: SettingsResponse | null = null
let lastFetchTime: number | null = null
const listeners = new Set<() => void>()

const fetchSettings = async (force = false) => {
  const now = Date.now()
  if (!force && lastFetchTime && now - lastFetchTime < CACHE_DURATION_MS) {
    return
  }
  const data = await apiRepository.getSettings()
  cachedSettings = data
  lastFetchTime = now
  listeners.forEach((fn) => fn())
}

export const useSettings = () => {
  const [settings, setSettings] = useState(cachedSettings)

  useEffect(() => {
    const listener = () => setSettings(cachedSettings)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return settings
}

export const useInitSettings = () => {
  useEffect(() => {
    void fetchSettings(true)
  }, [])
}

export const refetchSettings = () => fetchSettings(false)
