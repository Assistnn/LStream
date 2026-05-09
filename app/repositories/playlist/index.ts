import AsyncStorage from '@react-native-async-storage/async-storage'

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
  url: string
  mediaType: number
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

const KEYS = {
  playlists: '@playlist/playlists',
} as const

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const reorder = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || from >= arr.length || to < 0 || to >= arr.length) return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export const PlaylistRepository = {
  uid,
  reorder,

  async getPlaylists(): Promise<Playlist[]> {
    const raw = await AsyncStorage.getItem(KEYS.playlists)
    return raw ? JSON.parse(raw) : []
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.playlists, JSON.stringify(playlists))
  },

  createPlaylist(
    playlists: Playlist[],
    input: { name: string; description: string; gradient?: string; coverImage?: string; alarm?: AlarmSettings },
  ): { id: string; playlists: Playlist[] } {
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
    return { id, playlists: [playlist, ...playlists] }
  },

  updatePlaylist(playlists: Playlist[], id: string, patch: Partial<Omit<Playlist, 'id' | 'createdAt'>>): Playlist[] {
    return playlists.map((p) => (p.id === id ? { ...p, ...patch } : p))
  },

  deletePlaylist(playlists: Playlist[], id: string): Playlist[] {
    return playlists.filter((p) => p.id !== id)
  },

  togglePin(playlists: Playlist[], id: string): Playlist[] {
    return playlists.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
  },

  addItemToPlaylist(playlists: Playlist[], id: string, item: Omit<PlaylistItem, 'id'>): Playlist[] {
    return playlists.map((p) => (p.id === id ? { ...p, items: [...p.items, { ...item, id: uid() }] } : p))
  },

  addItemsToPlaylist(playlists: Playlist[], id: string, items: Omit<PlaylistItem, 'id'>[]): Playlist[] {
    return playlists.map((p) =>
      p.id === id ? { ...p, items: [...p.items, ...items.map((item) => ({ ...item, id: uid() }))] } : p,
    )
  },

  removeItemFromPlaylist(playlists: Playlist[], id: string, itemId: string): Playlist[] {
    return playlists.map((p) => (p.id === id ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p))
  },

  reorderPlaylistItems(playlists: Playlist[], id: string, from: number, to: number): Playlist[] {
    return playlists.map((p) => (p.id === id ? { ...p, items: reorder(p.items, from, to) } : p))
  },
}
