import { ChevronDown, ChevronLeft, Clock, FileText, Heart, List, Play, Repeat, Volume2, ChevronUp, SkipBack, SkipForward, RotateCcw, RotateCw, Pause, Cast, Gauge, ChevronRight, Dices, Shuffle, Maximize, Speaker, X, CircleDot, ChevronsRight, ChevronsLeft, Plus, Pencil } from 'lucide-react';
import { Series, Episode, Chapter, formatDuration } from '@/data/mockData';
import { useState, useEffect } from 'react';
import { Slider } from '@/app/components/ui/slider';

type SortOrder = 'default' | 'newest' | 'oldest';
type FilterType = 'all' | 'unplayed';

interface MyChapter {
  id: string;
  time: number;
  name?: string;
}

interface EpisodePlayerProps {
  series: Series;
  episode: Episode;
  chapter?: Chapter;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onNextEpisode: () => void;
  onPrevEpisode: () => void;
  hasNextEpisode: boolean;
  hasPrevEpisode: boolean;
  onToggleFavorite?: (series: Series) => void;
  onToggleEpisodeFavorite?: (episode: Episode) => void;
  onToggleChapterFavorite?: (episode: Episode, chapter: Chapter) => void;
  onPlayEpisode?: (series: Series, episode: Episode, chapter?: Chapter) => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  playlistMode?: {
    playlistName: string;
    playlistCoverImage?: string;
    playlistGradient?: string;
  };
}

