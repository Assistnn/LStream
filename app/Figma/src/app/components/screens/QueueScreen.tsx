import { ChevronLeft, GripVertical, Play } from 'lucide-react'
import { useRef, useState } from 'react'

import { Switch } from '@/app/components/ui/switch'
import type { Chapter, Episode, Series } from '@/data/mockData'
import { formatDuration } from '@/data/mockData'

type QueueItem = {
  series: Series
  episode: Episode
  chapter?: Chapter
}

interface QueueScreenProps {
  queue: QueueItem[]
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void
  onRemoveFromQueue: (index: number) => void
  onBack?: () => void
}

export function QueueScreen({ queue, onPlayEpisode, onRemoveFromQueue, onBack }: QueueScreenProps) {
  const [autoPlay, setAutoPlay] = useState(true)
  const [swipedItem, setSwipedItem] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchOffset, setTouchOffset] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const totalDuration = queue.reduce((sum, item) => {
    return sum + (item.chapter?.duration || item.episode.duration)
  }, 0)

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setSwipedItem(index)
    setTouchOffset(0)
    setSwipeDirection(null)
  }

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!touchStart || swipedItem !== index) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = Math.abs(touch.clientY - touchStart.y)

    // Only handle horizontal swipes (when deltaY is small)
    if (deltaY < 50) {
      // Only allow right swipe (positive deltaX) for delete
      if (deltaX > 0) {
        setTouchOffset(Math.min(deltaX, 100)) // Cap at 100px
        setSwipeDirection('right')
      } else {
        setTouchOffset(0)
        setSwipeDirection(null)
      }
    }
  }

  const handleTouchEnd = (index: number) => {
    if (swipedItem !== index) return

    // If swiped far enough to the right (>= 80px), trigger delete
    if (swipeDirection === 'right' && touchOffset >= 80) {
      onRemoveFromQueue(index)
    }

    // Reset state
    setTouchStart(null)
    setTouchOffset(0)
    setSwipedItem(null)
    setSwipeDirection(null)
  }

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    onRemoveFromQueue(index)
  }

  return (
    <div className='fixed top-0 left-0 right-0 bottom-20 bg-gray-50 dark:bg-gray-900 z-30 flex flex-col max-w-[460px] mx-auto pt-6'>
      {/* Header */}
      <div className='px-[5%] mb-4'>
        {onBack && (
          <button
            onClick={onBack}
            className='p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mb-4'
          >
            <ChevronLeft className='w-6 h-6 text-gray-700 dark:text-gray-300' />
          </button>
        )}
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>再生キュー</h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {queue.length}件のメディア 合計 {formatDuration(totalDuration)}
            </p>
          </div>
          {queue.length > 0 && (
            <button
              onClick={() => {
                const first = queue[0]
                onPlayEpisode(first.series, first.episode, first.chapter)
              }}
              className='flex-shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold px-5 py-2.5 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2'
            >
              <Play className='w-4 h-4 fill-current' />
              すべて再生
            </button>
          )}
        </div>
      </div>

      {/* Auto-play toggle */}
      <div className='px-[5%] mb-4'>
        <div className='flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700'>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-white text-sm'>連続再生</h3>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>次のコンテンツを自動で再生</p>
          </div>
          <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
        </div>
      </div>

      {/* Queue list */}
      <div className='flex-1 overflow-y-auto'>
        {queue.length > 0 ? (
          <div>
            {queue.map((item, index) => {
              const isThisSwiped = swipedItem === index
              const currentOffset = isThisSwiped ? touchOffset : 0

              return (
                <div
                  key={`${item.episode.id}-${item.chapter?.id || 'ep'}-${index}`}
                  className='relative overflow-hidden border-b border-gray-200 dark:border-gray-700'
                >
                  {/* Swipe Action Background */}
                  {isThisSwiped && swipeDirection === 'right' && (
                    <div className='absolute inset-0 flex items-center justify-start bg-red-500'>
                      <button
                        onClick={(e) => handleDelete(e, index)}
                        className='h-full px-6 flex items-center justify-center text-white font-semibold'
                      >
                        削除
                      </button>
                    </div>
                  )}

                  {/* Item Content */}
                  <div
                    className='transition-colors bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={(e) => handleTouchMove(e, index)}
                    onTouchEnd={() => handleTouchEnd(index)}
                    style={{
                      transform: `translateX(${currentOffset}px)`,
                      transition: touchStart ? 'none' : 'transform 0.3s ease-out',
                    }}
                  >
                    <div className='flex items-center gap-2 px-[5%] py-2'>
                      {/* Drag Handle */}
                      <div className='flex-shrink-0'>
                        <GripVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                      </div>

                      {/* Index */}
                      <div className='w-5 text-center flex-shrink-0'>
                        <span className='text-sm font-semibold text-gray-400 dark:text-gray-500'>{index + 1}</span>
                      </div>

                      {/* Thumbnail */}
                      <button
                        onClick={() => onPlayEpisode(item.series, item.episode, item.chapter)}
                        className='relative w-14 h-14 flex-shrink-0 group'
                      >
                        {item.series.thumbnail ? (
                          <img
                            src={item.series.thumbnail}
                            alt={item.series.title}
                            className='w-full h-full rounded-md object-cover'
                          />
                        ) : (
                          <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                            <span className='text-xl'>📚</span>
                          </div>
                        )}
                        {/* Hover Play Icon */}
                        <div className='absolute inset-0 bg-black/40 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                          <Play className='w-5 h-5 text-white' />
                        </div>
                      </button>

                      {/* Content info */}
                      <div
                        className='flex-1 min-w-0 cursor-pointer'
                        onClick={() => onPlayEpisode(item.series, item.episode, item.chapter)}
                      >
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
                        <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
                          <span>{formatDuration(item.chapter?.duration || item.episode.duration)}</span>
                          <span className='text-purple-700 dark:text-purple-400 font-semibold'>
                            {item.chapter?.playCount || item.episode.playCount || 0}回再生
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='text-center py-16 px-[5%]'>
            <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Play className='w-8 h-8 text-gray-400 dark:text-gray-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>再生キューが空です</h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>エピソードを再生キューに追加してください</p>
          </div>
        )}
      </div>
    </div>
  )
}
