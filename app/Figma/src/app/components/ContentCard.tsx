import { Download, Heart, MoreVertical, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { Content } from '@/data/mockData'
import { formatDuration, getCategoryLabel } from '@/data/mockData'

interface ContentCardProps {
  content: Content
  variant?: 'large' | 'small' | 'list' | 'grid'
  onPlay?: (content: Content) => void
  onToggleFavorite?: (content: Content) => void
  hideFavoriteButton?: boolean
}

export function ContentCard({
  content,
  variant = 'list',
  onPlay,
  onToggleFavorite,
  hideFavoriteButton,
}: ContentCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
      <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700'>
        {content.thumbnail ? (
          <div className='relative aspect-video'>
            <img src={content.thumbnail} alt={content.title} className='w-full h-full object-cover' />
            <div className='absolute top-3 right-3'>
              <span className='px-2 py-1 bg-black/70 text-white text-xs rounded-full'>
                {content.type === 'audio' ? '音声' : '動画'}
              </span>
            </div>
          </div>
        ) : (
          <div className='aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
            <span className='text-6xl'>🎵</span>
          </div>
        )}

        <div className='p-4'>
          <div className='flex items-start justify-between mb-2'>
            <div className='flex-1'>
              <span className='text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
                {getCategoryLabel(content.category)}
              </span>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mt-1'>{content.title}</h3>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-500 dark:text-gray-400'>{formatDuration(content.duration)}</span>
          </div>

          <button
            onClick={() => onPlay?.(content)}
            className='w-full mt-4 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3.5 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
          >
            <Play className='w-5 h-5 fill-white' />
            今すぐ再生
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'small') {
    return (
      <div className='flex-shrink-0 w-40 cursor-pointer' onClick={() => onPlay?.(content)}>
        {content.thumbnail ? (
          <div className='relative aspect-square rounded-xl overflow-hidden mb-2'>
            <img src={content.thumbnail} alt={content.title} className='w-full h-full object-cover' />
          </div>
        ) : (
          <div className='aspect-square rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2'>
            <span className='text-4xl'>🎵</span>
          </div>
        )}

        <h4 className='text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1'>{content.title}</h4>
        <p className='text-xs text-gray-500 dark:text-gray-400'>{formatDuration(content.duration)}</p>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className='cursor-pointer' onClick={() => onPlay?.(content)}>
        {content.thumbnail ? (
          <div className='relative aspect-square rounded-lg overflow-hidden mb-2'>
            <img src={content.thumbnail} alt={content.title} className='w-full h-full object-cover' />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(content)
              }}
              className='absolute top-2 left-2'
            >
              <Heart
                className={`w-6 h-6 ${content.isFavorite ? 'fill-white text-white' : 'text-white drop-shadow-lg'}`}
              />
            </button>
          </div>
        ) : (
          <div className='relative aspect-square rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2'>
            <span className='text-4xl'>🎵</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(content)
              }}
              className='absolute top-2 left-2'
            >
              <Heart
                className={`w-6 h-6 ${content.isFavorite ? 'fill-white text-white' : 'text-white drop-shadow-lg'}`}
              />
            </button>
          </div>
        )}

        <h4 className='text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 h-10 mb-1'>{content.title}</h4>
        <div className='h-5'>
          {content.playCount > 0 && (
            <p className='text-xs text-purple-700 dark:text-purple-400 font-semibold'>
              {content.playCount.toLocaleString()}回再生
            </p>
          )}
        </div>
      </div>
    )
  }

  // list variant
  return (
    <div
      className='flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
      onClick={() => onPlay?.(content)}
    >
      {content.thumbnail ? (
        <img src={content.thumbnail} alt={content.title} className='w-16 h-16 rounded-lg object-cover flex-shrink-0' />
      ) : (
        <div className='w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
          <span className='text-2xl'>🎵</span>
        </div>
      )}

      <div className='flex-1 min-w-0'>
        <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>{content.title}</h4>
        <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5'>
          <span>{getCategoryLabel(content.category)}</span>
          <span>•</span>
          <span>{formatDuration(content.duration)}</span>
          {content.isDownloaded && (
            <>
              <span>•</span>
              <Download className='w-3 h-3 text-blue-600 dark:text-blue-400' />
            </>
          )}
        </div>
        <div className='h-5'>
          {content.playCount > 0 && (
            <div className='text-[10px] text-purple-700 dark:text-purple-400 font-semibold'>
              {content.playCount.toLocaleString()}回再生
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-1 items-center flex-shrink-0 relative'>
        {!hideFavoriteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.(content)
            }}
            className='p-1'
          >
            <Heart
              className={`w-5 h-5 ${content.isFavorite ? 'fill-white text-white' : 'text-gray-700 dark:text-gray-300'}`}
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
                onToggleFavorite?.(content)
                setShowMenu(false)
              }}
              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              {content.isFavorite ? 'お気に入り解除' : 'お気に入り'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                console.log(content.isDownloaded ? 'Delete download:' : 'Download:', content.title)
                setShowMenu(false)
              }}
              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            >
              {content.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