export function EpisodePlayer({
  series,
  episode,
  chapter,
  isPlaying,
  onTogglePlay,
  onClose,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode,
  hasPrevEpisode,
  onToggleFavorite,
  onToggleEpisodeFavorite,
  onToggleChapterFavorite,
  onPlayEpisode,
  onNextChapter,
  onPrevChapter,
  sortOrder,
  onSortOrderChange,
  onTimeUpdate,
  playlistMode,
}: EpisodePlayerProps) {
  const [currentTime, setCurrentTime] = useState(45);
  const [speed, setSpeed] = useState(1.0);
  const [loopMode, setLoopMode] = useState<'off' | 'single' | 'all'>('off');
  const [volume, setVolume] = useState(75);
  const [timer, setTimer] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showLoopMenu, setShowLoopMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showNextEpisode, setShowNextEpisode] = useState(true);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isRandomOn, setIsRandomOn] = useState(false);
  const [showControlsMenu, setShowControlsMenu] = useState(false);
  const [showContentArea, setShowContentArea] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [myChapters, setMyChapters] = useState<MyChapter[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterName, setEditingChapterName] = useState('');

  const currentDuration = chapter?.duration || episode.duration;
  const progress = (currentTime / currentDuration) * 100;
  const remainingTime = currentDuration - currentTime;

  // Update parent component with current time
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime, currentDuration);
    }
  }, [currentTime, currentDuration, onTimeUpdate]);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentDuration) {
            return 0; // Loop back to start
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentDuration]);

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
  const loopOptions = [
    { value: 'off', label: 'なし' },
    { value: 'single', label: '1回' },
    { value: 'all', label: '無制限' },
  ];
  const timerOptions = [
    { value: null, label: 'なし' },
    { value: 15, label: '15分' },
    { value: 30, label: '30分' },
    { value: 60, label: '1時間' },
    { value: 120, label: '2時間' },
    { value: 240, label: '4時間' },
  ];

  // Helper function to get sorted and filtered episodes
  const getSortedEpisodes = (): Episode[] => {
    let episodes = [...series.episodes];
    
    // Apply filter
    if (filterType === 'unplayed') {
      episodes = episodes.filter((ep) => !ep.isCompleted);
    }
    
    // Apply sort
    if (sortOrder === 'default') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    } else if (sortOrder === 'newest') {
      episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);
    } else if (sortOrder === 'oldest') {
      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    }
    
    return episodes;
  };

  // Find next episode using sorted list
  const sortedEpisodes = getSortedEpisodes();
  const currentIndex = sortedEpisodes.findIndex((ep) => ep.id === episode.id);
  const nextEpisode = sortedEpisodes[currentIndex + 1];

  const handleEpisodeClick = (ep: Episode) => {
    if (onPlayEpisode) {
      onPlayEpisode(series, ep, chapter);
    }
  };

  const toggleEpisode = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(episodeId)) {
        newSet.delete(episodeId);
      } else {
        newSet.add(episodeId);
      }
      return newSet;
    });
  };

  const getTimerLabel = () => {
    if (timer === null) return 'し';
    if (timer < 60) return `${timer}分`;
    return `${timer / 60}時間`;
  };

  // Dummy text content
  const textContent = `Episode ${episode.episodeNumber}: ${episode.title}\\n\\nこのエピソードでは、効果的な学習方法と習慣化のテクニックについて詳しく解説していきます。\\n\\n第1章：学習の基本原則\\n\\n学習を効果的に行うためには、まず基本的な原則を理解することが重要です。人間の脳は、情報を一度に大量に処理することが苦手ですが、繰り返し学習することで長期記憶に定着させることができます。\\n\\nこの「反復学習」の原理は、何千年も前から知られていましたが、現代の脳科学によってそのメカニズムが明らかになってきました。特に重要なのは「間隔反復」という手法です。\\n\\n第2章：習慣化のテクニック\\n\\n新しいスキルを身につけるためには、それを習慣化することが不可欠です。習慣化には平均で66日かかるという研究結果があります。\\n\\n毎日同じ時間に、同じ場所で学習することで、脳はそのパターンを認識し、自動的に学習モードに入ることができるようになります。\\n\\n第3章：効果的な復習方法\\n\\n学んだ内容を確実に定着させるためには、適切なタイミングでの復習が重要です。エビングハウスの忘却線によれば、学習直後から急速に記憶が失われていきますが、適切なタイミングで復習することで、記憶の定着率を大幅に向上させることができます。\\n\\n理想的な復習のタイミングは、学習後1時間、1日後、1週間後、1ヶ月後です。このパターンを繰り返すことで、長期記憶として定着します。\\n\\n第4章：モチベーションの維持\\n\\n長期的な学習を継続するためには、モチベーションの維持が欠かせません。小さな成功体験を積み重ねることで、ドーパミンが分泌され、学習への意欲が高まります。\\n\\nまた、学習の進捗を可視化することも効果的です。日々の学習時間や達成した目標を記録することで、自分の成長を実感することができます。`;

  // Load next episode visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('showNextEpisode');
    if (saved !== null) {
      setShowNextEpisode(JSON.parse(saved));
    }
  }, []);

  // Auto-expand episodes with chapters when episode list is opened
  useEffect(() => {
    if (showEpisodeList) {
      const episodesWithChapters = new Set<string>();
      series.episodes.forEach((ep) => {
        if (ep.chapters && ep.chapters.length > 0) {
          episodesWithChapters.add(ep.id);
        }
      });
      setExpandedEpisodes(episodesWithChapters);
    }
  }, [showEpisodeList, series.episodes]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside any menu
      if (!target.closest('.relative')) {
        setShowSpeedMenu(false);
        setShowLoopMenu(false);
        setShowTimerMenu(false);
        setShowVolumeMenu(false);
      }
    };

    if (showSpeedMenu || showLoopMenu || showTimerMenu || showVolumeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [showSpeedMenu, showLoopMenu, showTimerMenu, showVolumeMenu]);

  // Handle long press to add my chapter
  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      const newChapter: MyChapter = {
        id: `my-chapter-${Date.now()}`,
        time: currentTime,
      };
      setMyChapters([...myChapters, newChapter]);
      // Show feedback
      alert('マイチャプターを追加しました');
    }, 800); // Long press duration: 800ms
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col max-w-[460px] mx-auto">
      {/* Fixed Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 z-20">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        
        <div className="flex items-center justify-center">
          {playlistMode ? (
            /* Playlist Mode: Show playlist name with small cover image */
            <div className="flex items-center justify-center gap-2">
              {/* Small Square Cover Image */}
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                {playlistMode.playlistCoverImage ? (
                  <img 
                    src={playlistMode.playlistCoverImage} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${playlistMode.playlistGradient || 'from-blue-500 to-purple-600'}`} />
                )}
              </div>
              <p className="text-sm text-gray-900 dark:text-white font-medium text-center truncate">
                {playlistMode.playlistName}
              </p>
            </div>
          ) : (
            /* Normal Mode: Show series title */
            <p className="text-sm text-gray-900 dark:text-white font-medium text-center truncate">{series.title}</p>
          )}
        </div>

        {/* Hide episode list toggle button in playlist mode */}
        {!playlistMode ? (
          <button
            onClick={() => setShowEpisodeList(!showEpisodeList)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <List className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        ) : (
          <div className="w-10" /> 
        )}
      </div>

      {/* Content */}
      {!showEpisodeList ? (
        /* Full Player View */
        <div className="flex-1 overflow-y-auto scrollbar-hide py-0 pt-2 min-[371px]:pt-10">
          {/* Artwork or Video */}
          {series.type === 'video' && episode.videoUrl ? (
            /* Video Player with YouTube embed */
            <>
              {episode.aspectRatio === '16:9' ? (
                /* 16:9 Landscape - Full width, height matches audio content */
                <div className="w-full h-[calc((100vw-64px)*0.85)] min-[371px]:h-[calc((100vw-64px)*0.9)] bg-black flex items-center justify-center mb-1 mt-0 min-[371px]:mb-4">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${episode.videoUrl}?autoplay=1&mute=1`}
                    title={episode.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                /* 9:16 Portrait or 1:1 Square - Centered with padding */
                <div className="flex flex-col items-center mb-1 mt-0 min-[371px]:mb-4 px-8">
                  <div className={`w-[85%] min-[371px]:w-[90%] md:w-full bg-black rounded-md overflow-hidden flex items-center justify-center ${
                    episode.aspectRatio === '9:16'
                      ? 'aspect-square' // 9:16 - same height as audio
                      : 'aspect-square' // 1:1 - square
                  }`}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${episode.videoUrl}?autoplay=1&mute=1`}
                      title={episode.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={episode.aspectRatio === '9:16' ? 'w-auto h-full' : 'w-full h-full'}
                      style={{ aspectRatio: episode.aspectRatio === '9:16' ? '9/16' : '1/1' }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Audio Artwork - Always Square */
            <div 
              className="flex flex-col items-center mb-1 mt-0 min-[371px]:mb-4 px-8"
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
            >
              {series.thumbnail ? (
                <img
                  src={series.thumbnail}
                  alt={series.title}
                  className="w-[85%] min-[371px]:w-[90%] md:w-full aspect-square rounded-md shadow-2xl object-cover"
                />
              ) : (
                <div className="w-[85%] min-[371px]:w-[90%] md:w-full aspect-square rounded-md shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-8xl">📚</span>
                </div>
              )}
            </div>
          )}

          {/* Episode Info */}
          <div className="mb-4 text-center px-4 h-[100px] flex flex-col justify-center relative">
            {/* Favorite button in top right */}
            <button
              onClick={() => {
                if (chapter && onToggleChapterFavorite) {
                  onToggleChapterFavorite(episode, chapter);
                } else if (onToggleEpisodeFavorite) {
                  onToggleEpisodeFavorite(episode);
                }
              }}
              className="absolute top-0 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Heart 
                className={`w-5 h-5 ${
                  (chapter?.isFavorite || episode.isFavorite) 
                    ? 'fill-blue-500 text-blue-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} 
              />
            </button>

            {chapter ? (
              <p className="text-base text-gray-500 dark:text-gray-400 mb-1 h-6">
                Unit.{chapter.chapterNumber}
              </p>
            ) : (
              <p className="text-base text-gray-500 dark:text-gray-400 mb-1 h-6">
                Episode.{episode.episodeNumber}
              </p>
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 h-[52px] flex items-center justify-center line-clamp-2 leading-[26px]">
              {chapter ? chapter.title : episode.title}
            </h3>
            {chapter ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 h-5">
                <span>Ep.{episode.episodeNumber}</span>
                <span className="ml-2 truncate inline-block max-w-[70%] align-bottom">{episode.title}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 h-5">
                {/* Empty space to maintain consistent height */}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-0 px-8">
            <Slider
              value={[progress]}
              onValueChange={(value) => {
                const newTime = (value[0] / 100) * episode.duration;
                setCurrentTime(newTime);
              }}
              max={100}
              step={0.1}
              className="w-full [&_[data-slot='slider-thumb']]:size-[16px]"
            />
            {/* Time labels */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              
              {/* Route Picker (Cast/Bluetooth) */}
              <button
                onClick={() => {
                  // Route picker functionality would go here
                  console.log('Route picker clicked');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <Cast className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              
              <span>-{formatDuration(Math.floor(remainingTime))}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-0 mb-[6px] min-[371px]:mb-[28px] min-[371px]:mt-[22px] px-16">
            <button
              onClick={() => {
                if (chapter && onPrevChapter) {
                  // If chapter exists, check if there is a previous chapter
                  const currentChapterIndex = episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? -1;
                  if (currentChapterIndex > 0) {
                    // Go to previous chapter in the same episode
                    onPrevChapter();
                  } else {
                    // If no previous chapter, go to previous episode
                    const currentEpisodeIndex = series.episodes.findIndex((ep) => ep.id === episode.id);
                    const prevEpisode = series.episodes[currentEpisodeIndex - 1];
                    if (prevEpisode && onPlayEpisode) {
                      // If previous episode has chapters, go to its last chapter
                      if (prevEpisode.chapters && prevEpisode.chapters.length > 0) {
                        const lastChapter = prevEpisode.chapters[prevEpisode.chapters.length - 1];
                        onPlayEpisode(series, prevEpisode, lastChapter);
                      } else {
                        // If no chapters, play the episode itself
                        onPlayEpisode(series, prevEpisode);
                      }
                    }
                  }
                } else {
                  onPrevEpisode();
                }
              }}
              disabled={!hasPrevEpisode && (!chapter || (episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? 0) === 0)}
              className={`p-2 rounded-full transition-colors ${
                hasPrevEpisode || (chapter && (episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? 0) > 0)
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <SkipBack className="w-7 h-7 min-[371px]:w-9 min-[371px]:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-gray-900 dark:text-white" />
            </button>

            {/* Previous Chapter Button */}
            <button
              onClick={() => {
                if (chapter && onPrevChapter) {
                  // If chapter exists, check if there is a previous chapter
                  const currentChapterIndex = episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? -1;
                  if (currentChapterIndex > 0) {
                    // Go to previous chapter in the same episode
                    onPrevChapter();
                  }
                }
              }}
              disabled={!chapter || !episode.chapters || (episode.chapters.findIndex((ch) => ch.id === chapter.id) === 0)}
              className={`p-2 rounded-full transition-colors ${
                chapter && episode.chapters && (episode.chapters.findIndex((ch) => ch.id === chapter.id) > 0)
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <ChevronsLeft className="w-7 h-7 min-[371px]:w-8 min-[371px]:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-900 dark:text-white" />
            </button>

            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 30))}
              className="p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative"
            >
              <RotateCcw className="w-7 h-7 min-[371px]:w-8 min-[371px]:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-900 dark:text-white" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] min-[371px]:text-xs font-bold text-gray-900 dark:text-white">30</span>
            </button>

            <button
              onClick={onTogglePlay}
              className="p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 min-[371px]:w-16 min-[371px]:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
              ) : (
                <Play className="w-10 h-10 min-[371px]:w-16 min-[371px]:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
              )}
            </button>

            <button
              onClick={() => setCurrentTime(Math.min(episode.duration, currentTime + 30))}
              className="p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative"
            >
              <RotateCw className="w-7 h-7 min-[371px]:w-8 min-[371px]:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-900 dark:text-white" />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] min-[371px]:text-xs font-bold text-gray-900 dark:text-white">30</span>
            </button>

            {/* Next Chapter Button */}
            <button
              onClick={() => {
                if (chapter && onNextChapter) {
                  // If chapter exists, check if there is a next chapter
                  const currentChapterIndex = episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? -1;
                  const hasNextChapter = currentChapterIndex !== -1 && 
                                        episode.chapters && 
                                        currentChapterIndex < episode.chapters.length - 1;
                  if (hasNextChapter) {
                    // Go to next chapter in the same episode
                    onNextChapter();
                  }
                }
              }}
              disabled={!chapter || !episode.chapters || (episode.chapters.findIndex((ch) => ch.id === chapter.id) === episode.chapters.length - 1)}
              className={`p-2 rounded-full transition-colors ${
                chapter && episode.chapters && (episode.chapters.findIndex((ch) => ch.id === chapter.id) < episode.chapters.length - 1)
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <ChevronsRight className="w-7 h-7 min-[371px]:w-8 min-[371px]:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-900 dark:text-white" />
            </button>

            <button
              onClick={() => {
                if (chapter && onNextChapter) {
                  // If chapter exists, check if there is a next chapter
                  const currentChapterIndex = episode.chapters?.findIndex((ch) => ch.id === chapter.id) ?? -1;
                  const hasNextChapter = currentChapterIndex !== -1 && 
                                        episode.chapters && 
                                        currentChapterIndex < episode.chapters.length - 1;
                  if (hasNextChapter) {
                    // Go to next chapter in the same episode
                    onNextChapter();
                  } else {
                    // If no next chapter, go to next episode
                    const currentEpisodeIndex = series.episodes.findIndex((ep) => ep.id === episode.id);
                    const nextEpisode = series.episodes[currentEpisodeIndex + 1];
                    if (nextEpisode && onPlayEpisode) {
                      // If next episode has chapters, go to its first chapter
                      if (nextEpisode.chapters && nextEpisode.chapters.length > 0) {
                        onPlayEpisode(series, nextEpisode, nextEpisode.chapters[0]);
                      } else {
                        // If no chapters, play the episode itself
                        onPlayEpisode(series, nextEpisode);
                      }
                    }
                  }
                } else {
                  onNextEpisode();
                }
              }}
              disabled={!hasNextEpisode && (!chapter || !episode.chapters || (episode.chapters.findIndex((ch) => ch.id === chapter.id) === episode.chapters.length - 1))}
              className={`p-2 rounded-full transition-colors ${
                hasNextEpisode || (chapter && episode.chapters && (episode.chapters.findIndex((ch) => ch.id === chapter.id) < episode.chapters.length - 1))
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <SkipForward className="w-7 h-7 min-[371px]:w-9 min-[371px]:h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-evenly px-6 mb-0 min-[371px]:-mb-4 min-[371px]:mt-0">
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowLoopMenu(false);
                  setShowTimerMenu(false);
                  setShowVolumeMenu(false);
                }}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  showSpeedMenu
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <Gauge className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                {speed !== 1.0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                    {speed}x
                  </span>
                )}
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px] z-10">
                  {speedOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-lg text-left ${
                        speed === s
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  // Toggle through loop modes: off → single → all → off
                  if (loopMode === 'off') {
                    setLoopMode('single');
                  } else if (loopMode === 'single') {
                    setLoopMode('all');
                  } else {
                    setLoopMode('off');
                  }
                }}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  loopMode !== 'off'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <Repeat className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                {loopMode === 'single' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-gray-900 dark:bg-white">
                    <span className="text-[9px] font-bold text-white dark:text-gray-900">1</span>
                  </span>
                )}
              </button>
            </div>

            {/* Random Button - moved between Repeat and Volume */}
            <div className="relative">
              <button
                onClick={() => setIsRandomOn(!isRandomOn)}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  isRandomOn
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <Shuffle className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowVolumeMenu(!showVolumeMenu);
                  setShowSpeedMenu(false);
                  setShowLoopMenu(false);
                  setShowTimerMenu(false);
                }}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  showVolumeMenu
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <Volume2 className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                {volume !== 100 && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                    {volume}%
                  </span>
                )}
              </button>
              
              {showVolumeMenu && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[240px] z-10">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <Slider
                        value={[volume]}
                        onValueChange={(value) => setVolume(value[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 w-10 text-right">{volume}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Random Button removed from here - now between Repeat and Volume */}

            <div className="relative">
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  showChapterList
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <List className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowTimerMenu(!showTimerMenu);
                  setShowSpeedMenu(false);
                  setShowLoopMenu(false);
                  setShowVolumeMenu(false);
                }}
                className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  showTimerMenu
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                    : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                }`}
              >
                <Clock className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                {timer && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                    {getTimerLabel()}
                  </span>
                )}
              </button>
              
              {showTimerMenu && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px] z-10">
                  {timerOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        setTimer(option.value);
                        setShowTimerMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-lg text-left ${
                        timer === option.value
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowTextModal(true)}
                className="max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30"
              >
                <FileText className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add padding at bottom if next episode is shown */}
          {showNextEpisode && nextEpisode && (
            <div className="h-20 min-[371px]:h-0" />
          )}
        </div>
      ) : (
        /* Episode List View with Mini Player */
        <div className={`flex-1 flex flex-col ${showContentArea ? '' : 'overflow-y-auto scrollbar-hide'}`}>
          {/* Mini Player */}
          <div className={`flex-shrink-0 bg-white dark:bg-gray-900 ${showContentArea ? '' : 'border-b border-gray-200 dark:border-gray-800'}`}>
            {/* Thumbnail/Video - 16:9 aspect ratio, full width */}
            {series.type === 'video' && episode.videoUrl ? (
              /* Video player - 16:9 */
              <div className="w-full aspect-video bg-black relative">
                <iframe
                  src={`https://www.youtube.com/embed/${episode.videoUrl}?autoplay=0&mute=1`}
                  title={episode.title}
                  frameBorder="0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="w-full h-full"
                />
              </div>
            ) : series.thumbnail ? (
              /* Audio thumbnail - 16:9 */
              <div className="w-full aspect-video bg-black relative group">
                <img
                  src={series.thumbnail}
                  alt={series.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Hover Overlay with Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  {/* Top Right Controls */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* Audio Output Toggle Button */}
                    <button
                      onClick={() => {/* TODO: Toggle audio output */}}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Speaker className="w-5 h-5 text-white" />
                    </button>
                    
                    {/* Fullscreen Button */}
                    <button
                      onClick={() => {/* TODO: Fullscreen logic */}}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  
                  {/* Center Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {/* Previous Button */}
                    <button
                      onClick={() => {
                        if (chapter && onPrevChapter) {
                          onPrevChapter();
                        } else if (hasPrevEpisode) {
                          onPrevEpisode();
                        }
                      }}
                      disabled={!hasPrevEpisode && (!chapter || !onPrevChapter)}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SkipBack className="w-6 h-6 text-white" fill="white" />
                    </button>
                    
                    {/* 30s Backward */}
                    <button
                      onClick={() => setCurrentTime(Math.max(0, currentTime - 30))}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <RotateCcw className="w-6 h-6 text-white" />
                    </button>
                    
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => onTogglePlay()}
                      className="p-4 bg-white/30 hover:bg-white/40 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" fill="white" />
                      ) : (
                        <Play className="w-8 h-8 text-white" fill="white" />
                      )}
                    </button>
                    
                    {/* 30s Forward */}
                    <button
                      onClick={() => setCurrentTime(Math.min(currentDuration, currentTime + 30))}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <RotateCw className="w-6 h-6 text-white" />
                    </button>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => {
                        if (chapter && onNextChapter) {
                          onNextChapter();
                        } else if (hasNextEpisode) {
                          onNextEpisode();
                        }
                      }}
                      disabled={!hasNextEpisode && (!chapter || !onNextChapter)}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SkipForward className="w-6 h-6 text-white" fill="white" />
                    </button>
                  </div>
                  
                  {/* Bottom Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0">
                    {/* Time Display */}
                    <div className="flex justify-between px-[15px] pb-1">
                      <span className="text-white text-sm">{formatDuration(currentTime)}</span>
                      <span className="text-white text-sm">-{formatDuration(currentDuration - currentTime)}</span>
                    </div>
                    
                    {/* Progress Bar - Full Width */}
                    <div className="px-[15px] pb-4">
                      <Slider
                        value={[currentTime]}
                        max={currentDuration}
                        step={1}
                        onValueChange={(value) => setCurrentTime(value[0])}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder - 16:9 */
              <div className="w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl">📚</span>
              </div>
            )}

            {/* Episode Info */}
            <div className="p-[15px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {chapter ? (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        Unit.{chapter.chapterNumber} {chapter.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        Ep.{episode.episodeNumber} {episode.title}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        Episode.{episode.episodeNumber} {episode.title}
                      </h4>
                    </>
                  )}
                </div>
                
                {/* Toggle Controls/Content Button */}
                <button
                  onClick={() => {
                    if (showContentArea) {
                      setShowContentArea(false);
                    } else {
                      setShowControlsMenu(!showControlsMenu);
                    }
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                >
                  {showContentArea ? (
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  ) : showControlsMenu ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Mini Player Controls */}
            {showControlsMenu && (
              <div className="flex items-center justify-evenly mt-0 px-5 pb-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowLoopMenu(false);
                    setShowTimerMenu(false);
                    setShowVolumeMenu(false);
                  }}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    showSpeedMenu
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <Gauge className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                  {speed !== 1.0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                      {speed}x
                    </span>
                  )}
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px] z-10">
                    {speedOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSpeed(s);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg text-left ${
                          speed === s
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    // Toggle through loop modes: off → single → all → off
                    if (loopMode === 'off') {
                      setLoopMode('single');
                    } else if (loopMode === 'single') {
                      setLoopMode('all');
                    } else {
                      setLoopMode('off');
                    }
                  }}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    loopMode !== 'off'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <Repeat className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                  {loopMode === 'single' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-gray-900 dark:bg-white">
                      <span className="text-[9px] font-bold text-white dark:text-gray-900">1</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Random Button - moved between Repeat and Volume */}
              <div className="relative">
                <button
                  onClick={() => setIsRandomOn(!isRandomOn)}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    isRandomOn
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <Shuffle className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowVolumeMenu(!showVolumeMenu);
                    setShowSpeedMenu(false);
                    setShowLoopMenu(false);
                    setShowTimerMenu(false);
                  }}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    showVolumeMenu
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <Volume2 className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                  {volume !== 100 && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                      {volume}%
                    </span>
                  )}
                </button>
                
                {showVolumeMenu && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[240px] z-10">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => setVolume(value[0])}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 w-10 text-right">{volume}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Random Button removed from here - now between Repeat and Volume */}

              {(onToggleFavorite || onToggleEpisodeFavorite || onToggleChapterFavorite) && (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (chapter && onToggleChapterFavorite) {
                        onToggleChapterFavorite(episode, chapter);
                      } else if (onToggleEpisodeFavorite) {
                        onToggleEpisodeFavorite(episode);
                      } else if (onToggleFavorite) {
                        onToggleFavorite(series);
                      }
                    }}
                    className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                      (chapter && chapter.isFavorite) || (!chapter && episode.isFavorite)
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                        : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                    }`}
                  >
                    <Heart
                      className={`max-[370px]:w-4 max-[370px]:h-4 w-5 h-5 ${
                        (chapter && chapter.isFavorite) || (!chapter && episode.isFavorite)
                          ? 'fill-current'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    setShowTimerMenu(!showTimerMenu);
                    setShowLoopMenu(false);
                    setShowSpeedMenu(false);
                    setShowVolumeMenu(false);
                  }}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    showTimerMenu
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <Clock className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                  {timer && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-semibold px-1 rounded-full min-w-[18px] text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                      {getTimerLabel()}
                    </span>
                  )}
                </button>
                
                {showTimerMenu && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px] z-10">
                    {timerOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          setTimer(option.value);
                          setShowTimerMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg text-left ${
                          timer === option.value
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowContentArea(!showContentArea)}
                  className={`max-[370px]:w-8 max-[370px]:h-8 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    showContentArea
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'
                      : 'bg-black/8 dark:bg-white/20 text-gray-900 dark:text-white hover:bg-black/15 dark:hover:bg-white/30'
                  }`}
                >
                  <FileText className="max-[370px]:w-4 max-[370px]:h-4 w-5 h-5" />
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Episode List / Content Area */}
          {!showContentArea ? (
            /* Episode List */
          <div className="flex-1 py-4 bg-white dark:bg-gray-800 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 px-4">エピソード一覧</h3>
            
            {/* Filter and Sort Controls */}
            <div className="flex items-center justify-between mb-4 gap-3 px-4">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setFilterType('unplayed')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    filterType === 'unplayed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  未再生のみ
                </button>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative flex-shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
                  className="px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">デフォルト</option>
                  <option value="oldest">登録順</option>
                  <option value="newest">新着順</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 dark:text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="pb-4">
              {getSortedEpisodes().map((ep) => {
                const isCurrentEpisode = ep.id === episode.id;
                const isExpanded = expandedEpisodes.has(ep.id);
                const hasChapters = ep.chapters && ep.chapters.length > 0;
                
                // Calculate total play count from chapters if they exist
                const totalPlayCount = hasChapters 
                  ? ep.chapters!.reduce((sum, chapter) => sum + chapter.playCount, 0)
                  : ep.playCount;
                
                // Calculate total duration from chapters if they exist
                const totalDuration = hasChapters
                  ? ep.chapters!.reduce((sum, chapter) => sum + chapter.duration, 0)
                  : ep.duration;
                
                return (
                  <div key={ep.id}>
                    {/* Episode Row */}
                    <div
                      className={`flex items-start gap-3 py-2.5 px-4 border-b transition-colors ${
                        isCurrentEpisode
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div 
                        className={`relative w-14 h-14 flex-shrink-0 ${!hasChapters ? 'cursor-pointer' : ''}`}
                        onClick={() => !hasChapters && onPlayEpisode && onPlayEpisode(series, ep)}
                      >
                        {series.thumbnail ? (
                          <img
                            src={series.thumbnail}
                            alt={series.title}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xl">📚</span>
                          </div>
                        )}
                        
                        {/* Unread Badge - Top Right (only show if playCount is 0 and not playing) */}
                        {ep.playCount === 0 && !isCurrentEpisode && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-md">
                            <CircleDot className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                        
                        {/* Playing overlay - displayed in center for all episodes when playing */}
                        {isCurrentEpisode && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center z-10">
                            <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>

                      {/* Episode Info */}
                      <div 
                        className={`flex-1 min-w-0 ${!hasChapters ? 'cursor-pointer' : ''}`}
                        onClick={() => !hasChapters && onPlayEpisode && onPlayEpisode(series, ep)}
                      >
                        {/* Line 1: Episode Number and Title - Full width */}
                        <h4 className={`font-semibold truncate mb-1 ${isCurrentEpisode ? 'text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                          <span className="text-xs text-gray-600 dark:text-gray-300 mr-1.5">Ep.{ep.episodeNumber}</span>
                          {ep.title}
                        </h4>
                        
                        {/* Line 2: Chapter count and duration (only if chapters exist) */}
                        {hasChapters && (
                          <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            {ep.chapters!.length} Chapters <span className="ml-2 text-gray-700 dark:text-gray-300">{formatDuration(totalDuration)}</span>
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
                            {isCurrentEpisode && (
                              <span className="text-blue-800 dark:text-blue-300 font-bold">再生中</span>
                            )}
                          </div>
                          
                          {/* Expand/Collapse Button - Right side of Line 3 */}
                          {hasChapters && (
                            <button
                              onClick={(e) => toggleEpisode(ep.id, e)}
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

                    {/* Chapters List */}
                    {hasChapters && isExpanded && (
                      <div className="ml-8">
                        {ep.chapters!.map((ch) => {
                          // Check if this chapter is currently playing
                          const isChapterPlaying = chapter?.id === ch.id;
                          
                          return (
                            <div
                              key={ch.id}
                              onClick={() => {
                                // Play chapter functionality
                                if (onPlayEpisode) {
                                  onPlayEpisode(series, ep, ch);
                                }
                              }}
                              className={`flex items-center gap-3 py-3 pr-4 border-b transition-colors cursor-pointer ${
                                isChapterPlaying
                                  ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                              }`}
                            >
                              {/* Chapter Info */}
                              <div className="flex-1 min-w-0">
                                <h5 className={`text-sm font-medium truncate ${
                                  isChapterPlaying ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1.5">Un.{ch.chapterNumber}</span>
                                  {ch.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                                  <span>{formatDuration(ch.duration)}</span>
                                  {ch.playCount > 0 && (
                                    <span className="text-purple-700 dark:text-purple-400">{ch.playCount.toLocaleString()}回再生</span>
                                  )}
                                  {isChapterPlaying && (
                                    <span className="text-blue-700 dark:text-blue-400">再生中</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Chapter Play Button - Only show when playing */}
                              {isChapterPlaying && (
                                <div className="flex-shrink-0">
                                  <Play className="w-8 h-8 text-blue-600 dark:text-blue-500 fill-blue-600 dark:fill-blue-500" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
                })}
            </div>
          </div>
          ) : (
            /* Content Area */
            <div className="flex-1 py-4 bg-white dark:bg-gray-800 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
              {/* Content Header with Close Button */}
              <div className="flex items-center justify-between mb-4 px-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">コンテンツ</h3>
                <button
                  onClick={() => setShowContentArea(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Content Text */}
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {chapter?.description || episode.description || 'コンテンツの説明がありません。'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fixed Next Episode Card - Only show in full player view and NOT in playlist mode */}
      {!showEpisodeList && showNextEpisode && nextEpisode && !playlistMode && (
        <div className="fixed bottom-0 left-0 right-0 p-3 min-[371px]:p-[13px] z-30">
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={onNextEpisode}
                className="w-full flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-2 min-[371px]:py-2.5 transition-colors"
              >
                <div className="w-9 h-9 min-[371px]:w-10 min-[371px]:h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{nextEpisode.episodeNumber}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[9px] text-gray-600 dark:text-gray-400 mb-0.5 uppercase tracking-wider font-medium">次のエピソード</p>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    <span className="text-xs text-gray-600 dark:text-gray-300 mr-1.5">Ep.{nextEpisode.episodeNumber}</span>
                    {nextEpisode.title}
                  </h4>
                  <p className="hidden min-[321px]:block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{formatDuration(nextEpisode.duration)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Modal */}
      {showTextModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowTextModal(false)}
        >
          <div 
            className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
            onTouchMove={(e) => setTouchEnd(e.touches[0].clientY)}
            onTouchEnd={() => {
              if (touchStart - touchEnd < -50) {
                // Swiped down more than 50px
                setShowTextModal(false);
              }
            }}
          >
            {/* Drag Indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {textContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Modal */}
      {showChapterList && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center max-w-[460px] mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">チャプター</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newChapter: MyChapter = {
                      id: `my-chapter-${Date.now()}`,
                      time: currentTime,
                    };
                    setMyChapters([...myChapters, newChapter]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-700"
                >
                  <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setShowChapterList(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto">
              {/* My Chapters Section */}
              {myChapters.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">マイチャプター</p>
                  </div>
                  {myChapters.map((myChapter, index) => (
                    <div
                      key={myChapter.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                      <button
                        onClick={() => {
                          if (editingChapterId !== myChapter.id) {
                            setCurrentTime(myChapter.time);
                            setShowChapterList(false);
                          }
                        }}
                        className="flex-shrink-0 w-12 text-sm text-gray-500 dark:text-gray-400"
                      >
                        {formatDuration(myChapter.time)}
                      </button>
                      {editingChapterId === myChapter.id ? (
                        <input
                          type="text"
                          value={editingChapterName}
                          onChange={(e) => setEditingChapterName(e.target.value)}
                          onBlur={() => {
                            const updatedChapters = myChapters.map(ch =>
                              ch.id === myChapter.id
                                ? { ...ch, name: editingChapterName || undefined }
                                : ch
                            );
                            setMyChapters(updatedChapters);
                            setEditingChapterId(null);
                            setEditingChapterName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const updatedChapters = myChapters.map(ch =>
                                ch.id === myChapter.id
                                  ? { ...ch, name: editingChapterName || undefined }
                                  : ch
                              );
                              setMyChapters(updatedChapters);
                              setEditingChapterId(null);
                              setEditingChapterName('');
                            }
                          }}
                          autoFocus
                          className="flex-1 text-left text-sm text-gray-900 dark:text-white bg-transparent border-b border-blue-500 outline-none px-1"
                          placeholder={`マイチャプター${index + 1}`}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentTime(myChapter.time);
                            setShowChapterList(false);
                          }}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm text-gray-900 dark:text-white">
                            {myChapter.name || `マイチャプター${index + 1}`}
                          </p>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChapterId(myChapter.id);
                          setEditingChapterName(myChapter.name || '');
                        }}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Chapters Section */}
              {episode.chapters && episode.chapters.length > 0 ? (
                <>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">チャプター</p>
                  </div>
                  {episode.chapters.map((chap, index) => (
                    <button
                      key={chap.id}
                      onClick={() => {
                        if (onPlayEpisode) {
                          onPlayEpisode(series, episode, chap);
                        }
                        setShowChapterList(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                      <div className="flex-shrink-0 w-12 text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(chap.startTime || 0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {chap.title || `チャプター${index + 1}`}
                        </p>
                      </div>
                      {chapter?.id === chap.id && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">チャプターがありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}