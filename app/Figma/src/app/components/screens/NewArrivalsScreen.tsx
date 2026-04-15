import { ArrowLeft, Download, MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Chapter, Content, Episode, NewArrivalItem, Series } from '@/data/mockData'
import { formatDuration, getCategoryLabel, mockNewArrivals } from '@/data/mockData'

interface NewArrivalsScreenProps {
  onBack: () => void
  onPlayContent: (content: Content) => void
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void
  onToggleFavorite?: (item: NewArrivalItem) => void
}

export function NewArrivalsScreen({ onBack, onPlayContent, onPlayEpisode, onToggleFavorite }: NewArrivalsScreenProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get all new arrivals (not limited to 8)
  const newArrivals = mockNewArrivals

  const handlePlayItem = (item: NewArrivalItem) => {
    if (item.type === 'content' && item.content) {
      onPlayContent(item.content)
    } else if (item.type === 'episode' && item.series && item.episode) {
      onPlayEpisode(item.series, item.episode)
    } else if (item.type === 'chapter' && item.series && item.episode && item.chapter) {
      onPlayEpisode(item.series, item.episode, item.chapter)
    }
  }

  return (
    <div className='fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'>
        <div className='flex items-center gap-4 px-4 py-3'>
          <button
            onClick={onBack}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <ArrowLeft className='w-6 h-6 text-gray-900 dark:text-white' />
          </button>
          <h1 className='text-lg font-bold text-gray-900 dark:text-white'>新着</h1>
        </div>
      </div>

      {/* Content */}
      <div className='pb-20'>
        {/* Stats */}
        <div className='px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{newArrivals.length}件のメディア</p>
        </div>

        {/* Items List - Same style as Favorites Episodes */}
        <div className='divide-y divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700'>
          {newArrivals.map((item) => (
            <div
              key={item.id}
              className='flex items-center gap-3 px-4 py-[14px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative'
              onClick={() => handlePlayItem(item)}
            >
              {/* Thumbnail */}
              <div className='relative w-16 h-16 flex-shrink-0 cursor-pointer'>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className='w-full h-full rounded-md object-cover' />
                ) : (
                  <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                    <span className='text-2xl'>📚</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className='flex-1 min-w-0 cursor-pointer'>
                <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
                  {item.type === 'episode' && item.episode && (
                    <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>
                      Ep.{item.episode.episodeNumber}
                    </span>
                  )}
                  {item.type === 'chapter' && item.episode && item.chapter && (
                    <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>
                      EP{item.episode.episodeNumber} • CH{item.chapter.chapterNumber}
                    </span>
                  )}
                  {item.title}
                </h4>
                <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>
                  {item.type === 'content' ? getCategoryLabel(item.category) : item.series?.title}
                </p>
                <div className='h-5 flex items-center gap-2 text-[10px] font-semibold'>
                  <span className='text-gray-700 dark:text-gray-300'>{formatDuration(item.duration)}</span>
                  <span className='text-gray-500 dark:text-gray-400'>
                    {item.itemType === 'audio' ? '音声' : '動画'}
                  </span>
                </div>
              </div>

              {/* Download Icon - placeholder for consistency */}
              {item.content?.isDownloaded && (
                <div className='flex-shrink-0 flex items-center justify-center'>
                  <Download className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                </div>
              )}

              {/* Menu Button */}
              <div className='flex flex-col gap-1 items-center flex-shrink-0 relative'>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(showMenu === item.id ? null : item.id)
                  }}
                  className='p-1'
                >
                  <MoreVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                </button>

                {showMenu === item.id && (
                  <div
                    ref={menuRef}
                    className='absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10'
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('プレイリストに追加:', item.title)
                        setShowMenu(null)
                      }}
                      className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      プレイリストに追加
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('再生キューに追加:', item.title)
                        setShowMenu(null)
                      }}
                      className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      再生キューに追加
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('ダウンロード:', item.title)
                        setShowMenu(null)
                      }}
                      className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      ダウンロード
                    </button>
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(item)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        お気に入りを削除
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
