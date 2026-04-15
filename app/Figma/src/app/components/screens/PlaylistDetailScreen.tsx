import {
  ChevronDown,
  Clock,
  Download,
  FileText,
  GripVertical,
  MoreVertical,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import type { Chapter, Content, Episode, Playlist, PlaylistItem, Series } from '@/data/mockData'
import { formatDuration } from '@/data/mockData'

// Animated audio indicator component
function AudioIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className='flex items-center justify-center gap-[3px] h-5'>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className='w-[3px] bg-white rounded-full'
          style={{
            height: '100%',
            animation: isPlaying ? `audioBar 0.8s ease-in-out ${i * 0.15}s infinite` : 'none',
            transform: isPlaying ? 'scaleY(0.3)' : 'scaleY(1)',
          }}
        />
      ))}
      <style>{`
        @keyframes audioBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

type PlayingItem =
  | { type: 'content'; content: Content }
  | { type: 'episode'; series: Series; episode: Episode; chapter?: Chapter }

interface PlaylistDetailScreenProps {
  playlist: Playlist
  onBack: () => void
  onPlayItem: (series: Series, episode: Episode, chapter?: Chapter) => void
  onPlayItemWithContext?: (
    playlist: Playlist,
    playOrder: number[],
    index: number,
    isShuffled: boolean,
    isRepeat: boolean,
  ) => void
  onRemoveFromPlaylist: (index: number) => void
  onPlayAll: () => void
  onReorderItems?: (playlistId: string, newOrder: PlaylistItem[]) => void
  currentPlayingItem?: PlayingItem | null
  isPlaying?: boolean
  currentTime?: number
  duration?: number
  onEditPlaylist?: () => void
}

interface DraggableItemProps {
  item: PlaylistItem
  index: number
  swipedItem: number | null
  swipeDirection: 'left' | 'right' | null
  touchStart: { x: number; y: number } | null
  touchOffset: number
  onTouchStart: (e: React.TouchEvent, index: number) => void
  onTouchMove: (e: React.TouchEvent, index: number) => void
  onTouchEnd: (index: number) => void
  onItemClick: (item: PlaylistItem, index: number) => void
  onDelete: (e: React.MouseEvent, index: number) => void
  onReorder: (dragIndex: number, hoverIndex: number) => void
  isCurrentlyPlaying: boolean
  isPlaying?: boolean
  currentTime?: number
  duration?: number
  itemRef?: (element: HTMLDivElement | null) => void
  showMenu: number | null
  onMenuToggle: (index: number) => void
  onAddToQueue: (series: Series, episode: Episode, chapter?: Chapter) => void
  onDownload: (episode: Episode, chapter?: Chapter) => void
  onAddToPlaylist: (series: Series, episode: Episode, chapter?: Chapter) => void
  menuRef: React.RefObject<HTMLDivElement>
}

function DraggableItem({
  item,
  index,
  swipedItem,
  swipeDirection,
  touchStart,
  touchOffset,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onItemClick,
  onDelete,
  onReorder,
  isCurrentlyPlaying,
  isPlaying,
  currentTime,
  duration,
  itemRef,
  showMenu,
  onMenuToggle,
  onAddToQueue,
  onDownload,
  onAddToPlaylist,
  menuRef,
}: DraggableItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'PLAYLIST_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'PLAYLIST_ITEM',
    hover(draggedItem: { index: number }, monitor) {
      if (!ref.current) {
        return
      }

      const dragIndex = draggedItem.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()

      if (!clientOffset) {
        return
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      onReorder(dragIndex, hoverIndex)
      draggedItem.index = hoverIndex
    },
  })

  drag(drop(ref))

  const isThisSwiped = swipedItem === index
  const currentOffset = isThisSwiped ? touchOffset : 0

  return (
    <div
      ref={itemRef}
      key={`${item.episode.id}-${item.chapter?.id || 'episode'}-${index}`}
      className='relative overflow-hidden border-b border-gray-200 dark:border-gray-700'
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Swipe Action Background */}
      {isThisSwiped && swipeDirection === 'left' && (
        <div className='absolute inset-0 flex items-center justify-end bg-red-500'>
          <button
            onClick={(e) => onDelete(e, index)}
            className='h-full px-6 flex items-center justify-center text-white font-semibold'
          >
            削除
          </button>
        </div>
      )}

      {/* Item Content */}
      <div
        ref={ref}
        className={`transition-colors relative ${
          isCurrentlyPlaying
            ? 'bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900/70'
            : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onTouchStart={(e) => onTouchStart(e, index)}
        onTouchMove={(e) => onTouchMove(e, index)}
        onTouchEnd={() => onTouchEnd(index)}
        style={{
          transform: `translateX(${currentOffset}px)`,
          transition: touchStart ? 'none' : 'transform 0.3s ease-out',
          cursor: 'move',
        }}
      >
        <div className='flex items-center gap-3 px-[5%] py-2'>
          {/* Drag Handle */}
          <div className='flex-shrink-0'>
            <GripVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
          </div>

          {/* Thumbnail */}
          <button onClick={() => onItemClick(item, index)} className='relative w-14 h-14 flex-shrink-0 group'>
            {item.series.thumbnail ? (
              <img
                src={item.series.thumbnail}
                alt={item.series.title}
                className='w-full h-full rounded-md object-cover'
              />
            ) : (
              <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                <span className='text-xl'>📚</span>
              </div>
            )}
            {/* Hover Play Icon */}
            <div
              className={`absolute inset-0 bg-black/40 rounded-md flex items-center justify-center transition-opacity ${
                isCurrentlyPlaying ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <Play className='w-5 h-5 text-white' />
            </div>
            {/* Currently Playing Indicator */}
            {isCurrentlyPlaying && (
              <div className='absolute inset-0 bg-black/40 rounded-md flex items-center justify-center'>
                <AudioIndicator isPlaying={isPlaying ?? false} />
              </div>
            )}
          </button>

          {/* Content Info */}
          <div className='flex-1 min-w-0 cursor-pointer' onClick={() => onItemClick(item, index)}>
            <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
              {item.chapter ? (
                <>
                  <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>
                    Ep.{item.episode.episodeNumber} Un.{item.chapter.chapterNumber}
                  </span>
                  {item.chapter.title}
                </>
              ) : (
                <>
                  <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>
                    Ep.{item.episode.episodeNumber}
                  </span>
                  {item.episode.title}
                </>
              )}
            </h4>
            <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>{item.series.title}</p>
            {isCurrentlyPlaying && currentTime !== undefined && duration !== undefined ? (
              <div className='h-5 flex items-center gap-2'>
                {/* Progress Bar */}
                <div className='flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300'
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                {/* Time Display - Fixed width for 1:00:10 format */}
                <span
                  className='text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap'
                  style={{ minWidth: '65px', textAlign: 'right' }}
                >
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>
            ) : (
              <div className='h-5 flex items-center gap-2 text-[10px] font-semibold'>
                <span className='text-gray-700 dark:text-gray-300'>
                  {formatDuration(item.chapter?.duration || item.episode.duration)}
                </span>
                {(item.chapter?.playCount || item.episode.playCount) > 0 && (
                  <span className='text-purple-700 dark:text-purple-400'>
                    {(item.chapter?.playCount || item.episode.playCount).toLocaleString()}回再生
                  </span>
                )}
                <span className='text-gray-500 dark:text-gray-400'>
                  {item.series.type === 'audio' ? '音声' : '動画'}
                </span>
              </div>
            )}
          </div>

          {/* Download Icon */}
          {(item.chapter?.isDownloaded || item.episode.isDownloaded) && (
            <div className='flex-shrink-0 flex items-center justify-center'>
              <Download className='w-4 h-4 text-blue-600 dark:text-blue-400' />
            </div>
          )}

          {/* Menu Button */}
          <div className='flex flex-col gap-1 items-center flex-shrink-0'>
            <button
              onClick={() => onMenuToggle(index)}
              className='p-2 -mr-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-full transition-colors'
            >
              <MoreVertical className='w-6 h-6 text-white' />
            </button>

            {/* Dropdown Menu */}
            {showMenu === index && (
              <>
                {/* Backdrop to close menu */}
                <div className='fixed inset-0 z-20' onClick={() => onMenuToggle(index)} />

                {/* Menu */}
                <div
                  className='absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-30'
                  ref={menuRef}
                >
                  <button
                    onClick={() => {
                      onMenuToggle(index)
                      // TODO: Add edit functionality
                      if (onEditPlaylist) {
                        onEditPlaylist()
                      } else {
                        alert('プレイリストを編集')
                      }
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      onMenuToggle(index)
                      onAddToQueue(item.series, item.episode, item.chapter)
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  >
                    キューに追加
                  </button>
                  <button
                    onClick={() => {
                      onMenuToggle(index)
                      onDownload(item.episode, item.chapter)
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  >
                    ダウンロード
                  </button>
                  <button
                    onClick={() => {
                      onMenuToggle(index)
                      onAddToPlaylist(item.series, item.episode, item.chapter)
                    }}
                    className='w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  >
                    他のプレイリストに追加
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlaylistDetailScreen({
  playlist,
  onBack,
  onPlayItem,
  onPlayItemWithContext,
  onRemoveFromPlaylist,
  onPlayAll,
  onReorderItems,
  currentPlayingItem,
  isPlaying,
  currentTime,
  duration,
  onEditPlaylist,
}: PlaylistDetailScreenProps) {
  const [swipedItem, setSwipedItem] = useState<number | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchOffset, setTouchOffset] = useState(0)
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [isRepeatOn, setIsRepeatOn] = useState(false)
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null)
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([])
  const [showMenu, setShowMenu] = useState<number | null>(null)

  // Refs for scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // Auto-scroll to current playing item
  useEffect(() => {
    if (currentPlayingIndex !== null && scrollContainerRef.current && itemRefs.current[currentPlayingIndex]) {
      const container = scrollContainerRef.current
      const item = itemRefs.current[currentPlayingIndex]

      if (item) {
        const containerRect = container.getBoundingClientRect()
        const itemRect = item.getBoundingClientRect()

        // Calculate the target scroll position
        // Position the item at about 3 items from the bottom
        const itemHeight = itemRect.height
        const targetOffset = containerRect.height - itemHeight * 3.5

        // Calculate scroll amount needed
        const itemOffsetTop = item.offsetTop
        const targetScrollTop = itemOffsetTop - targetOffset

        // Smooth scroll to position
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        })
      }
    }
  }, [currentPlayingIndex])

  // Initialize shuffled order when shuffle is turned on
  const handleShuffleToggle = () => {
    const newShuffleState = !isShuffleOn
    setIsShuffleOn(newShuffleState)

    if (newShuffleState) {
      // Create shuffled order
      const indices = playlist.items.map((_, i) => i)

      if (currentPlayingIndex !== null) {
        // If there's a current item, keep it as the first item
        // and shuffle the rest
        const otherIndices = indices.filter((i) => i !== currentPlayingIndex)
        const shuffledOthers = [...otherIndices].sort(() => Math.random() - 0.5)
        const shuffled = [currentPlayingIndex, ...shuffledOthers]
        setShuffledOrder(shuffled)
      } else {
        // No current item - shuffle all items
        const shuffled = [...indices].sort(() => Math.random() - 0.5)
        setShuffledOrder(shuffled)
      }
    } else {
      setShuffledOrder([])
    }
  }

  // Re-shuffle when reaching the end and repeat is on
  const performReshuffle = () => {
    const indices = playlist.items.map((_, i) => i)
    const shuffled = [...indices].sort(() => Math.random() - 0.5)
    setShuffledOrder(shuffled)
    return shuffled
  }

  // Handle play/pause toggle
  const handlePlayToggle = () => {
    const newPlayingState = !isPlayingPlaylist
    setIsPlayingPlaylist(newPlayingState)

    if (newPlayingState) {
      // Start playing
      if (playlist.items.length > 0) {
        let indexToPlay = 0

        if (isShuffleOn && shuffledOrder.length > 0) {
          // Play first item in shuffled order
          indexToPlay = shuffledOrder[0]
        }

        setCurrentPlayingIndex(indexToPlay)
        // Don't call onPlayItem to prevent navigating to player screen
        // Just update internal state for playlist playback
      }
    } else {
      // Stop playing
      setCurrentPlayingIndex(null)
    }
  }

  // Play next item in playlist
  const playNextItem = () => {
    if (!isPlayingPlaylist || playlist.items.length === 0) return

    let nextIndex: number | null = null

    if (isShuffleOn && shuffledOrder.length > 0) {
      // Find current position in shuffled order
      const currentShuffledPos = shuffledOrder.indexOf(currentPlayingIndex ?? 0)
      if (currentShuffledPos < shuffledOrder.length - 1) {
        nextIndex = shuffledOrder[currentShuffledPos + 1]
      } else if (isRepeatOn) {
        // Re-shuffle and play first item
        const newShuffledOrder = performReshuffle()
        nextIndex = newShuffledOrder[0]
      }
    } else {
      // Normal sequential play
      if (currentPlayingIndex !== null && currentPlayingIndex < playlist.items.length - 1) {
        nextIndex = currentPlayingIndex + 1
      } else if (isRepeatOn && currentPlayingIndex === playlist.items.length - 1) {
        // Loop back to beginning if repeat is on
        nextIndex = 0
      }
    }

    if (nextIndex !== null) {
      setCurrentPlayingIndex(nextIndex)
      const item = playlist.items[nextIndex]
      if (onPlayItemWithContext) {
        // If shuffle is off, use normal sequential order [0, 1, 2, ...]
        const playOrder = isShuffleOn && shuffledOrder.length > 0 ? shuffledOrder : playlist.items.map((_, i) => i)
        onPlayItemWithContext(playlist, playOrder, nextIndex, isShuffleOn, isRepeatOn)
      } else {
        onPlayItem(item.series, item.episode, item.chapter)
      }
    } else {
      // Reached end of playlist
      if (isRepeatOn) {
        // Repeat from the beginning
        nextIndex = 0
        setCurrentPlayingIndex(nextIndex)
        const item = playlist.items[nextIndex]
        if (onPlayItemWithContext) {
          // If shuffle is off, use normal sequential order [0, 1, 2, ...]
          const playOrder = isShuffleOn && shuffledOrder.length > 0 ? shuffledOrder : playlist.items.map((_, i) => i)
          onPlayItemWithContext(playlist, playOrder, nextIndex, isShuffleOn, isRepeatOn)
        } else {
          onPlayItem(item.series, item.episode, item.chapter)
        }
      } else {
        setIsPlayingPlaylist(false)
        setCurrentPlayingIndex(null)
      }
    }
  }

  // Handle previous track
  const handlePrevious = () => {
    if (playlist.items.length === 0) return

    let prevIndex: number | null = null

    if (isShuffleOn && shuffledOrder.length > 0) {
      // Find current position in shuffled order
      const currentShuffledPos = shuffledOrder.indexOf(currentPlayingIndex ?? 0)
      if (currentShuffledPos > 0) {
        prevIndex = shuffledOrder[currentShuffledPos - 1]
      } else if (isRepeatOn) {
        // Loop to end if repeat is on
        prevIndex = shuffledOrder[shuffledOrder.length - 1]
      }
    } else {
      // Normal sequential play
      if (currentPlayingIndex !== null && currentPlayingIndex > 0) {
        prevIndex = currentPlayingIndex - 1
      } else if (isRepeatOn && currentPlayingIndex === 0) {
        // Loop to end if repeat is on
        prevIndex = playlist.items.length - 1
      } else if (currentPlayingIndex === null && isRepeatOn) {
        // Start from end if no current index and repeat is on
        prevIndex = playlist.items.length - 1
      }
    }

    if (prevIndex !== null) {
      setCurrentPlayingIndex(prevIndex)
      // Don't auto-play - just move position
    }
  }

  // Handle next track
  const handleNext = () => {
    if (playlist.items.length === 0) return

    let nextIndex: number | null = null

    if (isShuffleOn && shuffledOrder.length > 0) {
      // Find current position in shuffled order
      const currentShuffledPos = currentPlayingIndex !== null ? shuffledOrder.indexOf(currentPlayingIndex) : -1

      if (currentShuffledPos < shuffledOrder.length - 1) {
        nextIndex = shuffledOrder[currentShuffledPos + 1]
      } else if (isRepeatOn) {
        // Re-shuffle when reaching the end if repeat is on
        const newShuffledOrder = performReshuffle()
        nextIndex = newShuffledOrder[0]
      }
    } else {
      // Normal sequential play
      if (currentPlayingIndex !== null && currentPlayingIndex < playlist.items.length - 1) {
        nextIndex = currentPlayingIndex + 1
      } else if (currentPlayingIndex === null) {
        nextIndex = 0
      } else if (isRepeatOn && currentPlayingIndex === playlist.items.length - 1) {
        // Loop back to beginning if repeat is on
        nextIndex = 0
      }
    }

    if (nextIndex !== null) {
      setCurrentPlayingIndex(nextIndex)
      // Don't auto-play - just move position
    }
  }

  // Check if previous button should be disabled
  const isPreviousDisabled = () => {
    if (playlist.items.length === 0) return true
    if (isRepeatOn) return false // Never disabled if repeat is on

    if (isShuffleOn && shuffledOrder.length > 0) {
      const currentShuffledPos = shuffledOrder.indexOf(currentPlayingIndex ?? 0)
      return currentShuffledPos <= 0
    }

    return currentPlayingIndex === null || currentPlayingIndex === 0
  }

  // Check if next button should be disabled
  const isNextDisabled = () => {
    if (playlist.items.length === 0) return true
    if (isRepeatOn) return false // Never disabled if repeat is on

    if (isShuffleOn && shuffledOrder.length > 0) {
      const currentShuffledPos = shuffledOrder.indexOf(currentPlayingIndex ?? 0)
      return currentShuffledPos >= shuffledOrder.length - 1
    }

    return currentPlayingIndex === playlist.items.length - 1
  }

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    })
    setSwipedItem(index)
    setTouchOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!touchStart || swipedItem !== index) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStart.x
    const diffY = currentY - touchStart.y

    // Only allow horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault()

      // Limit swipe distance - only allow left swipe
      const maxSwipe = 80
      const limitedOffset = Math.max(-maxSwipe, Math.min(0, diffX))
      setTouchOffset(limitedOffset)

      if (limitedOffset < -30) {
        setSwipeDirection('left')
      } else {
        setSwipeDirection(null)
      }
    }
  }

  const handleTouchEnd = (index: number) => {
    if (swipedItem !== index) return

    if (swipeDirection === 'left' && Math.abs(touchOffset) > 30) {
      // Keep the swiped state
      setTouchOffset(-80)
    } else {
      // Reset if swipe was not significant
      setSwipedItem(null)
      setSwipeDirection(null)
      setTouchOffset(0)
    }

    setTouchStart(null)
  }

  const handleItemClick = (item: PlaylistItem, index: number) => {
    if (swipedItem === index && swipeDirection) {
      // If swiped, close the swipe
      setSwipedItem(null)
      setSwipeDirection(null)
      setTouchOffset(0)
    } else if (!touchStart) {
      // Otherwise play the item (only if not currently touching)
      if (onPlayItemWithContext) {
        // If shuffle is off, use normal sequential order [0, 1, 2, ...]
        const playOrder = isShuffleOn && shuffledOrder.length > 0 ? shuffledOrder : playlist.items.map((_, i) => i)
        onPlayItemWithContext(playlist, playOrder, index, isShuffleOn, isRepeatOn)
      } else {
        onPlayItem(item.series, item.episode, item.chapter)
      }
    }
  }

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onRemoveFromPlaylist(index)
    setSwipedItem(null)
    setSwipeDirection(null)
    setTouchOffset(0)
  }

  const formatAlarmTime = (): string => {
    if (!playlist.alarm?.enabled) return ''

    const days = playlist.alarm.days
    const dayLabels: Record<string, string> = {
      sun: '日',
      mon: '月',
      tue: '火',
      wed: '水',
      thu: '木',
      fri: '金',
      sat: '土',
    }

    const dayText = days.map((d) => dayLabels[d]).join('・')
    return `${dayText} ${playlist.alarm.time}`
  }

  const getTotalDuration = (): number => {
    return playlist.items.reduce((total, item) => {
      const itemDuration = item.chapter?.duration || item.episode.duration
      return total + itemDuration
    }, 0)
  }

  const reorderItems = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...playlist.items]
    const [draggedItem] = newOrder.splice(dragIndex, 1)
    newOrder.splice(hoverIndex, 0, draggedItem)

    if (onReorderItems) {
      onReorderItems(playlist.id, newOrder)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='fixed top-0 left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-30 flex flex-col max-w-[460px] mx-auto'>
        <style>{`
          .playlist-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
          .playlist-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        {/* Header with Cover Image Background */}
        <div className='relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          {/* Background Layer */}
          <div className='absolute inset-0 overflow-hidden'>
            {playlist.coverImage ? (
              <>
                {/* Cover Image */}
                <img
                  src={playlist.coverImage}
                  alt=''
                  className='w-full h-full object-cover'
                  style={{ objectPosition: 'center' }}
                />
                {/* Gradient Overlay - starts at 20% from top */}
                <div className='absolute inset-0 bg-gradient-to-b from-transparent from-20% via-black/40 via-60% to-black/70' />
              </>
            ) : (
              /* Gradient Background when no cover image */
              <div className='absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500' />
            )}
          </div>

          {/* Header Content */}
          <div className='relative px-[5%] pt-2 pb-4'>
            {/* Back Button - Absolute positioned */}
            <button
              onClick={onBack}
              className='absolute top-2 left-[5%] p-2 -ml-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-full transition-colors z-10'
            >
              <ChevronDown className='w-6 h-6 text-white' />
            </button>

            {/* Menu Button - Absolute positioned */}
            <div className='absolute top-2 right-[5%] z-10'>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className='p-2 -mr-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-full transition-colors'
              >
                <MoreVertical className='w-6 h-6 text-white' />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div className='fixed inset-0 z-20' onClick={() => setShowMenu(false)} />

                  {/* Menu */}
                  <div className='absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-30'>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        // TODO: Add edit functionality
                        if (onEditPlaylist) {
                          onEditPlaylist()
                        } else {
                          alert('プレイリストを編集')
                        }
                      }}
                      className='w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                    >
                      編集
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Title Section */}
            <div className='mt-[30px] min-[321px]:mt-[40px]'>
              <h1
                className='font-bold text-white -ml-3 pl-3 -mr-3 pr-3'
                style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)', overflow: 'visible' }}
              >
                <span className='block overflow-hidden text-ellipsis whitespace-nowrap pl-3 -ml-3'>
                  {playlist.name}
                </span>
              </h1>
              {/* Description with fixed height */}
              <div className='h-8 mt-1'>
                {playlist.description && (
                  <p
                    className='text-sm text-white/90 line-clamp-2'
                    style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)' }}
                  >
                    {playlist.description.length > 40
                      ? `${playlist.description.substring(0, 40)}...`
                      : playlist.description}
                  </p>
                )}
              </div>
              {/* Total items and duration - fixed position */}
              <div
                className='flex items-center gap-1 text-xs mt-[15px] text-white/60'
                style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)' }}
              >
                <span>{playlist.items.length}メディア</span>
                <span>合計{formatDuration(getTotalDuration())}</span>
              </div>
              {playlist.alarm?.enabled && (
                <div className='flex items-center gap-1 text-xs mt-1 text-white'>
                  <Clock className='w-3 h-3' />
                  <span>{formatAlarmTime()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Play Controls */}
          {playlist.items.length > 0 && (
            <div className='relative px-[5%] pb-4'>
              <div className='flex gap-2'>
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={isPreviousDisabled()}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors ${
                    isPreviousDisabled()
                      ? 'bg-white/20 dark:bg-gray-900/20 text-white/40 dark:text-white/40 cursor-not-allowed'
                      : 'bg-white/60 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/50 active:bg-white active:dark:bg-gray-900 active:text-gray-900 active:dark:text-white'
                  }`}
                >
                  <ChevronDown className='w-4 h-4 rotate-90' />
                </button>

                {/* Play/Pause Toggle Button */}
                <button
                  onClick={handlePlayToggle}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isPlayingPlaylist
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'bg-white/60 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/50'
                  }`}
                >
                  {isPlayingPlaylist ? (
                    <>
                      <Pause className='w-4 h-4' />
                      <span>停止</span>
                    </>
                  ) : (
                    <>
                      <Play className='w-4 h-4' />
                      <span>再生</span>
                    </>
                  )}
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors ${
                    isNextDisabled()
                      ? 'bg-white/20 dark:bg-gray-900/20 text-white/40 dark:text-white/40 cursor-not-allowed'
                      : 'bg-white/60 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/50 active:bg-white active:dark:bg-gray-900 active:text-gray-900 active:dark:text-white'
                  }`}
                >
                  <ChevronDown className='w-4 h-4 -rotate-90' />
                </button>

                {/* Shuffle Toggle Button */}
                <button
                  onClick={handleShuffleToggle}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors ${
                    isShuffleOn
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'bg-white/60 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/50'
                  }`}
                >
                  <Shuffle className='w-4 h-4' />
                </button>

                {/* Repeat Toggle Button */}
                <button
                  onClick={() => setIsRepeatOn(!isRepeatOn)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors ${
                    isRepeatOn
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'bg-white/60 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-900/50'
                  }`}
                >
                  <Repeat className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Queue List */}
        <div className='flex-1 relative'>
          <div className='absolute inset-0 overflow-y-auto playlist-scrollbar' ref={scrollContainerRef}>
            {playlist.items.length > 0 ? (
              <div className='border-t border-gray-200 dark:border-gray-700'>
                {playlist.items.map((item, index) => (
                  <DraggableItem
                    key={`${item.episode.id}-${item.chapter?.id || 'episode'}-${index}`}
                    item={item}
                    index={index}
                    swipedItem={swipedItem}
                    swipeDirection={swipeDirection}
                    touchStart={touchStart}
                    touchOffset={touchOffset}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onItemClick={handleItemClick}
                    onDelete={handleDelete}
                    onReorder={reorderItems}
                    isCurrentlyPlaying={index === currentPlayingIndex}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    itemRef={(element) => {
                      itemRefs.current[index] = element
                    }}
                    showMenu={showMenu}
                    onMenuToggle={setShowMenu}
                    onAddToQueue={onPlayItem}
                    onDownload={() => {}}
                    onAddToPlaylist={() => {}}
                    menuRef={useRef<HTMLDivElement>(null)}
                  />
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center py-16 px-6'>
                  <div className='w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Play className='w-10 h-10 text-gray-700 dark:text-gray-300' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>プレイリストが空です</h3>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    エピソードやチャプターをプレイリストに追加してください
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
