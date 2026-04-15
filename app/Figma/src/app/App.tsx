import serviceLogo from 'figma:asset/a64b107011c254b1d4b566c6be2e6a49b32bdd2b.png'
import { useState } from 'react'

import { AddToPlaylistDialog } from '@/app/components/AddToPlaylistDialog'
import { BottomTab } from '@/app/components/BottomTab'
import { CreatePlaylistDialog } from '@/app/components/CreatePlaylistDialog'
import { EpisodePlayer } from '@/app/components/EpisodePlayer'
import { MiniPlayer } from '@/app/components/MiniPlayer'
import type { ServiceAccount } from '@/app/components/screens/AccountScreen'
import { AccountScreen } from '@/app/components/screens/AccountScreen'
import { ContentDetailScreen } from '@/app/components/screens/ContentDetailScreen'
import type { DownloadItem } from '@/app/components/screens/DownloadScreen'
import { DownloadScreen } from '@/app/components/screens/DownloadScreen'
import { EpisodeListScreen } from '@/app/components/screens/EpisodeListScreen'
import { FavoritesScreen } from '@/app/components/screens/FavoritesScreen'
import { HistoryScreen } from '@/app/components/screens/HistoryScreen'
import { LibraryScreen } from '@/app/components/screens/LibraryScreen'
import { NewArrivalsScreen } from '@/app/components/screens/NewArrivalsScreen'
import { PlaylistDetailScreen } from '@/app/components/screens/PlaylistDetailScreen'
import { PlaylistScreen } from '@/app/components/screens/PlaylistScreen'
import { QueueScreen } from '@/app/components/screens/QueueScreen'
import { SettingsScreen } from '@/app/components/screens/SettingsScreen'
import { TodayScreen } from '@/app/components/screens/TodayScreen'
import { ThemeProvider } from '@/contexts/ThemeContext'
import type { AlarmSettings, Chapter, Content, Episode, Playlist, PlaylistItem, Series } from '@/data/mockData'
import { mockLibraryItems } from '@/data/mockData'

type PlayingItem =
  | { type: 'content'; content: Content }
  | { type: 'episode'; series: Series; episode: Episode; chapter?: Chapter }

type SortOrder = 'default' | 'newest' | 'oldest'

