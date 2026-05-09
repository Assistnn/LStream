import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ContextMenu, type ContextMenuItem } from '../../../components/ui/ContextMenu'
import { EmptyState } from '../../../components/ui/EmptyState'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'
import type { Playlist, PlaylistItem } from '../../../repositories/playlist'
import { PlaylistRepository } from '../../../repositories/playlist'
import { AddToPlaylistModal } from './components/AddToPlaylistModal'
import { CreatePlaylistModal } from './components/CreatePlaylistModal'
import { PlaylistCover } from './components/PlaylistCover'
import { ITEM_HEIGHT, PlaylistItemRow } from './components/PlaylistItemRow'
import type { PlaylistStackParamList } from './types'
import { usePlaylists } from './usePlaylists'
import { formatAlarmTime, formatTotalDuration, getTotalDuration, toPlayableTrack } from './utils'

type Props = NativeStackScreenProps<PlaylistStackParamList, 'PlaylistDetail'>

export const PlaylistDetailScreen = ({ route }: Props) => {
  const { playlistId } = route.params
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<PlaylistStackParamList>>()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const { playlists, setPlaylists } = usePlaylists()
  const {
    currentContent,
    state,
    controls,
    settings,
    navigation: playerNav,
    playingPlaylistId,
    queueActions,
  } = usePlayer()

  const playlist = useMemo<Playlist | undefined>(
    () => playlists.find((p) => p.id === playlistId),
    [playlists, playlistId],
  )

  const [headerMenuVisible, setHeaderMenuVisible] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [itemMenuVisible, setItemMenuVisible] = useState(false)
  const [itemMenuTarget, setItemMenuTarget] = useState<PlaylistItem | null>(null)
  const [itemMenuAnchorY, setItemMenuAnchorY] = useState<number | undefined>(undefined)
  const [addToPlaylistItem, setAddToPlaylistItem] = useState<Omit<PlaylistItem, 'id'> | null>(null)
  const [activeSwipeRowId, setActiveSwipeRowId] = useState<string | null>(null)

  // Drag-and-drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const dragStartIndexRef = useRef<number>(-1)
  const dragDyRef = useRef(0)
  const dragTranslate = useRef(new Animated.Value(0)).current

  const handleDragStart = (index: number) => {
    dragStartIndexRef.current = index
    dragDyRef.current = 0
    dragTranslate.setValue(0)
    setDraggingIndex(index)
    setTargetIndex(index)
  }

  const handleDragMove = (dy: number) => {
    dragDyRef.current = dy
    dragTranslate.setValue(dy)
    if (dragStartIndexRef.current < 0 || !playlist) return
    const offset = Math.round(dy / ITEM_HEIGHT)
    const raw = dragStartIndexRef.current + offset
    const clamped = Math.max(0, Math.min(playlist.items.length - 1, raw))
    setTargetIndex(clamped)
  }

  const handleDragEnd = () => {
    if (
      playlist &&
      dragStartIndexRef.current >= 0 &&
      targetIndex !== null &&
      targetIndex !== dragStartIndexRef.current
    ) {
      setPlaylists(
        PlaylistRepository.reorderPlaylistItems(playlists, playlist.id, dragStartIndexRef.current, targetIndex),
      )
    }
    setDraggingIndex(null)
    setTargetIndex(null)
    dragStartIndexRef.current = -1
    dragDyRef.current = 0
    dragTranslate.setValue(0)
  }

  if (!playlist) {
    return (
      <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState title='プレイリストが見つかりません' />
      </View>
    )
  }

  const total = getTotalDuration(playlist)
  const itemsCount = playlist.items.length

  const isPlayingThisPlaylist = playingPlaylistId === playlist.id

  const currentPlayingIndex = (() => {
    if (!currentContent || !isPlayingThisPlaylist) return -1
    return playlist.items.findIndex(
      (i) =>
        i.episodeId === currentContent.episodeId && (i.unitId ?? undefined) === (currentContent.unitId ?? undefined),
    )
  })()
  const isActuallyPlaying = isPlayingThisPlaylist && state.playbackState === 'playing'

  const headerMenuItems: ContextMenuItem[] = [
    {
      label: '編集',
      onPress: () => setEditOpen(true),
    },
    {
      label: '削除',
      onPress: () => {
        Alert.alert('プレイリストを削除', `「${playlist.name}」を削除しますか？`, [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除',
            style: 'destructive',
            onPress: () => {
              setPlaylists(PlaylistRepository.deletePlaylist(playlists, playlist.id))
              navigation.goBack()
            },
          },
        ])
      },
    },
  ]

  const openItemMenu = (item: PlaylistItem, anchorY: number) => {
    setItemMenuTarget(item)
    setItemMenuAnchorY(anchorY)
    setItemMenuVisible(true)
  }

  const itemMenuItems: ContextMenuItem[] = itemMenuTarget
    ? [
        {
          label: '再生キューに追加',
          onPress: () => {
            queueActions.addToQueue({
              trackId: itemMenuTarget.episodeId,
              childId: itemMenuTarget.unitId,
              title: itemMenuTarget.title,
              parentTitle: itemMenuTarget.seriesTitle,
              thumbnail: itemMenuTarget.thumbnail,
              duration: itemMenuTarget.duration,
              url: itemMenuTarget.url,
              mediaType: itemMenuTarget.mediaType,
            })
          },
        },
        {
          label: '他のプレイリストに追加',
          onPress: () => {
            setAddToPlaylistItem({
              seriesId: itemMenuTarget.seriesId,
              episodeId: itemMenuTarget.episodeId,
              unitId: itemMenuTarget.unitId,
              title: itemMenuTarget.title,
              seriesTitle: itemMenuTarget.seriesTitle,
              thumbnail: itemMenuTarget.thumbnail,
              duration: itemMenuTarget.duration,
              url: itemMenuTarget.url,
              mediaType: itemMenuTarget.mediaType,
            })
          },
        },
        {
          label: 'プレイリストから削除',
          onPress: () => {
            setPlaylists(PlaylistRepository.removeItemFromPlaylist(playlists, playlist.id, itemMenuTarget.id))
          },
        },
      ]
    : []

  const LoopIcon = settings.loopMode === 'single' ? Repeat1 : Repeat
  const loopActive = settings.loopMode !== 'off'
  const cycleLoop = () => {
    const next = settings.loopMode === 'off' ? 'all' : settings.loopMode === 'all' ? 'single' : 'off'
    settings.setLoopMode(next)
  }

  const tracks = useMemo(() => playlist.items.map(toPlayableTrack), [playlist.items])

  const playItemAt = (index: number, keepPlaybackState = false) => {
    const target = playlist.items[index]
    playerNav.playFromList(tracks, target.episodeId, target.unitId, { playlistId: playlist.id, keepPlaybackState })
  }

  const playOrPause = () => {
    if (itemsCount === 0) return
    if (!isPlayingThisPlaylist) {
      playItemAt(Math.max(0, currentPlayingIndex))
      return
    }
    if (isActuallyPlaying) controls.pause()
    else controls.resume()
  }

  const playPrev = () => {
    if (itemsCount === 0 || !isPlayingThisPlaylist) return
    playItemAt(currentPlayingIndex > 0 ? currentPlayingIndex - 1 : itemsCount - 1, true)
  }
  const playNext = () => {
    if (itemsCount === 0 || !isPlayingThisPlaylist) return
    playItemAt(currentPlayingIndex < itemsCount - 1 ? currentPlayingIndex + 1 : 0, true)
  }

  // Build the display list preserving order, but shifting the dragging item visually to targetIndex
  const displayItems = (() => {
    if (draggingIndex === null || targetIndex === null) return playlist.items.map((item, idx) => ({ item, idx }))
    const arr = playlist.items.slice()
    const [moved] = arr.splice(draggingIndex, 1)
    arr.splice(targetIndex, 0, moved)
    return arr.map((item) => ({ item, idx: playlist.items.findIndex((p) => p.id === item.id) }))
  })()

  return (
    <View style={[styles.screenContainer]}>
      {/* Header with cover background */}
      <View style={{ overflow: 'hidden' }}>
        <PlaylistCover
          gradient={playlist.gradient}
          coverImage={playlist.coverImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <View style={{ paddingTop: insets.top, paddingHorizontal: '5%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
              <ChevronDown size={24} color='#FFFFFF' />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={{ padding: 8 }}>
              <MoreVertical size={24} color='#FFFFFF' />
            </TouchableOpacity>
          </View>

          <View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
              }}
              numberOfLines={2}
            >
              {playlist.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.9)',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 8,
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {playlist.description || ' '}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 15,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 12,
                  textShadowColor: 'rgba(0,0,0,0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 8,
                }}
              >
                {itemsCount}メディア
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 12,
                  textShadowColor: 'rgba(0,0,0,0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 8,
                }}
              >
                合計{formatTotalDuration(total)}
              </Text>
            </View>
            {playlist.alarm?.enabled && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Clock size={12} color='#FFFFFF' />
                <Text style={{ color: '#FFFFFF', fontSize: 12 }}>{formatAlarmTime(playlist.alarm)}</Text>
              </View>
            )}
          </View>
          <View style={{ height: spacing.md }} />
        </View>

        {itemsCount > 0 && (
          <View style={{ paddingHorizontal: '5%', paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={playPrev}
                disabled={currentPlayingIndex <= 0 && !loopActive}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    currentPlayingIndex <= 0 && !loopActive ? 'rgba(17,24,39,0.2)' : 'rgba(17,24,39,0.3)',
                }}
              >
                <ChevronLeft
                  size={16}
                  color={currentPlayingIndex <= 0 && !loopActive ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={playOrPause}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  backgroundColor: isActuallyPlaying ? '#111827' : 'rgba(17,24,39,0.3)',
                }}
              >
                {isActuallyPlaying ? (
                  <Pause size={16} color='#FFFFFF' fill='#FFFFFF' />
                ) : (
                  <Play size={16} color='#FFFFFF' fill='#FFFFFF' />
                )}
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                  {isActuallyPlaying ? '停止' : '再生'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={playNext}
                disabled={currentPlayingIndex >= itemsCount - 1 && !loopActive}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    currentPlayingIndex >= itemsCount - 1 && !loopActive ? 'rgba(17,24,39,0.2)' : 'rgba(17,24,39,0.3)',
                }}
              >
                <ChevronRight
                  size={16}
                  color={currentPlayingIndex >= itemsCount - 1 && !loopActive ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => settings.setShuffleOn(!settings.isShuffleOn)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: settings.isShuffleOn ? '#111827' : 'rgba(17,24,39,0.3)',
                }}
              >
                <Shuffle size={16} color='#FFFFFF' />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={cycleLoop}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: loopActive ? '#111827' : 'rgba(17,24,39,0.3)',
                }}
              >
                <LoopIcon size={16} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Items */}
      <ScrollView scrollEnabled={draggingIndex === null} contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        {itemsCount === 0 ? (
          <EmptyState
            icon={Play}
            title='プレイリストが空です'
            description='エピソードやチャプターをプレイリストに追加してください'
          />
        ) : (
          <View style={{ position: 'relative' }}>
            {displayItems.map(({ item, idx }) => (
              <PlaylistItemRow
                key={item.id}
                playlistId={playlist.id}
                item={item}
                index={idx}
                isPlaying={currentPlayingIndex === idx}
                isDragging={draggingIndex === idx}
                onPress={() => playItemAt(idx)}
                onMenuPress={() => openItemMenu(item, insets.top + 300 + idx * ITEM_HEIGHT)}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onRemove={() =>
                  setPlaylists(PlaylistRepository.removeItemFromPlaylist(playlists, playlist.id, item.id))
                }
                activeSwipeRowId={activeSwipeRowId}
                setActiveSwipeRowId={setActiveSwipeRowId}
              />
            ))}

            {/* Floating ghost row while dragging */}
            {draggingIndex !== null && (
              <Animated.View
                pointerEvents='none'
                style={{
                  position: 'absolute',
                  top: draggingIndex * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                  transform: [{ translateY: dragTranslate }],
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.lg,
                  opacity: 0.9,
                  elevation: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }}
              >
                <PlaylistItemRow
                  key='ghost'
                  playlistId={playlist.id}
                  item={playlist.items[draggingIndex]}
                  index={draggingIndex}
                  isPlaying={currentPlayingIndex === draggingIndex}
                  isDragging={false}
                  onPress={() => {}}
                  onMenuPress={() => {}}
                  onDragStart={() => {}}
                  onDragMove={() => {}}
                  onDragEnd={() => {}}
                  onRemove={() => {}}
                  activeSwipeRowId={null}
                  setActiveSwipeRowId={() => {}}
                />
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Header menu */}
      <ContextMenu
        visible={headerMenuVisible}
        items={headerMenuItems}
        onClose={() => setHeaderMenuVisible(false)}
        position='right'
        anchorY={insets.top + spacing.xl}
      />

      {/* Item menu */}
      <ContextMenu
        visible={itemMenuVisible}
        items={itemMenuItems}
        onClose={() => {
          setItemMenuVisible(false)
          setItemMenuTarget(null)
        }}
        position='right'
        anchorY={itemMenuAnchorY}
      />

      {/* Edit modal */}
      <CreatePlaylistModal
        visible={editOpen}
        editing={playlist}
        onClose={() => setEditOpen(false)}
        onSubmit={(payload) => {
          setPlaylists(
            PlaylistRepository.updatePlaylist(playlists, playlist.id, {
              name: payload.name,
              description: payload.description,
              coverImage: payload.coverImage,
              alarm: payload.alarm,
            }),
          )
          setEditOpen(false)
        }}
      />

      {/* Add to another playlist */}
      <AddToPlaylistModal
        visible={addToPlaylistItem !== null}
        item={addToPlaylistItem}
        onClose={() => setAddToPlaylistItem(null)}
      />
    </View>
  )
}
