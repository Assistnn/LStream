import { Download, Heart, MoreVertical, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ContentCard } from '@/app/components/ContentCard'
import { SeriesCard } from '@/app/components/SeriesCard'
import type { Chapter, Content, Episode, Series } from '@/data/mockData'
import { formatDuration, getCategoryLabel, isContent, isSeries } from '@/data/mockData'

interface FavoritesScreenProps {
  favoriteItems: (Content | Series)[]
  allLibraryItems: (Content | Series)[]
  onPlayContent: (content: Content) => void
  onToggleFavorite: (item: Content | Series) => void
  onSeriesTap: (series: Series) => void
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void
  onToggleEpisodeFavorite: (episode: Episode) => void
  onToggleChapterFavorite: (episode: Episode, chapter: Chapter) => void
  onAddToQueue: (series: Series, episode: Episode, chapter?: Chapter) => void
  onAddSeriesToPlaylist?: (series: Series) => void
  onAddSeriesToQueue?: (series: Series) => void
  onAddToPlaylist?: (series: Series, episode: Episode, chapter?: Chapter) => void
}

export function FavoritesScreen({
  favoriteItems,
  allLibraryItems,
  onPlayContent,
  onToggleFavorite,
  onSeriesTap,
  onPlayEpisode,
  onToggleEpisodeFavorite,
  onToggleChapterFavorite,
  onAddToQueue,
  onAddSeriesToPlaylist,
  onAddSeriesToQueue,
  onAddToPlaylist,
}: FavoritesScreenProps) {
  const [activeTab, setActiveTab] = useState<'titles' | 'episodes'>('titles')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu])

  // Get favorite titles (Contents and Series)
  const favoriteTitles = favoriteItems

  // Get favorite episodes and chapters from ALL library items (not just favorite titles)
  const favoriteEpisodes: Array<{ episode: Episode; series: Series }> = []
  const favoriteChapters: Array<{ chapter: Chapter; episode: Episode; series: Series }> = []

  allLibraryItems.forEach((item) => {
    if (isSeries(item)) {
      item.episodes.forEach((episode) => {
        if (episode.isFavorite) {
          favoriteEpisodes.push({ episode, series: item })
        }
        // Collect favorite chapters
        if (episode.chapters) {
          episode.chapters.forEach((chapter) => {
            if (chapter.isFavorite) {
              favoriteChapters.push({ chapter, episode, series: item })
            }
          })
        }
      })
    }
  })

  // Combine episodes and chapters for total count
  const totalFavoriteEpisodesAndChapters = favoriteEpisodes.length + favoriteChapters.length

  return (
    <div className='pb-40 pt-6 dark:bg-gray-900'>
      {/* Header */}
      <div className='px-4 mb-6'>
        <div className='flex items-center gap-3 mb-4'>
          <Heart className='w-8 h-8 text-gray-700 dark:text-gray-300 fill-gray-700 dark:fill-gray-300' />
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>お気に入り</h1>
        </div>

        {/* Tabs */}
        <div className='flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg'>
          <button
            onClick={() => setActiveTab('titles')}
            className={`flex-1 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'titles'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            シリーズ ({favoriteTitles.length})
          </button>
          <button
            onClick={() => setActiveTab('episodes')}
            className={`flex-1 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'episodes'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            エピソード ({totalFavoriteEpisodesAndChapters})
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'titles' ? (
          // Titles Tab
          favoriteTitles.length > 0 ? (
            <div className='divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700'>
              {favoriteTitles.map((item) => {
                if (isContent(item)) {
                  return (
                    <div
                      key={item.id}
                      className='flex items-center gap-3 px-4 py-[11px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative'
                      onClick={() => onPlayContent(item)}
                    >
                      {/* Thumbnail */}
                      <div className='relative w-16 h-16 flex-shrink-0 cursor-pointer'>
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className='w-full h-full rounded-md object-cover'
                          />
                        ) : (
                          <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                            <span className='text-2xl'>🎵</span>
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className='flex-1 min-w-0 cursor-pointer'>
                        <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>{item.title}</h4>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>
                          {getCategoryLabel(item.category)}
                        </p>
                        <div className='h-5 flex items-center gap-2 text-[10px] font-semibold'>
                          <span className='text-gray-700 dark:text-gray-300'>{formatDuration(item.duration)}</span>
                          {item.playCount > 0 && (
                            <span className='text-purple-700 dark:text-purple-400'>
                              {item.playCount.toLocaleString()}回再生
                            </span>
                          )}
                          <span className='text-gray-500 dark:text-gray-400'>
                            {item.type === 'audio' ? '音声' : '動画'}
                          </span>
                        </div>
                      </div>

                      {/* Download Icon */}
                      {item.isDownloaded && (
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
                            {onAddSeriesToPlaylist && isSeries(item) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddSeriesToPlaylist(item)
                                  setShowMenu(null)
                                }}
                                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              >
                                プレイリストに追加
                              </button>
                            )}
                            {onAddSeriesToQueue && isSeries(item) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddSeriesToQueue(item)
                                  setShowMenu(null)
                                }}
                                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              >
                                再生キューに追加
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Download:', isSeries(item) ? 'series' : 'content', item.title)
                                setShowMenu(null)
                              }}
                              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            >
                              ダウンロード
                            </button>
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
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div
                      key={item.id}
                      className='flex items-center gap-3 px-4 py-[11px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative'
                      onClick={() => onSeriesTap(item)}
                    >
                      {/* Thumbnail */}
                      <div className='relative w-16 h-16 flex-shrink-0 cursor-pointer'>
                        {item.thumbnail ? (
                          <>
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className='w-full h-full rounded-md object-cover'
                            />
                            <div className='absolute -top-1 -right-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold'>
                              {item.totalEpisodes}
                            </div>
                          </>
                        ) : (
                          <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative'>
                            <span className='text-2xl'>📚</span>
                            <div className='absolute -top-1 -right-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold'>
                              {item.totalEpisodes}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Series Info */}
                      <div className='flex-1 min-w-0 cursor-pointer'>
                        <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>{item.title}</h4>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>
                          {getCategoryLabel(item.category)} • {item.totalEpisodes}メディア
                        </p>
                        <div className='h-5 flex items-center gap-2'>
                          <div className='flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1'>
                            <div
                              className='bg-blue-600 dark:bg-blue-500 h-1 rounded-full transition-all'
                              style={{ width: `${(item.completedEpisodes / item.totalEpisodes) * 100}%` }}
                            />
                          </div>
                          <span className='text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap'>
                            {Math.round((item.completedEpisodes / item.totalEpisodes) * 100)}%
                          </span>
                        </div>
                      </div>

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
                            {onAddSeriesToPlaylist && isSeries(item) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddSeriesToPlaylist(item)
                                  setShowMenu(null)
                                }}
                                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              >
                                プレイリストに追加
                              </button>
                            )}
                            {onAddSeriesToQueue && isSeries(item) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddSeriesToQueue(item)
                                  setShowMenu(null)
                                }}
                                className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              >
                                再生キューに追加
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Download:', isSeries(item) ? 'series' : 'content', item.title)
                                setShowMenu(null)
                              }}
                              className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            >
                              ダウンロード
                            </button>
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
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          ) : (
            <div className='text-center py-16'>
              <div className='w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Heart className='w-10 h-10 text-gray-700 dark:text-gray-300' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                お気に入りのタイトルがありません
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                コンテンツやシリーズをお気に入りに追加してください
              </p>
            </div>
          )
        ) : // Episodes Tab
        totalFavoriteEpisodesAndChapters > 0 ? (
          <div className='divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700'>
            {favoriteEpisodes.map(({ episode, series }) => (
              <div
                key={episode.id}
                className='flex items-center gap-3 px-4 py-[14px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative'
                onClick={() => onPlayEpisode(series, episode)}
              >
                {/* Thumbnail */}
                <div className='relative w-16 h-16 flex-shrink-0 cursor-pointer'>
                  {series.thumbnail ? (
                    <img src={series.thumbnail} alt={series.title} className='w-full h-full rounded-md object-cover' />
                  ) : (
                    <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                      <span className='text-2xl'>📚</span>
                    </div>
                  )}
                </div>

                {/* Episode Info */}
                <div className='flex-1 min-w-0 cursor-pointer'>
                  <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
                    <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>Ep.{episode.episodeNumber}</span>
                    {episode.title}
                  </h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>{series.title}</p>
                  <div className='h-5 flex items-center gap-2 text-[10px] font-semibold'>
                    <span className='text-gray-700 dark:text-gray-300'>{formatDuration(episode.duration)}</span>
                    {episode.playCount > 0 && (
                      <span className='text-purple-700 dark:text-purple-400'>
                        {episode.playCount.toLocaleString()}回再生
                      </span>
                    )}
                    <span className='text-gray-500 dark:text-gray-400'>
                      {series.type === 'audio' ? '音声' : '動画'}
                    </span>
                  </div>
                </div>

                {/* Download Icon */}
                {episode.isDownloaded && (
                  <div className='flex-shrink-0 flex items-center justify-center'>
                    <Download className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                  </div>
                )}

                {/* Menu Button */}
                <div className='flex flex-col gap-1 items-center flex-shrink-0 relative'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(showMenu === episode.id ? null : episode.id)
                    }}
                    className='p-1'
                  >
                    <MoreVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                  </button>

                  {showMenu === episode.id && (
                    <div
                      ref={menuRef}
                      className='absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10'
                    >
                      {onAddToPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddToPlaylist(series, episode)
                            setShowMenu(null)
                          }}
                          className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        >
                          プレイリストに追加
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToQueue(series, episode)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        再生キューに追加
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Download episode:', episode.title)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        ダウンロード
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleEpisodeFavorite(episode)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        お気に入りを削除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {favoriteChapters.map(({ chapter, episode, series }) => (
              <div
                key={chapter.id}
                className='flex items-center gap-3 px-4 py-[14px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative'
                onClick={() => onPlayEpisode(series, episode, chapter)}
              >
                {/* Thumbnail */}
                <div className='relative w-16 h-16 flex-shrink-0 cursor-pointer'>
                  {series.thumbnail ? (
                    <img src={series.thumbnail} alt={series.title} className='w-full h-full rounded-md object-cover' />
                  ) : (
                    <div className='w-full h-full rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                      <span className='text-2xl'>📚</span>
                    </div>
                  )}
                </div>

                {/* Chapter Info */}
                <div className='flex-1 min-w-0 cursor-pointer'>
                  <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
                    <span className='text-xs text-gray-600 dark:text-gray-300 mr-1.5'>
                      Ep.{episode.episodeNumber} Unit.{chapter.chapterNumber}
                    </span>
                    {chapter.title}
                  </h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-0.5'>{series.title}</p>
                  <div className='h-5 flex items-center gap-2 text-[10px] font-semibold'>
                    <span className='text-gray-700 dark:text-gray-300'>{formatDuration(chapter.duration)}</span>
                    {chapter.playCount > 0 && (
                      <span className='text-purple-700 dark:text-purple-400'>
                        {chapter.playCount.toLocaleString()}回再生
                      </span>
                    )}
                    <span className='text-gray-500 dark:text-gray-400'>
                      {series.type === 'audio' ? '音声' : '動画'}
                    </span>
                  </div>
                </div>

                {/* Download Icon */}
                {chapter.isDownloaded && (
                  <div className='flex-shrink-0 flex items-center justify-center'>
                    <Download className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                  </div>
                )}

                {/* Menu Button */}
                <div className='flex flex-col gap-1 items-center flex-shrink-0 relative'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(showMenu === chapter.id ? null : chapter.id)
                    }}
                    className='p-1'
                  >
                    <MoreVertical className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                  </button>

                  {showMenu === chapter.id && (
                    <div
                      ref={menuRef}
                      className='absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-10'
                    >
                      {onAddToPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddToPlaylist(series, episode, chapter)
                            setShowMenu(null)
                          }}
                          className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        >
                          プレイリストに追加
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToQueue(series, episode, chapter)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        再生キューに追加
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Download chapter:', chapter.title)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        ダウンロード
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleChapterFavorite(episode, chapter)
                          setShowMenu(null)
                        }}
                        className='w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      >
                        お気に入りを削除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <div className='w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Heart className='w-10 h-10 text-gray-700 dark:text-gray-300' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              お気に入りのエピソードがありません
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>エピソードをお気に入りに追加してください</p>
          </div>
        )}
      </div>
    </div>
  )
}
