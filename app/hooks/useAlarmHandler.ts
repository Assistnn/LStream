import notifee, { EventType } from '@notifee/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useRef } from 'react'

import { PlaylistRepository } from '../repositories/playlist'
import { toPlayableTrack } from '../screens/main/playlist/utils'
import { usePlayer } from './PlayerContext'

const PENDING_KEY = '@alarm/pendingPlay'

export const useAlarmHandler = () => {
  const { navigation: playerNav } = usePlayer()
  const playerNavRef = useRef(playerNav)
  playerNavRef.current = playerNav

  const triggerPlay = async (playlistId: string, random: boolean) => {
    const playlists = await PlaylistRepository.getPlaylists()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist || playlist.items.length === 0) return
    const index = random ? Math.floor(Math.random() * playlist.items.length) : 0
    const target = playlist.items[index]
    playerNavRef.current.playFromList(playlist.items.map(toPlayableTrack), target.episodeId, target.unitId, {
      playlistId,
    })
  }

  useEffect(() => {
    const checkPending = async () => {
      const raw = await AsyncStorage.getItem(PENDING_KEY)
      if (!raw) return
      await AsyncStorage.removeItem(PENDING_KEY)
      const { playlistId, random } = JSON.parse(raw) as { playlistId: string; random: string }
      await triggerPlay(playlistId, random === 'true')
    }

    const checkInitial = async () => {
      const initial = await notifee.getInitialNotification()
      if (initial?.notification?.data?.playlistId) {
        const { playlistId, random } = initial.notification.data as { playlistId: string; random: string }
        await triggerPlay(playlistId, random === 'true')
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
        void triggerPlay(data.playlistId, data.random === 'true')
      }
    })
    return unsubscribe
  }, [])
}
