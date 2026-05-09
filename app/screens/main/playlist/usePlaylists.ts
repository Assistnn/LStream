import { useEffect, useRef, useState } from 'react'

import { syncAllAlarms } from '../../../hooks/alarmService'
import type { Playlist } from '../../../repositories/playlist'
import { PlaylistRepository } from '../../../repositories/playlist'

let globalPlaylists: Playlist[] = []
const listeners = new Set<(p: Playlist[]) => void>()

const notify = (next: Playlist[]) => {
  globalPlaylists = next
  listeners.forEach((fn) => fn(next))
}

export const usePlaylists = () => {
  const [playlists, setLocal] = useState(globalPlaylists)
  const loadedRef = useRef(false)

  useEffect(() => {
    listeners.add(setLocal)

    if (!loadedRef.current && globalPlaylists.length === 0) {
      loadedRef.current = true
      PlaylistRepository.getPlaylists().then((p) => notify(p))
    }

    return () => {
      listeners.delete(setLocal)
    }
  }, [])

  const setPlaylists = (next: Playlist[]) => {
    notify(next)
    void PlaylistRepository.savePlaylists(next)
    void syncAllAlarms(next)
  }

  return { playlists, setPlaylists }
}
