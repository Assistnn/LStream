import type { AlarmSettings, DayKey, Playlist } from '../../../hooks/PlaylistContext'

export const GRADIENT_PRESETS: { key: string; colors: [string, string] }[] = [
  { key: 'blue', colors: ['#3B82F6', '#2563EB'] },
  { key: 'purple', colors: ['#A855F7', '#7C3AED'] },
  { key: 'pink', colors: ['#EC4899', '#DB2777'] },
  { key: 'green', colors: ['#10B981', '#059669'] },
  { key: 'orange', colors: ['#F97316', '#EA580C'] },
  { key: 'sunset', colors: ['#F59E0B', '#EF4444'] },
  { key: 'ocean', colors: ['#06B6D4', '#2563EB'] },
]

export const DEFAULT_GRADIENT = GRADIENT_PRESETS[0]

export const gradientByKey = (key?: string) => GRADIENT_PRESETS.find((g) => g.key === key) ?? DEFAULT_GRADIENT

export const DAY_LABELS: Record<DayKey, string> = {
  sun: '日',
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
}

export const DAY_ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const formatDuration = (seconds: number) => {
  if (seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatTotalDuration = (seconds: number) => {
  if (seconds <= 0) return '0分'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}時間${m}分`
  if (h > 0) return `${h}時間`
  return `${m}分`
}

export const getTotalDuration = (playlist: Pick<Playlist, 'items'>) =>
  playlist.items.reduce((sum, i) => sum + i.duration, 0)

export const formatAlarmTime = (alarm: AlarmSettings) => {
  const days = DAY_ORDER.filter((d) => alarm.days.includes(d))
    .map((d) => DAY_LABELS[d])
    .join('・')
  return days ? `${days} ${alarm.time}` : alarm.time
}

export const sortPlaylists = (playlists: Playlist[]): Playlist[] => {
  return playlists.slice().sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
