import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Play, PlayCircle, Heart, MoreVertical, Download, CircleDot, Check } from 'lucide-react';
import { Series, Episode, Chapter, formatDuration, getCategoryLabel } from '@/data/mockData';

type SortOrder = 'default' | 'newest' | 'oldest';
type FilterType = 'all' | 'unplayed';

interface EpisodeListScreenProps {
  series: Series;
  onBack: () => void;
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void;
  onPlayAll: (series: Series) => void;
  playingEpisodeId?: string;
  playingChapterId?: string;
  sortOrder?: SortOrder;
  onSortOrderChange?: (sortOrder: SortOrder) => void;
  onAddToQueue?: (series: Series, episode: Episode, chapter?: Chapter) => void;
  onAddToPlaylist?: (series: Series, episode: Episode, chapter?: Chapter) => void;
  onToggleEpisodeFavorite?: (episode: Episode) => void;
  onToggleChapterFavorite?: (episode: Episode, chapter: Chapter) => void;
  onToggleSeriesFavorite?: (series: Series) => void;
  onAddSeriesToPlaylist?: (series: Series) => void;
  onAddSeriesToQueue?: (series: Series) => void;
}

export function EpisodeListScreen({
  series,
  onBack,
  onPlayEpisode,
  onPlayAll,
  playingEpisodeId,
  playingChapterId,
  sortOrder: externalSortOrder,
  onSortOrderChange,
  onAddToQueue,
  onAddToPlaylist,
  onToggleEpisodeFavorite,
  onToggleChapterFavorite,
  onToggleSeriesFavorite,
  onAddSeriesToPlaylist,
  onAddSeriesToQueue,
}: EpisodeListScreenProps) {
  // Initialize with all episodes that have units expanded
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    series.episodes.forEach((ep) => {
      if (ep.chapters && ep.chapters.length > 0) {
        initialExpanded.add(ep.id);
      }
    });
    return initialExpanded;
  });

  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('default');
  const sortOrder = externalSortOrder ?? internalSortOrder;
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showEpisodeMenu, setShowEpisodeMenu] = useState<string | null>(null);
  const [showChapterMenu, setShowChapterMenu] = useState<string | null>(null);
  const [showSeriesMenu, setShowSeriesMenu] = useState(false);
  const episodeMenuRef = useRef<HTMLDivElement>(null);
  const chapterMenuRef = useRef<HTMLDivElement>(null);
  const seriesMenuRef = useRef<HTMLDivElement>(null);
  const seriesMenuButtonRef = useRef<HTMLButtonElement>(null);

  const isAccessible = series.isAccessible !== false; // Default to true if undefined

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (episodeMenuRef.current && !episodeMenuRef.current.contains(event.target as Node)) {
        setShowEpisodeMenu(null);
      }
      if (chapterMenuRef.current && !chapterMenuRef.current.contains(event.target as Node)) {
        setShowChapterMenu(null);
      }
      if (seriesMenuRef.current && !seriesMenuRef.current.contains(event.target as Node) &&
          seriesMenuButtonRef.current && !seriesMenuButtonRef.current.contains(event.target as Node)) {
        setShowSeriesMenu(false);
      }
    }

    if (showEpisodeMenu || showChapterMenu || showSeriesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEpisodeMenu, showChapterMenu, showSeriesMenu]);

  // Sync with external sort order
  const handleSortOrderChange = (newOrder: SortOrder) => {
    setInternalSortOrder(newOrder);
    if (onSortOrderChange) {
      onSortOrderChange(newOrder);
    }
  };
  
  const totalDuration = series.episodes.reduce((sum, ep) => sum + ep.duration, 0);
  const progressPercent = (series.completedEpisodes / series.totalEpisodes) * 100;
  const nextEpisode = series.episodes.find((ep) => !ep.isCompleted);
  
  // Find next chapter to play if the next episode has chapters
  const nextChapter = nextEpisode?.chapters?.find((ch) => !ch.isCompleted);
  
  // Create button text based on whether there are units
  const getNextPlayButtonText = () => {
    if (!nextEpisode) return '';
    
    if (nextChapter) {
      return `Ep.${nextEpisode.episodeNumber} Unit${nextChapter.chapterNumber}`;
    } else {
      return `Episode ${nextEpisode.episodeNumber}`;
    }
  };

  // Sort and filter episodes
  const getSortedAndFilteredEpisodes = () => {
    let episodes = [...series.episodes];
    
    // Filter
    if (filterType === 'unplayed') {
      episodes = episodes.filter(ep => {
        // For episodes with chapters, check if at least one chapter is not completed
        if (ep.chapters && ep.chapters.length > 0) {
          return ep.chapters.some(ch => !ch.isCompleted);
        }
        // For episodes without chapters, check the episode's completion status
        return !ep.isCompleted;
      });
    }
    
    // Sort
    if (sortOrder === 'default') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    } else if (sortOrder === 'newest') {
      episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
    } else if (sortOrder === 'oldest') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    }
    
    return episodes;
  };

  const sortedEpisodes = getSortedAndFilteredEpisodes();
  
  const toggleEpisode = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedEpisodes);
    if (newExpanded.has(episodeId)) {
      newExpanded.delete(episodeId);
    } else {
      newExpanded.add(episodeId);
    }
    setExpandedEpisodes(newExpanded);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-20 bg-gray-50 dark:bg-gray-900 z-40 overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-10">
        <button
          onClick={onBack}
          className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          <span className="font-medium text-gray-900 dark:text-white">戻る</span>
        </button>
      </div>

      {/* Series header */}
      <div className="px-[5%] pt-6 pb-4">
        {series.thumbnail && (
          <img
            src={series.thumbnail}
            alt={series.title}
            className="w-full aspect-square rounded-lg object-cover shadow-lg mb-4"
          />
        )}
        
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full mb-3">
          {getCategoryLabel(series.category)}
        </span>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {series.title}
        </h1>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {series.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <span>{series.type === 'audio' ? '音声' : '動画'}</span>
            <span>{series.totalEpisodes}メディア</span>
            <span>合計 {formatDuration(totalDuration)}</span>
          </div>
          
          {/* Series Menu Button */}
          <div className="relative">
            <button
              ref={seriesMenuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowSeriesMenu(!showSeriesMenu);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            {showSeriesMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] z-20" ref={seriesMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSeriesToPlaylist?.(series);
                    setShowSeriesMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  プレイリストに追加
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSeriesToQueue?.(series);
                    setShowSeriesMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  再生キューに追加
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(series.isDownloaded ? 'Delete download series:' : 'Download series:', series.title);
                    setShowSeriesMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {series.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSeriesFavorite?.(series);
                    setShowSeriesMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {series.isFavorite ? 'お気に入りを削除' : 'お気に入りに追加'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              {Math.round(progressPercent)}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {series.completedEpisodes}/{series.totalEpisodes} 完了
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-[5%] mb-6 space-y-3">
        {!isAccessible ? (
          /* Not accessible - show request access button */
          <button
            onClick={() => {
              console.log('Request access for series:', series.title);
              alert('このコンテンツの公開申し込みが送信されました。\n承認されると視聴可能になります。');
            }}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-4 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-5 h-5" />
            公開申し込み
          </button>
        ) : nextEpisode ? (
          <button
            onClick={() => onPlayEpisode(series, nextEpisode, nextChapter)}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-4 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-5 h-5 fill-white dark:fill-gray-900" />
            続きから再生 ({getNextPlayButtonText()})
          </button>
        ) : (
          <button
            onClick={() => onPlayAll(series)}
            className="w-full bg-green-600 text-white font-semibold py-4 rounded-full hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Check className="w-5 h-5" />
            すべて完了！もう一度学習する
          </button>
        )}
        
        {isAccessible && (
          <button
            onClick={() => onPlayAll(series)}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            最初から再生
          </button>
        )}
      </div>

      {/* Episode list */}
      <div>
        {/* Title */}
        <div className="px-[5%]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            エピソード一覧
          </h2>
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="px-[5%] mb-0">
          <div className="flex items-center justify-between mb-0 gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilterType('unplayed')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  filterType === 'unplayed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                未再生のみ
              </button>
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative flex-shrink-0">
              <select
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value as SortOrder)}
                className="px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">登録順</option>
                <option value="newest">新着順</option>
                <option value="oldest">古い順</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700 mt-4">{sortedEpisodes.map((episode) => {
            const isPlaying = playingEpisodeId === episode.id;
            const isExpanded = expandedEpisodes.has(episode.id);
            const hasChapters = episode.chapters && episode.chapters.length > 0;
            
            // Check if all chapters are completed (for episodes with chapters)
            const allChaptersCompleted = hasChapters
              ? episode.chapters!.every((ch) => ch.isCompleted)
              : false;
            
            // Episode is considered completed if it has no chapters and is marked complete,
            // or if it has chapters and all chapters are completed
            const isEpisodeCompleted = hasChapters ? allChaptersCompleted : episode.isCompleted;
            
            // Calculate total play count from chapters if they exist
            const totalPlayCount = hasChapters 
              ? episode.chapters!.reduce((sum, chapter) => sum + chapter.playCount, 0)
              : episode.playCount;
            
            // Calculate total duration from chapters if they exist
            const totalDuration = hasChapters
              ? episode.chapters!.reduce((sum, chapter) => sum + chapter.duration, 0)
              : episode.duration;
            
            return (
              <div key={episode.id} className="bg-white dark:bg-gray-900">
                {/* Episode Row */}
                <div
                  className={`flex items-start gap-3 px-[5%] py-4 transition-colors ${
                    !isAccessible ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isPlaying
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div 
                    className={`relative w-16 h-16 flex-shrink-0 ${!hasChapters && isAccessible ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!hasChapters && isAccessible) {
                        onPlayEpisode(series, episode);
                      }
                    }}
                  >
                    {series.thumbnail ? (
                      <img
                        src={series.thumbnail}
                        alt={series.title}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                    )}
                    
                    {/* Favorite Badge - Top Left (only show if favorite and not playing) */}
                    {episode.isFavorite && !isPlaying && (
                      <div className="absolute -top-1 -left-1 bg-white/90 dark:bg-white/80 rounded-full p-1 shadow-md">
                        <Heart className="w-3 h-3 text-red-500 fill-red-500" strokeWidth={0} />
                      </div>
                    )}
                    
                    {/* Unread Badge - Top Right (only show if playCount is 0 and not playing) */}
                    {totalPlayCount === 0 && !isPlaying && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 shadow-md">
                        <CircleDot className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    
                    {/* Playing overlay - displayed in center for all episodes when playing */}
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center z-10">
                        <Play className="w-6 h-6 text-white fill-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Episode Info */}
                  <div 
                    className={`flex-1 min-w-0 ${!hasChapters && isAccessible ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!hasChapters && isAccessible) {
                        onPlayEpisode(series, episode);
                      }
                    }}
                  >
                    {/* Line 1: Episode Number and Title - Full width */}
                    <h4 className={`font-semibold truncate mb-1 ${isPlaying ? 'text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      <span className="text-xs text-gray-600 dark:text-gray-300 mr-1.5">Ep.{episode.episodeNumber}</span>
                      {episode.title}
                    </h4>
                    
                    {/* Line 2: Chapter count and duration (only if chapters exist) */}
                    {hasChapters && (
                      <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                        <span>{episode.chapters!.length} Units</span>
                        <span className="text-gray-700 dark:text-gray-300">{formatDuration(totalDuration)}</span>
                      </div>
                    )}
                    
                    {/* Line 3: Duration/Play Count and Toggle Button */}
                    <div className="flex items-center justify-between gap-2 h-5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold">
                        {!hasChapters && (
                          <span className="text-gray-700 dark:text-gray-300">{formatDuration(totalDuration)}</span>
                        )}
                        {totalPlayCount > 0 && (
                          <span className="text-purple-700 dark:text-purple-400">{totalPlayCount.toLocaleString()}回再生</span>
                        )}
                        {isPlaying && (
                          <span className="text-blue-800 dark:text-blue-300 font-bold">再生中</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Download Icon */}
                        {episode.isDownloaded && (
                          <div className="flex-shrink-0">
                            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}

                        {/* Episode Menu Button - Only show for episodes without chapters */}
                        {!hasChapters && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEpisodeMenu(showEpisodeMenu === episode.id ? null : episode.id);
                              }}
                              className="p-0.5 hover:opacity-70 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            
                            {showEpisodeMenu === episode.id && (
                              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-20" ref={episodeMenuRef}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToQueue?.(series, episode);
                                    setShowEpisodeMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  再生キューに追加
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToPlaylist?.(series, episode);
                                    setShowEpisodeMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  プレイリストに追加
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(episode.isDownloaded ? 'Delete download episode:' : 'Download episode:', episode.title);
                                    setShowEpisodeMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {episode.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleEpisodeFavorite?.(episode);
                                    setShowEpisodeMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {episode.isFavorite ? 'お気に入りを削除' : 'お気に入りに追加'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Expand/Collapse Button - Right side of Line 3 */}
                        {hasChapters && (
                          <button
                            onClick={(e) => toggleEpisode(episode.id, e)}
                            className="flex-shrink-0 hover:opacity-70 transition-opacity"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapters List */}
                {hasChapters && isExpanded && (
                  <div className="pl-[5%] border-t border-gray-200 dark:border-gray-700">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">{episode.chapters!
                      .filter((chapter) => {
                        // Apply filter for chapters
                        if (filterType === 'unplayed') {
                          return !chapter.isCompleted;
                        }
                        return true;
                      })
                      .map((chapter) => {
                      // Check if this chapter is currently playing
                      const isChapterPlaying = playingChapterId === chapter.id;
                      
                      return (
                        <div
                          key={chapter.id}
                          onClick={() => {
                            // Only allow playback if accessible
                            if (isAccessible) {
                              console.log('Play chapter:', chapter.id);
                              onPlayEpisode(series, episode, chapter);
                            }
                          }}
                          className={`flex items-center gap-1 transition-colors ${
                            isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                          } ${
                            isChapterPlaying
                              ? 'bg-blue-50 dark:bg-blue-950/20'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          {/* Left side - Favorite Icon */}
                          <div className="flex items-center justify-center w-5 flex-shrink-0 pl-[2px]">
                            {chapter.isFavorite && (
                              <Heart className="w-3 h-3 text-white fill-white drop-shadow" strokeWidth={0} />
                            )}
                          </div>
                          
                          {/* Chapter Info */}
                          <div className="flex-1 min-w-0 py-2.5 pr-[2px]">
                            <h5 className={`text-sm font-medium truncate ${
                              isChapterPlaying ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-1.5">UN.{chapter.chapterNumber}</span>
                              {chapter.title}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                              <span>{formatDuration(chapter.duration)}</span>
                              {chapter.playCount > 0 && (
                                <span className="text-purple-700 dark:text-purple-400">{chapter.playCount.toLocaleString()}回再生</span>
                              )}
                              {isChapterPlaying && (
                                <span className="text-blue-700 dark:text-blue-400">再生中</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Right side buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0 pr-2">
                            {/* Chapter Play Button - Only show when playing */}
                            {isChapterPlaying && (
                              <Play className="w-8 h-8 text-blue-600 dark:text-blue-500 fill-blue-600 dark:fill-blue-500" />
                            )}
                            
                            {/* Chapter Menu Button */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowChapterMenu(showChapterMenu === chapter.id ? null : chapter.id);
                                }}
                                className="p-0.5 hover:opacity-70 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              
                              {showChapterMenu === chapter.id && (
                                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-20" ref={chapterMenuRef}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddToQueue?.(series, episode, chapter);
                                      setShowChapterMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    再生キューに追加
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddToPlaylist?.(series, episode, chapter);
                                      setShowChapterMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    プレイリストに追加
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log(chapter.isDownloaded ? 'Delete download chapter:' : 'Download chapter:', chapter.title);
                                      setShowChapterMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    {chapter.isDownloaded ? 'ダウンロード削除' : 'ダウンロード'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleChapterFavorite?.(episode, chapter);
                                      setShowChapterMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    {chapter.isFavorite ? 'お気に入りを削除' : 'お気に入りに追加'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}