import { useEffect, useState } from 'react'

import { useAuth } from '../hooks/AuthContext'
import { apiRepository } from '../repositories/api'
import type { FavoritesResponse } from '../repositories/api/IApiRepository'

const CACHE_DURATION_MS = 5 * 60 * 1000

let cachedFavorites: FavoritesResponse | null = null
let lastFetchTime: number | null = null
const listeners = new Set<() => void>()

const fetchFavorites = async (force = false) => {
  const now = Date.now()
  if (!force && lastFetchTime && now - lastFetchTime < CACHE_DURATION_MS) {
    return
  }
  const data = await apiRepository.getFavorites()
  cachedFavorites = data
  lastFetchTime = now
  listeners.forEach((fn) => fn())
}

export const useGetFavorites = () => {
  const [favorites, setFavorites] = useState(cachedFavorites)

  useEffect(() => {
    const listener = () => setFavorites(cachedFavorites)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return favorites
}

export const useInitFavorites = () => {
  const { activeTenant } = useAuth()
  useEffect(() => {
    clearFavoritesCache()
    void fetchFavorites(true)
  }, [activeTenant?.account, activeTenant?.server_id])
}

export const refetchFavorites = () => fetchFavorites(false)

export const clearFavoritesCache = () => {
  cachedFavorites = null
  lastFetchTime = null
}

export const isFavoriteEpisode = (episodeId: number): boolean => {
  if (!cachedFavorites?.episodes) return false
  return cachedFavorites.episodes.some((ep) => ep.item_id === episodeId)
}

export const isFavoriteSeries = (seriesId: number): boolean => {
  if (!cachedFavorites?.series) return false
  return cachedFavorites.series.some((s) => s.series_id === seriesId)
}
