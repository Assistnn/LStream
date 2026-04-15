import { ArrowUpDown, Grid, Library, List, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { ContentCard } from '@/app/components/ContentCard'
import { SeriesCard } from '@/app/components/SeriesCard'
import type { Chapter, Content, Episode, LibraryItem, Series } from '@/data/mockData'
import { categories, isSeries } from '@/data/mockData'

interface LibraryScreenProps {
  libraryItems: LibraryItem[]
  onPlayContent: (content: Content) => void
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void
  onToggleFavorite: (item: Content | Series) => void
  onSeriesTap: (series: Series) => void
  onAddSeriesToQueue?: (series: Series) => void
  onAddSeriesToPlaylist?: (series: Series) => void
}

export function LibraryScreen({
  libraryItems,
  onPlayContent,
  onPlayEpisode,
  onToggleFavorite,
  onSeriesTap,
  onAddSeriesToQueue,
  onAddSeriesToPlaylist,
}: LibraryScreenProps) {
  const [activeType, setActiveType] = useState<'all' | 'audio' | 'video' | 'favorites'>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'default' | 'playCount' | 'title'>('default')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSearch, setShowSearch] = useState(false)

  const filteredItems = libraryItems.filter((item) => {
    // Type filter
    if (activeType === 'audio' && item.type !== 'audio') return false
    if (activeType === 'video' && item.type !== 'video') return false
    if (activeType === 'favorites' && !item.isFavorite) return false

    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false

    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  // Sort items with original index tracking for default order
  const sortedItems = [...filteredItems]
    .map((item, index) => ({ item, originalIndex: index }))
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === 'default') {
        // Use original index for default order
        comparison = a.originalIndex - b.originalIndex
      } else if (sortBy === 'playCount') {
        const aPlayCount = isSeries(a.item)
          ? a.item.episodes.reduce((sum, ep) => sum + ep.playCount, 0)
          : a.item.playCount
        const bPlayCount = isSeries(b.item)
          ? b.item.episodes.reduce((sum, ep) => sum + ep.playCount, 0)
          : b.item.playCount
        comparison = bPlayCount - aPlayCount
      } else if (sortBy === 'title') {
        comparison = a.item.title.localeCompare(b.item.title, 'ja')
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    .map(({ item }) => item)

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div
      className='pb-40 pt-6 dark:bg-gray-900 overflow-y-auto library-scrollbar'
      style={{ scrollbarGutter: 'stable' }}
    >
      {/* Header */}
      <div className='px-[5%] mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <Library className='w-8 h-8 text-gray-700 dark:text-gray-300' />
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>ライブラリ</h1>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
          >
            <Search className='w-6 h-6 text-gray-600 dark:text-gray-400' />
          </button>
        </div>

        {/* Search bar - only shown when showSearch is true */}
        {showSearch && (
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500' />
            <input
              type='text'
              placeholder='検索...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Type tabs */}
      <div className='px-[5%] mb-4'>
        <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
          {[
            { id: 'all' as const, label: 'すべて' },
            { id: 'audio' as const, label: '音声' },
            { id: 'video' as const, label: '動画' },
            { id: 'favorites' as const, label: 'お気に入り' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeType === type.id
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className='px-[5%] mb-6'>
        <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border border-gray-800 dark:border-gray-200'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* View mode toggle and Sort */}
      <div className='px-[5%] mb-4'>
        <div className='flex gap-2 items-center justify-between'>
          <div className='flex gap-2'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className='w-5 h-5' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className='w-5 h-5' />
            </button>
          </div>

          <div className='flex gap-2 items-center relative'>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
            >
              <SlidersHorizontal className='w-5 h-5 text-gray-600 dark:text-gray-400' />
            </button>

            <button
              onClick={toggleSortOrder}
              className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
            >
              <ArrowUpDown className='w-5 h-5 text-gray-600 dark:text-gray-400' />
            </button>

            {showSortMenu && (
              <div className='absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[140px] z-10'>
                <button
                  onClick={() => {
                    setSortBy('default')
                    setShowSortMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-md text-left ${
                    sortBy === 'default'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  登録順
                </button>
                <button
                  onClick={() => {
                    setSortBy('playCount')
                    setShowSortMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-md text-left ${
                    sortBy === 'playCount'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  再生数順
                </button>
                <button
                  onClick={() => {
                    setSortBy('title')
                    setShowSortMenu(false)
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-md text-left ${
                    sortBy === 'title'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  タイトル順
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content list */}
      <div className='px-[5%]'>
        {sortedItems.length > 0 ? (
          viewMode === 'grid' ? (
            <div className='grid grid-cols-2 gap-4'>
              {sortedItems.map((item) =>
                isSeries(item) ? (
                  <SeriesCard
                    key={item.id}
                    series={item}
                    variant='grid'
                    onTap={onSeriesTap}
                    onToggleFavorite={onToggleFavorite}
                    onAddToQueue={onAddSeriesToQueue}
                    onAddToPlaylist={onAddSeriesToPlaylist}
                  />
                ) : (
                  <ContentCard
                    key={item.id}
                    content={item}
                    variant='grid'
                    onPlay={onPlayContent}
                    onToggleFavorite={onToggleFavorite}
                  />
                ),
              )}
            </div>
          ) : (
            <div className='space-y-3'>
              {sortedItems.map((item) =>
                isSeries(item) ? (
                  <SeriesCard
                    key={item.id}
                    series={item}
                    variant='list'
                    onTap={onSeriesTap}
                    onToggleFavorite={onToggleFavorite}
                    onAddToQueue={onAddSeriesToQueue}
                    onAddToPlaylist={onAddSeriesToPlaylist}
                  />
                ) : (
                  <ContentCard
                    key={item.id}
                    content={item}
                    variant='list'
                    onPlay={onPlayContent}
                    onToggleFavorite={onToggleFavorite}
                  />
                ),
              )}
            </div>
          )
        ) : (
          <div className='text-center py-16'>
            <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Search className='w-8 h-8 text-gray-400 dark:text-gray-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>コンテンツが見つかりません</h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>別の検索条件をお試しください</p>
          </div>
        )}
      </div>
    </div>
  )
}
