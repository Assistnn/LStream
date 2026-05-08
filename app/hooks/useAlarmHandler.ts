import AsyncStorage from '@react-native-async-storage/async-storage'
import notifee, { EventType } from '@notifee/react-native'
import { useEffect, useRef } from 'react'

import { usePlayer } from './PlayerContext'
import { usePlaylist } from './PlaylistContext'

const PENDING_KEY = '@alarm/pendingPlay'

export const useAlarmHandler = () => {
  const { playlists, playPlaylistFrom } = usePlaylist()
  const { navigation: playerNav } = usePlayer()
  const playlistsRef = useRef(playlists)
  playlistsRef.current = playlists

  const triggerPlay = (playlistId: string, random: boolean) => {
    const playlist = playlistsRef.current.find((p) => p.id === playlistId)
    if (!playlist || playlist.items.length === 0) return
    const index = random ? Math.floor(Math.random() * playlist.items.length) : 0
    playPlaylistFrom(playlistId, index)
  }

  useEffect(() => {
    const checkPending = async () => {
      const raw = await AsyncStorage.getItem(PENDING_KEY)
      if (!raw) return
      await AsyncStorage.removeItem(PENDING_KEY)
      const { playlistId, random } = JSON.parse(raw) as { playlistId: string; random: string }
      triggerPlay(playlistId, random === 'true')
    }

    const checkInitial = async () => {
      const initial = await notifee.getInitialNotification()
      if (initial?.notification?.data?.playlistId) {
        const { playlistId, random } = initial.notification.data as { playlistId: string; random: string }
        triggerPlay(playlistId, random === 'true')
        return true
      }
      return false
    }

    const init = async () => {
      const handled = await checkInitial()
      if (!handled) await checkPending()
    }

    void init()
  }, [])

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const data = detail.notification?.data as { playlistId?: string; random?: string } | undefined
      if (!data?.playlistId) return

      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        triggerPlay(data.playlistId, data.random === 'true')
      }
    })
    return unsubscribe
  }, [])
}
