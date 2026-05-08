import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { syncAllAlarms } from './alarmService'

import type { SeriesMedia } from '../repositories/api/IApiRepository'
import { usePlayer } from './PlayerContext'

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export type AlarmSettings = {
  enabled: boolean
  time: string
  days: DayKey[]
  random: boolean
}

export type PlaylistItem = {
  id: string
  seriesId: number
  episodeId: number
  unitId?: number
  title: string
  seriesTitle: string
  thumbnail: string
  duration: number
}

export type Playlist = {
  id: string
  name: string
  description: string
  items: PlaylistItem[]
  alarm?: AlarmSettings
  coverImage?: string
  gradient?: string
  createdAt: string
  isPinned: boolean
}

type PlaylistContextValue = {
  playlists: Playlist[]
  queue: PlaylistItem[]
  autoPlayNext: boolean
  isLoaded: boolean
  activeSwipeRowId: string | null
  setActiveSwipeRowId: (id: string | null) => void

  createPlaylist: (input: {
    name: string
    description: string
    gradient?: string
    coverImage?: string
    alarm?: AlarmSettings
  }) => string
  updatePlaylist: (id: string, patch: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void
  deletePlaylist: (id: string) => void
  togglePin: (id: string) => void
  addItemToPlaylist: (id: string, item: Omit<PlaylistItem, 'id'>) => void
  addItemsToPlaylist: (id: string, items: Omit<PlaylistItem, 'id'>[]) => void
  removeItemFromPlaylist: (id: string, itemId: string) => void
  reorderPlaylistItems: (id: string, fromIndex: number, toIndex: number) => void

  addToQueue: (item: Omit<PlaylistItem, 'id'>) => void
  removeFromQueue: (itemId: string) => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  clearQueue: () => void
  setAutoPlayNext: (v: boolean) => void
  playQueueFrom: (index: number) => void
  playPlaylistFrom: (playlistId: string, itemIndex: number) => void
}

const STORAGE_KEYS = {
  playlists: '@playlist/playlists',
  queue: '@playlist/queue',
  autoPlayNext: '@playlist/autoPlayNext',
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const toSeriesMedia = (item: PlaylistItem): SeriesMedia => ({
  item_id: item.episodeId,
  type_media: 0,
  url: '',
  img: item.thumbnail,
  title: item.title,
  duration: item.duration,
  progress: 0,
  parentTitle: item.seriesTitle,
})

const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

const PlaylistContext = createContext<PlaylistContextValue | undefined>(undefined)

export const usePlaylist = () => {
  const ctx = useContext(PlaylistContext)
  if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider')
  return ctx
}

export const PlaylistProvider = ({ children }: { children: ReactNode }) => {
  const { navigation: playerNav } = usePlayer()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [queue, setQueue] = useState<PlaylistItem[]>([])
  const [autoPlayNext, setAutoPlayNextState] = useState<boolean>(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeSwipeRowId, setActiveSwipeRowId] = useState<string | null>(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, q, a] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.playlists),
          AsyncStorage.getItem(STORAGE_KEYS.queue),
          AsyncStorage.getItem(STORAGE_KEYS.autoPlayNext),
        ])
        if (p) setPlaylists(JSON.parse(p))
        if (q) setQueue(JSON.parse(q))
        if (a !== null) setAutoPlayNextState(a === 'true')
      } catch {
        // ignore — start with defaults
      } finally {
        isLoadedRef.current = true
        setIsLoaded(true)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!isLoadedRef.current) return
    void AsyncStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify(playlists))
    void syncAllAlarms(playlists)
  }, [playlists])

  useEffect(() => {
    if (!isLoadedRef.current) return
    void AsyncStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue))
  }, [queue])

  useEffect(() => {
    if (!isLoadedRef.current) return
    void AsyncStorage.setItem(STORAGE_KEYS.autoPlayNext, String(autoPlayNext))
  }, [autoPlayNext])

  const value = useMemo<PlaylistContextValue>(
    () => ({
      playlists,
      queue,
      autoPlayNext,
      isLoaded,
      activeSwipeRowId,
      setActiveSwipeRowId,

      createPlaylist: (input) => {
        const id = uid()
        const playlist: Playlist = {
          id,
          name: input.name,
          description: input.description,
          items: [],
          alarm: input.alarm,
          gradient: input.gradient,
          coverImage: input.coverImage,
          createdAt: new Date().toISOString(),
          isPinned: false,
        }
        setPlaylists((prev) => [playlist, ...prev])
        return id
      },
      updatePlaylist: (id, patch) => {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      },
      deletePlaylist: (id) => {
        setPlaylists((prev) => prev.filter((p) => p.id !== id))
      },
      togglePin: (id) => {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)))
      },
      addItemToPlaylist: (id, item) => {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === id ? { ...p, items: [...p.items, { ...item, id: uid() }] } : p)),
        )
      },
      addItemsToPlaylist: (id, items) => {
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, items: [...p.items, ...items.map((item) => ({ ...item, id: uid() }))] } : p,
          ),
        )
      },
      removeItemFromPlaylist: (id, itemId) => {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === id ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)),
        )
      },
      reorderPlaylistItems: (id, from, to) => {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, items: reorder(p.items, from, to) } : p)))
      },

      addToQueue: (item) => {
        setQueue((prev) => [...prev, { ...item, id: uid() }])
      },
      removeFromQueue: (itemId) => {
        setQueue((prev) => prev.filter((i) => i.id !== itemId))
      },
      reorderQueue: (from, to) => {
        setQueue((prev) => reorder(prev, from, to))
      },
      clearQueue: () => setQueue([]),
      setAutoPlayNext: setAutoPlayNextState,
      playQueueFrom: (index) => {
        if (queue.length === 0 || index < 0 || index >= queue.length) return
        const episodes = queue.map(toSeriesMedia)
        const target = queue[index]
        playerNav.playEpisode(
          {
            result: 0,
            series_id: 0,
            img: '',
            num_total: 0,
            num_comp: 0,
            category: '',
            title: '',
            description: '',
            duration: 0,
            type_media: 0,
            url: '',
            progress: 0,
            episodes,
          },
          target.episodeId,
          target.unitId,
        )
      },
      playPlaylistFrom: (playlistId, itemIndex) => {
        const playlist = playlists.find((p) => p.id === playlistId)
        if (!playlist || playlist.items.length === 0) return
        const safeIndex = Math.max(0, Math.min(itemIndex, playlist.items.length - 1))
        const episodes = playlist.items.map(toSeriesMedia)
        const target = playlist.items[safeIndex]
        playerNav.playEpisode(
          {
            result: 0,
            series_id: 0,
            img: '',
            num_total: 0,
            num_comp: 0,
            category: '',
            title: playlist.name,
            description: '',
            duration: 0,
            type_media: 0,
            url: '',
            progress: 0,
            episodes,
          },
          target.episodeId,
          target.unitId,
        )
      },
    }),
    [playlists, queue, autoPlayNext, isLoaded, activeSwipeRowId, playerNav],
  )

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>
}