type QueueItem = {
  series: Series
  episode: Episode
  chapter?: Chapter
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'library' | 'favorites' | 'playlist' | 'history' | 'settings'>(
    'today',
  )
  const [playingItem, setPlayingItem] = useState<PlayingItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [libraryItems, setLibraryItems] = useState(mockLibraryItems)
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [showCreatePlaylistDialog, setShowCreatePlaylistDialog] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false)
  const [pendingPlaylistItem, setPendingPlaylistItem] = useState<{
    series: Series
    episode: Episode
    chapter?: Chapter
  } | null>(null)
  const [showQueueScreen, setShowQueueScreen] = useState(false)
  const [pinnedPlaylists, setPinnedPlaylists] = useState<Set<string>>(new Set())
  const [showAccountScreen, setShowAccountScreen] = useState(false)
  const [showDownloadScreen, setShowDownloadScreen] = useState(false)
  const [showNewArrivalsScreen, setShowNewArrivalsScreen] = useState(false)

  // Download state - mock data for now
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: 'download-1',
      series: libraryItems[0] as Series,
      episode: (libraryItems[0] as Series).episodes[0],
      chapter: (libraryItems[0] as Series).episodes[0].chapters?.[0],
      sizeMB: 125.4,
      playCount: 3,
      isLocked: false,
    },
    {
      id: 'download-2',
      series: libraryItems[0] as Series,
      episode: (libraryItems[0] as Series).episodes[1],
      sizeMB: 98.2,
      playCount: 5,
      isLocked: true,
    },
  ])

  // Account state
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([
    {
      id: 'service-1',
      userName: 'ユーザー',
      email: 'admin@president-school.jp',
      password: '••••••••',
      tenantCode: 'PBS001',
      logoUrl: serviceLogo,
      serviceName: '社長の教習所',
    },
  ])
  const [activeServiceAccountId, setActiveServiceAccountId] = useState<string | null>('service-1')

  // Get active service account
  const activeServiceAccount = serviceAccounts.find((acc) => acc.id === activeServiceAccountId) || null

  // Playlist playback state
  const [playlistPlaybackMode, setPlaylistPlaybackMode] = useState<{
    playlist: Playlist
    order: number[]
    currentIndex: number
    isShuffled: boolean
    isRepeatOn: boolean
  } | null>(null)

  // Handle tab change - close all full screens
  const handleTabChange = (tab: 'today' | 'library' | 'favorites' | 'playlist' | 'history' | 'settings') => {
    setActiveTab(tab)
    // Close all full screens when switching tabs
    setSelectedPlaylist(null)
    setShowQueueScreen(false)
    setSelectedSeries(null)
    setSelectedContent(null)
  }

  // Helper function to get sorted episodes
  const getSortedEpisodes = (series: Series): Episode[] => {
    const episodes = [...series.episodes]

    if (sortOrder === 'default') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
    } else if (sortOrder === 'newest') {
      episodes.sort((a, b) => b.episodeNumber - a.episodeNumber)
    } else if (sortOrder === 'oldest') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
    }

    return episodes
  }

  const handlePlayContent = (content: Content) => {
    setPlayingItem({ type: 'content', content })
    setIsPlaying(true)
    setShowPlayer(true)
  }

  const handlePlayEpisode = (series: Series, episode: Episode, chapter?: Chapter) => {
    setPlayingItem({ type: 'episode', series, episode, chapter })
    setIsPlaying(true)
    setShowPlayer(true)
    setSelectedSeries(null) // Close episode list screen
    setSelectedContent(null) // Close content detail screen
    // Clear playlist playback mode if playing from regular library
    setPlaylistPlaybackMode(null)
  }

  // New handler for playing from playlist
  const handlePlayEpisodeFromPlaylist = (
    playlist: Playlist,
    playOrder: number[],
    index: number,
    isShuffled: boolean,
    isRepeatOn: boolean,
  ) => {
    // index is the actual playlist item index (0-based position in the playlist)
    // playOrder is the order in which items should be played (could be shuffled)
    // We need to find where this index appears in the playOrder array
    const orderIndex = playOrder.indexOf(index)
    const actualIndex = orderIndex >= 0 ? orderIndex : index

    const item = playlist.items[index]

    console.log('handlePlayEpisodeFromPlaylist called:', {
      playlistName: playlist.name,
      itemIndex: index,
      orderIndex: actualIndex,
      playOrder,
      totalItems: playlist.items.length,
      item: item ? `${item.series.title} - ${item.episode.title}` : 'undefined',
      isRepeatOn,
    })

    if (!item) {
      console.error('Invalid playlist item index:', index)
      return
    }

    setPlayingItem({ type: 'episode', series: item.series, episode: item.episode, chapter: item.chapter })
    setIsPlaying(true)
    setShowPlayer(true)
    setPlaylistPlaybackMode({
      playlist,
      order: playOrder,
      currentIndex: actualIndex,
      isShuffled,
      isRepeatOn,
    })
  }

  // Playlist navigation handlers
  const handlePlaylistNext = () => {
    if (!playlistPlaybackMode) {
      console.log('handlePlaylistNext: No playlist playback mode')
      return
    }

    const { playlist, order, currentIndex, isShuffled, isRepeatOn } = playlistPlaybackMode
    console.log('handlePlaylistNext called:', {
      currentIndex,
      orderLength: order.length,
      order,
      nextIndex: currentIndex + 1,
      nextItemIndex: order[currentIndex + 1],
    })

    if (currentIndex < order.length - 1) {
      const nextIndex = currentIndex + 1
      const itemIndex = order[nextIndex]
      const item = playlist.items[itemIndex]

      if (!item) {
        console.error('Invalid playlist item index:', itemIndex)
        return
      }

      setPlayingItem({ type: 'episode', series: item.series, episode: item.episode, chapter: item.chapter })
      setPlaylistPlaybackMode({
        ...playlistPlaybackMode,
        currentIndex: nextIndex,
      })
    } else if (isRepeatOn) {
      const firstIndex = 0
      const itemIndex = order[firstIndex]
      const item = playlist.items[itemIndex]

      if (!item) {
        console.error('Invalid playlist item index:', itemIndex)
        return
      }

      setPlayingItem({ type: 'episode', series: item.series, episode: item.episode, chapter: item.chapter })
      setPlaylistPlaybackMode({
        ...playlistPlaybackMode,
        currentIndex: firstIndex,
      })
    }
  }

  const handlePlaylistPrev = () => {
    if (!playlistPlaybackMode) {
      console.log('handlePlaylistPrev: No playlist playback mode')
      return
    }

    const { playlist, order, currentIndex } = playlistPlaybackMode
    console.log('handlePlaylistPrev called:', {
      currentIndex,
      orderLength: order.length,
      order,
      prevIndex: currentIndex - 1,
      prevItemIndex: order[currentIndex - 1],
    })

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const itemIndex = order[prevIndex]
      const item = playlist.items[itemIndex]

      if (!item) {
        console.error('Invalid playlist item index:', itemIndex)
        return
      }

      setPlayingItem({ type: 'episode', series: item.series, episode: item.episode, chapter: item.chapter })
      setPlaylistPlaybackMode({
        ...playlistPlaybackMode,
        currentIndex: prevIndex,
      })
    }
  }

  const handlePlayAllEpisodes = (series: Series) => {
    const firstEpisode = series.episodes[0]
    if (firstEpisode) {
      handlePlayEpisode(series, firstEpisode)
    }
  }

  const handleNextEpisode = () => {
    if (playingItem?.type === 'episode') {
      const sortedEpisodes = getSortedEpisodes(playingItem.series)
      const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === playingItem.episode.id)
      const nextEpisode = sortedEpisodes[currentIndex + 1]
      if (nextEpisode) {
        // If next episode has chapters, play the first chapter
        if (nextEpisode.chapters && nextEpisode.chapters.length > 0) {
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: nextEpisode,
            chapter: nextEpisode.chapters[0],
          })
        } else {
          // If no chapters, play the episode itself
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: nextEpisode,
          })
        }
      }
    }
  }

  const handlePrevEpisode = () => {
    if (playingItem?.type === 'episode') {
      const sortedEpisodes = getSortedEpisodes(playingItem.series)
      const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === playingItem.episode.id)
      const prevEpisode = sortedEpisodes[currentIndex - 1]
      if (prevEpisode) {
        // If previous episode has chapters, play the last chapter
        if (prevEpisode.chapters && prevEpisode.chapters.length > 0) {
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: prevEpisode,
            chapter: prevEpisode.chapters[prevEpisode.chapters.length - 1],
          })
        } else {
          // If no chapters, play the episode itself
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: prevEpisode,
          })
        }
      }
    }
  }

  const handleNextChapter = () => {
    if (playingItem?.type === 'episode' && playingItem.chapter) {
      const currentEpisode = playingItem.episode
      const currentChapterIndex = currentEpisode.chapters?.findIndex((ch) => ch.id === playingItem.chapter?.id) ?? -1

      if (currentChapterIndex !== -1 && currentEpisode.chapters) {
        const nextChapter = currentEpisode.chapters[currentChapterIndex + 1]
        if (nextChapter) {
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: currentEpisode,
            chapter: nextChapter,
          })
        } else {
          // No next chapter in current episode, move to next episode
          handleNextEpisode()
        }
      }
    }
  }

  const handlePrevChapter = () => {
    if (playingItem?.type === 'episode' && playingItem.chapter) {
      const currentEpisode = playingItem.episode
      const currentChapterIndex = currentEpisode.chapters?.findIndex((ch) => ch.id === playingItem.chapter?.id) ?? -1

      if (currentChapterIndex > 0 && currentEpisode.chapters) {
        const prevChapter = currentEpisode.chapters[currentChapterIndex - 1]
        if (prevChapter) {
          setPlayingItem({
            type: 'episode',
            series: playingItem.series,
            episode: currentEpisode,
            chapter: prevChapter,
          })
        }
      } else if (currentChapterIndex === 0) {
        // At the first chapter, move to previous episode
        handlePrevEpisode()
      }
    }
  }

  const handleToggleFavorite = (item: Content | Series) => {
    setLibraryItems(
      libraryItems.map((libraryItem) =>
        libraryItem.id === item.id ? { ...libraryItem, isFavorite: !libraryItem.isFavorite } : libraryItem,
      ),
    )

    // Update playing item if it matches
    if (playingItem) {
      if (playingItem.type === 'content' && playingItem.content.id === item.id) {
        setPlayingItem({
          type: 'content',
          content: { ...playingItem.content, isFavorite: !playingItem.content.isFavorite },
        })
      } else if (playingItem.type === 'episode' && playingItem.series.id === item.id) {
        setPlayingItem({
          type: 'episode',
          series: { ...playingItem.series, isFavorite: !playingItem.series.isFavorite },
          episode: playingItem.episode,
        })
      }
    }
  }

  const handleToggleEpisodeFavorite = (episode: Episode) => {
    setLibraryItems(
      libraryItems.map((libraryItem) => {
        if ('episodes' in libraryItem) {
          return {
            ...libraryItem,
            episodes: libraryItem.episodes.map((ep) =>
              ep.id === episode.id ? { ...ep, isFavorite: !ep.isFavorite } : ep,
            ),
          }
        }
        return libraryItem
      }),
    )

    // Update selected series if it matches
    if (selectedSeries && 'episodes' in selectedSeries) {
      setSelectedSeries({
        ...selectedSeries,
        episodes: selectedSeries.episodes.map((ep) =>
          ep.id === episode.id ? { ...ep, isFavorite: !ep.isFavorite } : ep,
        ),
      })
    }

    // Update playing item if it matches
    if (playingItem?.type === 'episode' && playingItem.episode.id === episode.id) {
      setPlayingItem({
        type: 'episode',
        series: {
          ...playingItem.series,
          episodes: playingItem.series.episodes.map((ep) =>
            ep.id === episode.id ? { ...ep, isFavorite: !ep.isFavorite } : ep,
          ),
        },
        episode: { ...playingItem.episode, isFavorite: !playingItem.episode.isFavorite },
      })
    }
  }

  const handleToggleChapterFavorite = (episode: Episode, chapter: Chapter) => {
    setLibraryItems(
      libraryItems.map((libraryItem) => {
        if ('episodes' in libraryItem) {
          return {
            ...libraryItem,
            episodes: libraryItem.episodes.map((ep) =>
              ep.id === episode.id && ep.chapters
                ? {
                    ...ep,
                    chapters: ep.chapters.map((ch) =>
                      ch.id === chapter.id ? { ...ch, isFavorite: !ch.isFavorite } : ch,
                    ),
                  }
                : ep,
            ),
          }
        }
        return libraryItem
      }),
    )

    // Update selected series if it matches
    if (selectedSeries && 'episodes' in selectedSeries) {
      setSelectedSeries({
        ...selectedSeries,
        episodes: selectedSeries.episodes.map((ep) =>
          ep.id === episode.id && ep.chapters
            ? {
                ...ep,
                chapters: ep.chapters.map((ch) => (ch.id === chapter.id ? { ...ch, isFavorite: !ch.isFavorite } : ch)),
              }
            : ep,
        ),
      })
    }

    // Update playing item if it matches
    if (
      playingItem?.type === 'episode' &&
      playingItem.episode.id === episode.id &&
      playingItem.chapter?.id === chapter.id
    ) {
      setPlayingItem({
        type: 'episode',
        series: {
          ...playingItem.series,
          episodes: playingItem.series.episodes.map((ep) =>
            ep.id === episode.id && ep.chapters
              ? {
                  ...ep,
                  chapters: ep.chapters.map((ch) =>
                    ch.id === chapter.id ? { ...ch, isFavorite: !ch.isFavorite } : ch,
                  ),
                }
              : ep,
          ),
        },
        episode: {
          ...playingItem.episode,
          chapters: playingItem.episode.chapters?.map((ch) =>
            ch.id === chapter.id ? { ...ch, isFavorite: !ch.isFavorite } : ch,
          ),
        },
        chapter: playingItem.chapter
          ? { ...playingItem.chapter, isFavorite: !playingItem.chapter.isFavorite }
          : undefined,
      })
    }
  }

  const handleSeriesTap = (series: Series) => {
    setSelectedSeries(series)
  }

  const handleCloseEpisodeList = () => {
    setSelectedSeries(null)
  }

  const handleCloseDetail = () => {
    setSelectedContent(null)
  }

  const handleAddToQueue = (series: Series, episode: Episode, chapter?: Chapter) => {
    setQueue((prev) => [...prev, { series, episode, chapter }])
  }

  const handleAddSeriesToQueue = (series: Series) => {
    // Add all episodes and chapters from the series to the queue in order
    const items: QueueItem[] = []

    series.episodes.forEach((episode) => {
      if (episode.chapters && episode.chapters.length > 0) {
        // If episode has chapters, add each chapter
        episode.chapters.forEach((chapter) => {
          items.push({ series, episode, chapter })
        })
      } else {
        // If no chapters, add the episode itself
        items.push({ series, episode })
      }
    })

    setQueue((prev) => [...prev, ...items])
  }

  const handleAddSeriesToPlaylist = (series: Series) => {
    // Check if series has episodes
    if (!series.episodes || series.episodes.length === 0) {
      console.warn('Series has no episodes')
      return
    }

    // Collect all episodes and chapters from the series
    const items: PlaylistItem[] = []

    series.episodes.forEach((episode) => {
      if (episode.chapters && episode.chapters.length > 0) {
        // If episode has chapters, add each chapter
        episode.chapters.forEach((chapter) => {
          items.push({
            series,
            episode,
            chapter,
          })
        })
      } else {
        // If no chapters, add the episode itself
        items.push({
          series,
          episode,
        })
      }
    })

    // Set pending items and show dialog
    setPendingPlaylistItem(null) // Clear single item
    // We need to handle multiple items, so we'll modify the flow
    // For now, we'll just add to the first available playlist or show the dialog
    setShowAddToPlaylistDialog(true)
    // Store the items temporarily (we'll need to modify AddToPlaylistDialog to handle this)
    // For now, let's just open the dialog with the first item
    if (items.length > 0) {
      setPendingPlaylistItem(items[0])
      // Store remaining items in state
      ;(window as any).__pendingSeriesItems = items
    }
  }

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreatePlaylist = (name: string, description: string, alarm?: AlarmSettings, coverImage?: string) => {
    // Define gradient options
    const gradientOptions = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-indigo-500 to-purple-600',
      'from-cyan-500 to-blue-600',
      'from-pink-500 to-rose-600',
      'from-yellow-500 to-orange-600',
      'from-teal-500 to-green-600',
      'from-violet-500 to-purple-600',
    ]

    // Randomly select a gradient
    const randomGradient = gradientOptions[Math.floor(Math.random() * gradientOptions.length)]

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      items: [],
      alarm,
      coverImage,
      gradient: randomGradient,
      createdAt: new Date(),
    }
    setPlaylists([...playlists, newPlaylist])
    setShowCreatePlaylistDialog(false)

    // If there's a pending item to add, keep the add to playlist dialog open
    // (it will automatically show since showAddToPlaylistDialog remains true)
  }

  const handleUpdatePlaylist = (
    id: string,
    name: string,
    description: string,
    alarm?: AlarmSettings,
    coverImage?: string,
  ) => {
    setPlaylists(playlists.map((p) => (p.id === id ? { ...p, name, description, alarm, coverImage } : p)))

    // Update selectedPlaylist if it's the one being edited
    if (selectedPlaylist && selectedPlaylist.id === id) {
      setSelectedPlaylist({ ...selectedPlaylist, name, description, alarm, coverImage })
    }

    setEditingPlaylist(null)
    setShowCreatePlaylistDialog(false)
  }

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter((p) => p.id !== playlistId))
  }

  const handleAddToPlaylistRequest = (series: Series, episode: Episode, chapter?: Chapter) => {
    setPendingPlaylistItem({ series, episode, chapter })
    setShowAddToPlaylistDialog(true)
  }

  const handleSelectPlaylistForAdd = (playlistId: string) => {
    // Check if we have multiple items from a series
    const seriesItems = (window as any).__pendingSeriesItems as PlaylistItem[] | undefined

    if (seriesItems && seriesItems.length > 0) {
      // Add all items from the series
      setPlaylists(
        playlists.map((p) => {
          if (p.id === playlistId) {
            return {
              ...p,
              items: [...p.items, ...seriesItems],
            }
          }
          return p
        }),
      )
      // Clear the series items
      delete (window as any).__pendingSeriesItems
    } else if (pendingPlaylistItem) {
      // Add single item
      setPlaylists(
        playlists.map((p) => {
          if (p.id === playlistId) {
            return {
              ...p,
              items: [...p.items, pendingPlaylistItem],
            }
          }
          return p
        }),
      )
    }

    setPendingPlaylistItem(null)
    setShowAddToPlaylistDialog(false)
  }

  const handlePlayAllPlaylistItems = (playlist: Playlist) => {
    if (playlist.items.length > 0) {
      const firstItem = playlist.items[0]
      handlePlayEpisode(firstItem.series, firstItem.episode, firstItem.chapter)
    }
  }

  const handleRemoveFromPlaylistByIndex = (index: number) => {
    if (selectedPlaylist) {
      const updated = { ...selectedPlaylist, items: selectedPlaylist.items.filter((_, i) => i !== index) }
      setSelectedPlaylist(updated)
      setPlaylists(playlists.map((p) => (p.id === updated.id ? updated : p)))
    }
  }

  const handleReorderPlaylistItems = (playlistId: string, newOrder: PlaylistItem[]) => {
    setPlaylists(playlists.map((p) => (p.id === playlistId ? { ...p, items: newOrder } : p)))
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist({ ...selectedPlaylist, items: newOrder })
    }
  }

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
  }

  const handleClosePlaylistDetail = () => {
    setSelectedPlaylist(null)
  }

  const handleTogglePin = (playlistId: string) => {
    setPinnedPlaylists((prev) => {
      const newPinned = new Set(prev)
      if (newPinned.has(playlistId)) {
        newPinned.delete(playlistId)
      } else {
        newPinned.add(playlistId)
      }
      return newPinned
    })
  }

  const handleEditPlaylist = (playlistId: string) => {
    // Find the playlist to edit
    const playlist = playlists.find((p) => p.id === playlistId)
    if (playlist) {
      setEditingPlaylist(playlist)
      setShowCreatePlaylistDialog(true)
    }
  }

  const handlePlayPlaylistItem = (item: PlaylistItem) => {
    handlePlayEpisode(item.series, item.episode, item.chapter)
  }

  const handleRemoveFromPlaylist = (playlistId: string, index: number) => {
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId)
    if (playlistIndex !== -1) {
      const newPlaylists = [...playlists]
      newPlaylists[playlistIndex].items.splice(index, 1)
      setPlaylists(newPlaylists)
    }
  }

  const handleRenamePlaylist = (playlistId: string, newName: string) => {
    const playlistIndex = playlists.findIndex((p) => p.id === playlistId)
    if (playlistIndex !== -1) {
      const newPlaylists = [...playlists]
      newPlaylists[playlistIndex].name = newName
      setPlaylists(newPlaylists)
    }
  }

  const handleAddToPlaylistDialogOpen = (series: Series, episode: Episode, chapter?: Chapter) => {
    setPendingPlaylistItem({ series, episode, chapter })
    setShowAddToPlaylistDialog(true)
  }

  const handleAddToPlaylistDialogClose = () => {
    setPendingPlaylistItem(null)
    setShowAddToPlaylistDialog(false)
  }

  // Handle closing the player
  const handleClosePlayer = () => {
    setShowPlayer(false)
    // If in playlist mode, restore the playlist detail screen
    if (playlistPlaybackMode) {
      setSelectedPlaylist(playlistPlaybackMode.playlist)
    }
  }

  // Get current content for mini player
  const currentMiniPlayerContent: Content | null = playingItem
    ? playingItem.type === 'content'
      ? playingItem.content
      : {
          ...playingItem.episode,
          title: playingItem.chapter ? playingItem.chapter.title : playingItem.episode.title,
          subtitle: playingItem.series.title,
          episodeNumber: playingItem.episode.episodeNumber,
          chapterNumber: playingItem.chapter?.chapterNumber,
          category: playingItem.series.category,
          type: playingItem.series.type,
          thumbnail: playingItem.series.thumbnail,
          isFavorite: playingItem.chapter?.isFavorite || playingItem.episode.isFavorite || false,
          isDownloaded: playingItem.series.isDownloaded,
          isSeries: false as const,
        }
    : null

  return (
    <ThemeProvider>
      <div className='relative w-full h-screen mx-auto bg-gray-50 dark:bg-gray-900 overflow-hidden max-w-[460px]'>
        {/* Main content */}
        <div className='h-full overflow-y-auto pb-20'>
          {activeTab === 'today' && (
            <TodayScreen
              onPlayContent={handlePlayContent}
              onPlayEpisode={handlePlayEpisode}
              onToggleFavorite={handleToggleFavorite}
              onSeriesTap={handleSeriesTap}
              activeServiceAccount={activeServiceAccount}
              onAccountTap={() => setShowAccountScreen(true)}
              onViewAllHistory={() => setActiveTab('history')}
              onViewAllNewArrivals={() => setShowNewArrivalsScreen(true)}
            />
          )}
          {activeTab === 'library' && (
            <LibraryScreen
              libraryItems={libraryItems}
              onPlayContent={handlePlayContent}
              onPlayEpisode={handlePlayEpisode}
              onToggleFavorite={handleToggleFavorite}
              onSeriesTap={handleSeriesTap}
              onAddSeriesToQueue={handleAddSeriesToQueue}
              onAddSeriesToPlaylist={handleAddSeriesToPlaylist}
            />
          )}
          {activeTab === 'favorites' && (
            <FavoritesScreen
              favoriteItems={libraryItems.filter((item) => item.isFavorite)}
              allLibraryItems={libraryItems}
              onPlayContent={handlePlayContent}
              onToggleFavorite={handleToggleFavorite}
              onSeriesTap={handleSeriesTap}
              onPlayEpisode={handlePlayEpisode}
              onToggleEpisodeFavorite={handleToggleEpisodeFavorite}
              onToggleChapterFavorite={handleToggleChapterFavorite}
              onAddToQueue={handleAddToQueue}
              onAddSeriesToPlaylist={handleAddSeriesToPlaylist}
              onAddSeriesToQueue={handleAddSeriesToQueue}
              onAddToPlaylist={handleAddToPlaylistRequest}
            />
          )}
          {activeTab === 'playlist' && (
            <PlaylistScreen
              playlists={playlists}
              queueCount={queue.length}
              onQueueTap={() => setShowQueueScreen(true)}
              onPlaylistTap={handleSelectPlaylist}
              onCreatePlaylist={() => setShowCreatePlaylistDialog(true)}
              onDeletePlaylist={handleDeletePlaylist}
              onTogglePin={handleTogglePin}
              onEditPlaylist={handleEditPlaylist}
              pinnedPlaylists={pinnedPlaylists}
            />
          )}
          {activeTab === 'history' && (
            <HistoryScreen
              onBack={() => setActiveTab('today')}
              onPlayHistory={(historyItem) => {
                if (historyItem.episode) {
                  handlePlayEpisode(historyItem.series, historyItem.episode, historyItem.chapter)
                }
              }}
              downloads={downloads}
              onDeleteDownloads={(ids) => {
                setDownloads(downloads.filter((d) => !ids.includes(d.id)))
              }}
              onToggleLock={(id) => {
                setDownloads(downloads.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d)))
              }}
            />
          )}
          {activeTab === 'settings' && <SettingsScreen onDownloadTap={() => setShowDownloadScreen(true)} />}
        </div>

        {/* Mini Player - hide when showing playlist detail screen */}
        {!selectedPlaylist && (
          <MiniPlayer
            content={currentMiniPlayerContent}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onTap={() => setShowPlayer(true)}
            onClose={() => {
              setPlayingItem(null)
              setIsPlaying(false)
              setShowPlayer(false)
              setPlaylistPlaybackMode(null)
            }}
            onToggleFavorite={() => {
              if (playingItem?.type === 'series') {
                if (playingItem.chapter) {
                  handleToggleChapterFavorite(playingItem.episode, playingItem.chapter)
                } else {
                  handleToggleEpisodeFavorite(playingItem.episode)
                }
              }
            }}
            onShowChapterList={() => {
              // Open full player with chapter list
              setShowPlayer(true)
              // We'll need to trigger the chapter list to open automatically
            }}
          />
        )}

        {/* Bottom Tab Navigation - hide when showing playlist detail screen */}
        {!selectedPlaylist && <BottomTab activeTab={activeTab} onTabChange={handleTabChange} />}

        {/* Full Player Screen */}
        {showPlayer &&
          playingItem &&
          (() => {
            // Convert standalone content to series/episode format for consistent player UI
            if (playingItem.type === 'content') {
              const dummySeries: Series = {
                id: `content-series-${playingItem.content.id}`,
                title: playingItem.content.title,
                description: playingItem.content.description || '',
                thumbnail: playingItem.content.thumbnail,
                type: playingItem.content.type,
                episodes: [],
                isFavorite: playingItem.content.isFavorite,
              }

              const dummyEpisode: Episode = {
                id: playingItem.content.id,
                title: playingItem.content.title,
                description: playingItem.content.description,
                duration: playingItem.content.duration,
                episodeNumber: 1,
                isCompleted: false,
                isFavorite: playingItem.content.isFavorite,
                thumbnail: playingItem.content.thumbnail,
                videoUrl: playingItem.content.type === 'video' ? playingItem.content.thumbnail : undefined,
              }

              return (
                <EpisodePlayer
                  series={dummySeries}
                  episode={dummyEpisode}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onClose={handleClosePlayer}
                  onNextEpisode={() => {}}
                  onPrevEpisode={() => {}}
                  hasNextEpisode={false}
                  hasPrevEpisode={false}
                  onToggleFavorite={(series) => handleToggleFavorite(playingItem.content)}
                  onToggleEpisodeFavorite={(episode) => handleToggleFavorite(playingItem.content)}
                  onPlayEpisode={handlePlayEpisode}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  onTimeUpdate={(time, dur) => {
                    setCurrentTime(time)
                    setDuration(dur)
                  }}
                />
              )
            }

            return (
              <EpisodePlayer
                series={playingItem.series}
                episode={playingItem.episode}
                chapter={playingItem.chapter}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onClose={handleClosePlayer}
                onNextEpisode={playlistPlaybackMode ? handlePlaylistNext : handleNextEpisode}
                onPrevEpisode={playlistPlaybackMode ? handlePlaylistPrev : handlePrevEpisode}
                onNextChapter={handleNextChapter}
                onPrevChapter={handlePrevChapter}
                hasNextEpisode={
                  playlistPlaybackMode
                    ? playlistPlaybackMode.isRepeatOn ||
                      playlistPlaybackMode.currentIndex < playlistPlaybackMode.order.length - 1
                    : (() => {
                        const sortedEpisodes = getSortedEpisodes(playingItem.series)
                        const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === playingItem.episode.id)
                        return currentIndex < sortedEpisodes.length - 1
                      })()
                }
                hasPrevEpisode={
                  playlistPlaybackMode
                    ? playlistPlaybackMode.currentIndex > 0
                    : (() => {
                        const sortedEpisodes = getSortedEpisodes(playingItem.series)
                        const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === playingItem.episode.id)
                        return currentIndex > 0
                      })()
                }
                onToggleFavorite={handleToggleFavorite}
                onToggleEpisodeFavorite={handleToggleEpisodeFavorite}
                onToggleChapterFavorite={handleToggleChapterFavorite}
                onPlayEpisode={handlePlayEpisode}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                onTimeUpdate={(time, dur) => {
                  setCurrentTime(time)
                  setDuration(dur)
                }}
                playlistMode={
                  playlistPlaybackMode
                    ? {
                        playlistName: playlistPlaybackMode.playlist.name,
                        playlistCoverImage: playlistPlaybackMode.playlist.coverImage,
                        playlistGradient: playlistPlaybackMode.playlist.gradient,
                      }
                    : undefined
                }
              />
            )
          })()}

        {/* Episode List Screen */}
        {selectedSeries && (
          <EpisodeListScreen
            series={selectedSeries}
            onBack={handleCloseEpisodeList}
            onPlayEpisode={handlePlayEpisode}
            onPlayAll={handlePlayAllEpisodes}
            playingEpisodeId={playingItem?.type === 'episode' ? playingItem.episode.id : undefined}
            playingChapterId={playingItem?.type === 'episode' ? playingItem.chapter?.id : undefined}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddToPlaylistRequest}
            onToggleEpisodeFavorite={handleToggleEpisodeFavorite}
            onToggleChapterFavorite={handleToggleChapterFavorite}
            onToggleSeriesFavorite={handleToggleFavorite}
            onAddSeriesToPlaylist={handleAddSeriesToPlaylist}
            onAddSeriesToQueue={handleAddSeriesToQueue}
          />
        )}

        {/* Content Detail Screen */}
        {selectedContent && (
          <ContentDetailScreen
            content={selectedContent}
            onBack={handleCloseDetail}
            onPlay={handlePlayContent}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Playlist Detail Screen */}
        {selectedPlaylist && (
          <PlaylistDetailScreen
            playlist={selectedPlaylist}
            onBack={handleClosePlaylistDetail}
            onPlayItem={(series, episode, chapter) => handlePlayEpisode(series, episode, chapter)}
            onPlayItemWithContext={handlePlayEpisodeFromPlaylist}
            onRemoveFromPlaylist={handleRemoveFromPlaylistByIndex}
            onPlayAll={() => handlePlayAllPlaylistItems(selectedPlaylist)}
            onReorderItems={handleReorderPlaylistItems}
            currentPlayingItem={playingItem}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onEditPlaylist={() => {
              setEditingPlaylist(selectedPlaylist)
              setShowCreatePlaylistDialog(true)
            }}
          />
        )}

        {/* Create Playlist Dialog */}
        {showCreatePlaylistDialog && (
          <CreatePlaylistDialog
            onCreate={handleCreatePlaylist}
            onUpdate={handleUpdatePlaylist}
            onClose={() => {
              setShowCreatePlaylistDialog(false)
              setEditingPlaylist(null)
            }}
            editingPlaylist={editingPlaylist ?? undefined}
          />
        )}

        {/* Add to Playlist Dialog */}
        {showAddToPlaylistDialog && !showCreatePlaylistDialog && (
          <AddToPlaylistDialog
            playlists={playlists}
            onSelect={handleSelectPlaylistForAdd}
            onClose={handleAddToPlaylistDialogClose}
            onCreatePlaylist={() => {
              setShowCreatePlaylistDialog(true)
            }}
          />
        )}

        {/* Queue Screen */}
        {showQueueScreen && (
          <QueueScreen
            queue={queue}
            onPlayEpisode={handlePlayEpisode}
            onRemoveFromQueue={handleRemoveFromQueue}
            onBack={() => setShowQueueScreen(false)}
          />
        )}

        {/* Account Screen */}
        {showAccountScreen && (
          <AccountScreen
            serviceAccounts={serviceAccounts}
            activeServiceAccountId={activeServiceAccountId}
            onClose={() => setShowAccountScreen(false)}
            onSwitchServiceAccount={(accountId) => {
              setActiveServiceAccountId(accountId)
            }}
            onAddServiceAccount={(userName, email, password, tenantCode) => {
              const newAccount: ServiceAccount = {
                id: `service-${Date.now()}`,
                userName,
                email,
                password,
                tenantCode,
                serviceName: `サービス ${serviceAccounts.length + 1}`,
              }
              setServiceAccounts([...serviceAccounts, newAccount])
            }}
            onRemoveServiceAccount={(accountId) => {
              setServiceAccounts(serviceAccounts.filter((acc) => acc.id !== accountId))
              if (activeServiceAccountId === accountId) {
                setActiveServiceAccountId(serviceAccounts[0]?.id || null)
              }
            }}
            onLogout={() => {
              console.log('Logout clicked')
              // Handle logout logic here
            }}
          />
        )}

        {/* Download Screen */}
        {showDownloadScreen && (
          <DownloadScreen
            downloads={downloads}
            onBack={() => setShowDownloadScreen(false)}
            onDelete={(ids) => {
              setDownloads(downloads.filter((d) => !ids.includes(d.id)))
            }}
            onToggleLock={(id) => {
              setDownloads(downloads.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d)))
            }}
            onPlay={(item) => {
              handlePlayEpisode(item.series, item.episode, item.chapter)
              setShowDownloadScreen(false)
            }}
          />
        )}

        {/* New Arrivals Screen */}
        {showNewArrivalsScreen && (
          <NewArrivalsScreen
            onBack={() => setShowNewArrivalsScreen(false)}
            onPlayContent={(content) => {
              handlePlayContent(content)
              setShowNewArrivalsScreen(false)
            }}
            onPlayEpisode={(series, episode, chapter) => {
              handlePlayEpisode(series, episode, chapter)
              setShowNewArrivalsScreen(false)
            }}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
