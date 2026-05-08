import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native'

import type { Playlist } from './PlaylistContext'

const CHANNEL_ID = 'alarm'
const DAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

const notificationId = (playlistId: string, dayIndex: number) => `alarm-${playlistId}-${dayIndex}`

const nextOccurrence = (dayOfWeek: number, time: string): number => {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0)
  const diff = (dayOfWeek - now.getDay() + 7) % 7
  if (diff === 0 && now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 7)
  } else {
    target.setDate(target.getDate() + diff)
  }
  return target.getTime()
}

export const ensureChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'アラーム',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  })
}

export const scheduleAlarmsForPlaylist = async (playlist: Playlist) => {
  await cancelAlarmsForPlaylist(playlist.id)

  if (!playlist.alarm?.enabled || playlist.alarm.days.length === 0) return

  const { time, days, random } = playlist.alarm

  for (const day of days) {
    const dayIndex = DAY_MAP[day]
    if (dayIndex === undefined) continue

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextOccurrence(dayIndex, time),
      repeatFrequency: RepeatFrequency.WEEKLY,
      alarmManager: { allowWhileIdle: true },
    }

    await notifee.createTriggerNotification(
      {
        id: notificationId(playlist.id, dayIndex),
        title: 'プレイリストアラーム',
        body: `${playlist.name} を再生します`,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          sound: 'default',
        },
        data: { playlistId: playlist.id, random: String(random) },
      },
      trigger,
    )
  }
}

export const cancelAlarmsForPlaylist = async (playlistId: string) => {
  for (let i = 0; i < 7; i++) {
    await notifee.cancelNotification(notificationId(playlistId, i))
  }
}

export const syncAllAlarms = async (playlists: Playlist[]) => {
  for (const p of playlists) {
    await scheduleAlarmsForPlaylist(p)
  }
}
