import type { PlayableChild, PlayableTrack, QueueItem } from '../../../hooks/PlayerContext'
import type { SeriesMedia } from '../../../repositories/api/IApiRepository'
import type { AlarmSettings, DayKey, Playlist, PlaylistItem } from '../../../repositories/playlist'

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

export const toPlayableTrack = (
  item: Omit<PlaylistItem, 'id' | 'seriesId'> | Omit<QueueItem, 'id'>,
): PlayableTrack => {
  const isPlaylist = 'episodeId' in item
  const trackId = isPlaylist ? item.episodeId : item.trackId
  const childId = isPlaylist ? item.unitId : item.childId
  const parentTitle = isPlaylist ? item.seriesTitle : item.parentTitle
  const url = 'url' in item ? (item as { url: string }).url : ''
  const mType = 'mediaType' in item ? (item as { mediaType: number }).mediaType : 0
  return {
    id: trackId,
    mediaType: mType,
    url,
    img: item.thumbnail,
    title: item.title,
    duration: item.duration,
    progress: 0,
    parentTitle,
    ...(childId != null
      ? {
          children: [
            {
              id: childId,
              mediaType: mType,
              url,
              img: item.thumbnail,
              title: item.title,
              duration: item.duration,
              progress: 0,
              parentTitle,
            },
          ],
        }
      : {}),
  }
}

export const seriesMediaToTrack = (ep: SeriesMedia): PlayableTrack => ({
  id: ep.item_id,
  mediaType: ep.type_media,
  url: ep.url,
  img: ep.img,
  title: ep.title,
  duration: ep.duration,
  progress: ep.progress,
  parentTitle: ep.parentTitle,
  ...(ep.units
    ? {
        children: ep.units.map(
          (u): PlayableChild => ({
            id: u.item_id,
            mediaType: u.type_media,
            url: u.url,
            img: u.img,
            title: u.title,
            duration: u.duration,
            progress: u.progress,
            parentTitle: u.parentTitle,
          }),
        ),
      }
    : {}),
})
