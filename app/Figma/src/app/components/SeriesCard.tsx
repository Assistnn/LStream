import { Download, Heart, MoreVertical, PlayCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Series } from '@/data/mockData'
import { formatDuration, getCategoryLabel } from '@/data/mockData'

interface SeriesCardProps {
  series: Series
  variant?: 'large' | 'small' | 'list' | 'grid'
  onTap?: (series: Series) => void
  onToggleFavorite?: (series: Series) => void
  hideFavoriteButton?: boolean
  onAddToQueue?: (series: Series) => void
  onAddToPlaylist?: (series: Series) => void
}

export function SeriesCard({
  series,
  variant = 'list',
  onTap,
  onToggleFavorite,
  hideFavoriteButton,
  onAddToQueue,
  onAddToPlaylist,
}: SeriesCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const totalDuration = series.episodes.reduce((sum, ep) => sum + ep.duration, 0)
  const progressPercent = (series.completedEpisodes / series.totalEpisodes) * 100

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu])

  if (variant === 'large') {
    return (
      <div
        className='bg-white dark:bg-gray-800 rounded-[5px] shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer'
        onClick={() => onTap?.(series)}
      >
        {series.thumbnail ? (
          <div className='relative aspect-video'>
            <img src={series.thumbnail} alt={series.title} className='w-full h-full object-cover rounded-[5px]' />
            <div className='absolute top-3 right-3'>
              <span className='px-2 py-1 bg-black/70 text-white text-xs rounded-full'>
                {series.type === 'audio' ? '音声' : '動画'} シリーズ
              </span>
            </div>
            <div className='absolute bottom-3 left-3 right-3'>
              <div className='bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2'>
                <div className='flex items-center justify-between text-xs mb-1'>
                  <span className='font-semibold text-gray-900 dark:text-gray-100'>
                    {series.completedEpisodes}/{series.totalEpisodes} 完了
                  </span>
                  <span className='text-gray-600 dark:text-gray-400'>{Math.round(progressPercent)}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-1.5'>
                  <div
                    className='bg-blue-600 h-1.5 rounded-full transition-all'
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
            <span className='text-6xl'>📚</span>
          </div>
        )}

        <div className='p-4'>
          <div className='flex items-start justify-between mb-2'>
            <div className='flex-1'>
              <span className='text-xs font-medium text-blue-600 uppercase tracking-wide'>
                {getCategoryLabel(series.category)}
              </span>
              <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mt-1'>{series.title}</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2'>{series.description}</p>
            </div>
          </div>

          <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
            <span>{series.totalEpisodes}メディア</span>
            <span>合計 {formatDuration(totalDuration)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'small') {
    return (
      <div className='flex-shrink-0 w-40 cursor-pointer' onClick={() => onTap?.(series)}>
        {series.thumbnail ? (
          <div className='relative aspect-square rounded-[5px] overflow-hidden mb-2'>
            <img src={series.thumbnail} alt={series.title} className='w-full h-full object-cover' />
            <div className='absolute top-2 left-2'>
              <div className='bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold'>
                {series.totalEpisodes}話
              </div>
            </div>
            {progressPercent > 0 && (
              <div className='absolute bottom-0 left-0 right-0 h-1 bg-gray-200'>
                <div className='h-1 bg-blue-600' style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div className='aspect-square rounded-[5px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2'>
            <span className='text-4xl'>📚</span>
          </div>
        )}

        <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1'>{series.title}</h4>
        <p className='text-xs text-gray-500 dark:text-gray-400'>{series.totalEpisodes}メディア</p>
      </div>
    )
  }

  if (variant === 'grid') {
    const totalPlayCount = series.episodes.reduce((sum, ep) => sum + ep.playCount, 0)

    return (
      <div className='cursor-pointer' onClick={() => onTap?.(series)}>
        {series.thumbnail ? (
          <div className='relative aspect-square rounded-[5px] overflow-hidden mb-2'>
            <img src={series.thumbnail} alt={series.title} className='w-full h-full object-cover' />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(series)
              }}
              className='absolute top-2 left-2'
            >
              <Heart
                className={`w-6 h-6 ${series.isFavorite ? 'fill-white text-white' : 'text-white drop-shadow-lg'}`}
              />
            </button>
            <div className='absolute top-2 right-2 bg-blue-600 dark:bg-blue-500 text-white text-xs px-2 py-0.5 rounded-md font-bold'>
              {series.totalEpisodes}
            </div>
          </div>
        ) : (
          <div className='relative aspect-square rounded-[5px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2'>
            <span className='text-4xl'>📚</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(series)
              }}
              className='absolute top-2 left-2'
            >
              <Heart
                className={`w-6 h-6 ${series.isFavorite ? 'fill-white text-white' : 'text-white drop-shadow-lg'}`}
              />
            </button>
            <div className='absolute top-2 right-2 bg-blue-600 dark:bg-blue-500 text-white text-xs px-2 py-0.5 rounded-md font-bold'>
              {series.totalEpisodes}
            </div>
          </div>
        )}

        <h4 className='text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 h-10 mb-1'>{series.title}</h4>
        <div className='h-5 flex items-center justify-between'>
          <div>
            {totalPlayCount > 0 && (
              <p className='text-xs text-purple-700 dark:text-purple-400 font-semibold'>
                {totalPlayCount.toLocaleString()}回再生
              </p>
            )}
          </div>
          <div className='relative'>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className='p-0.5 hover:opacity-70 transition-opacity'
            >
              <MoreVertical className='w-4 h-4 text-gray-600 dark:text-gray-400' />
            </button>

            {showMenu && (
              <div
                className='absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10'
                ref={menuRef}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite?.(series)
                    setShowMenu(false)
                  }}
                  className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  {series.isFavorite ? 'お気に入り解除' : 'お気に入り'}
                </button>
                {onAddToQueue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToQueue(series)
                      setShowMenu(false)
                    }}
                    className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    再生キューに追加
                  </button>
                )}
                {onAddToPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToPlaylist(series)
                      setShowMenu(false)
                    }}
                    className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  >
                    プレイリストに追加
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log(series.isDownloaded ? 'Delete download:' : 'Download:', series.title)
                    setShowMenu(false)
                  }}
                  className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                >
                  {series.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // list variant
  return (
    <div
      className='flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
      onClick={() => onTap?.(series)}
    >
      {series.thumbnail ? (
        <div className='relative w-16 h-16 flex-shrink-0'>
          <img src={series.thumbnail} alt={series.title} className='w-full h-full rounded-[5px] object-cover' />
          <div className='absolute -top-1 -right-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold'>
            {series.totalEpisodes}
          </div>
        </div>
      ) : (
        <div className='w-16 h-16 rounded-[5px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 relative'>
          <span className='text-2xl'>📚</span>
          <div className='absolute -top-1 -right-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold'>
            {series.totalEpisodes}
          </div>
        </div>
      )}

      <div className='flex-1 min-w-0'>
        <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>{series.title}</h4>
        <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5'>
          <span>{getCategoryLabel(series.category)}</span>
          <span>•</span>
          <span>{series.totalEpisodes}メディア</span>
          {series.isDownloaded && (
            <>
              <span>•</span>
              <Download className='w-3 h-3 text-blue-600 dark:text-blue-400' />
            </>
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2 flex-1'>
            <div className='flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1'>
              <div
                className='bg-blue-600 dark:bg-blue-500 h-1 rounded-full transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className='text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap'>
              {Math.round(progressPercent)}%
            </span>
          </div>
          {/* Total play count for series */}
          {(() => {
            const totalPlayCount = series.episodes.reduce((sum, ep) => sum + ep.playCount, 0)
            if (totalPlayCount > 0) {
              return (
                <span className='text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-semibold whitespace-nowrap'>
                  {totalPlayCount.toLocaleString()}回再生
                </span>
              )
            }
            return null
          })()}
        </div>
      </div>

      <div className='flex flex-col gap-1 items-center flex-shrink-0 relative'>
        {!hideFavoriteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.(series)
            }}
            className='p-1'
          >
            <Heart
              className={`w-5 h-5 ${series.isFavorite ? 'fill-white text-white' : 'text-gray-700 dark:text-gray-300'}`}
            />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className='p-1'
        >
          <MoreVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
        </button>

        {showMenu && (
          <div
            className='absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10'
            ref={menuRef}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(series)
                setShowMenu(false)
              }}
              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              {series.isFavorite ? 'お気に入り解除' : 'お気に入り'}
            </button>
            {onAddToQueue && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToQueue(series)
                  setShowMenu(false)
                }}
                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              >
                再生キューに追加
              </button>
            )}
            {onAddToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToPlaylist(series)
                  setShowMenu(false)
                }}
                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              >
                プレイリストに追加
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                console.log(series.isDownloaded ? 'Delete download:' : 'Download:', series.title)
                setShowMenu(false)
              }}
              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              {series.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
