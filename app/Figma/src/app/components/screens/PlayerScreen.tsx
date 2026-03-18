import { useState, useEffect } from 'react';
import { ChevronDown, MoreVertical, SkipBack, SkipForward, Play, Pause, Repeat, Clock, Gauge, Heart, Volume2, Share2 } from 'lucide-react';
import { Content, formatDuration, Series, Episode, Chapter } from '@/data/mockData';
import { Slider } from '@/app/components/ui/slider';
import { useSwipeable } from 'react-swipeable';

interface PlayerScreenProps {
  content: Content;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onToggleFavorite?: (content: Content) => void;
  series?: Series;
  episode?: Episode;
  chapter?: Chapter;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export function PlayerScreen({
  content,
  isPlaying,
  onTogglePlay,
  onClose,
  onToggleFavorite,
  series,
  episode,
  chapter,
  onNextChapter,
  onPrevChapter,
  onNextEpisode,
  onPrevEpisode,
}: PlayerScreenProps) {
  const [currentTime, setCurrentTime] = useState(45);
  const [speed, setSpeed] = useState(1.0);
  const [loopCount, setLoopCount] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showLoopMenu, setShowLoopMenu] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [volume, setVolume] = useState(50);

  // Check if content is locked
  const isLocked = (chapter?.isLocked ?? episode?.isLocked ?? content.isLocked) || false;
  const contentDescription = chapter?.description ?? episode?.description ?? content.description;

  const progress = (currentTime / content.duration) * 100;
  const remainingTime = content.duration - currentTime;

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
  const loopOptions = [
    { value: 0, label: 'なし' },
    { value: 1, label: '1回' },
    { value: 3, label: '3回' },
    { value: 5, label: '5回' },
    { value: 999, label: '無制限' },
  ];

  // フリックハンドラー
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      console.log('次のトラックへ');
      // 次のトラックへの処理（将来的に実装）
    },
    onSwipedRight: () => {
      console.log('前のトラックへ');
      // 前のトラックへの処理（将来的に実装）
    },
    trackMouse: false, // マウスでのスワイプは無効化
  });

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside any menu
      if (!target.closest('.relative')) {
        setShowSpeedMenu(false);
        setShowLoopMenu(false);
        setShowVolumeMenu(false);
      }
    };

    if (showSpeedMenu || showLoopMenu || showVolumeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [showSpeedMenu, showLoopMenu, showVolumeMenu]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col" {...handlers}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <div className="flex items-center gap-2 mx-4 flex-1 justify-center">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {series ? series.title : content.title}
          </h2>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(content)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Heart
                className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${
                  content.isFavorite
                    ? 'fill-gray-700 dark:fill-gray-300'
                    : ''
                }`}
              />
            </button>
          )}
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <MoreVertical className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Artwork - Always show as square thumbnail like EpisodePlayer */}
        <div className="flex flex-col items-center mb-1 mt-0 min-[371px]:mb-4 px-8">
          {content.thumbnail ? (
            <img
              src={content.thumbnail}
              alt={content.title}
              className="w-[85%] min-[371px]:w-[90%] md:w-full aspect-square rounded-md shadow-2xl object-cover"
            />
          ) : (
            <div className="w-[85%] min-[371px]:w-[90%] md:w-full aspect-square rounded-md shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-8xl">{content.type === 'video' ? '🎬' : '🎵'}</span>
            </div>
          )}
          {/* Waveform placeholder for audio */}
          {content.type === 'audio' && (
            <div className="mt-6 flex items-end gap-1 h-12 w-full max-w-xs">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    (i / 40) * 100 < progress
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Title - Display when no series/episode info */}
        {!episode && !series && (
          <div className="text-center mb-4 px-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {content.title}
            </h3>
          </div>
        )}

        {/* Episode Info */}
        {episode && series && (
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {chapter ? chapter.title : episode.title}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              <span className="text-xs">Ep.{episode.episodeNumber}</span>
              {chapter && <span className="ml-2">UN.{chapter.chapterNumber}</span>}
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[progress]}
            onValueChange={(value) => {
              const newTime = (value[0] / 100) * content.duration;
              setCurrentTime(newTime);
            }}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-8">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>-{formatDuration(Math.floor(remainingTime))}</span>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button 
            onClick={() => {
              if (onPrevChapter) {
                onPrevChapter();
              }
            }}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <SkipBack className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            )}
          </button>

          <button 
            onClick={() => {
              if (onNextChapter) {
                onNextChapter();
              }
            }}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <SkipForward className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="relative w-16">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowLoopMenu(false);
                setShowVolumeMenu(false);
              }}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"
            >
              <Gauge className={`w-5 h-5 ${speed !== 1.0 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`} />
              {speed !== 1.0 && (
                <span className="absolute bottom-1 right-1 text-[9px] text-blue-500 font-semibold bg-white dark:bg-gray-900 px-0.5 rounded">
                  {speed}x
                </span>
              )}
            </button>
            
            {showSpeedMenu && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px]">
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

          <div className="relative w-16">
            <button
              onClick={() => {
                setShowLoopMenu(!showLoopMenu);
                setShowSpeedMenu(false);
                setShowVolumeMenu(false);
              }}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"
            >
              <Repeat className={`w-5 h-5 ${loopCount > 0 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`} />
              {loopCount > 0 && (
                <span className="absolute bottom-1 right-1 text-[9px] text-blue-500 font-semibold bg-white dark:bg-gray-900 px-0.5 rounded">
                  {loopCount === 999 ? '∞' : `${loopCount}回`}
                </span>
              )}
            </button>
            
            {showLoopMenu && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[100px]">
                {loopOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setLoopCount(option.value);
                      setShowLoopMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-sm rounded-lg text-left ${
                      loopCount === option.value
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

          <div className="relative w-16">
            <button
              onClick={() => {
                setShowVolumeMenu(!showVolumeMenu);
                setShowSpeedMenu(false);
                setShowLoopMenu(false);
              }}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"
            >
              <Volume2 className={`w-5 h-5 ${volume !== 100 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`} />
              {volume !== 100 && (
                <span className="absolute bottom-1 right-1 text-[9px] text-blue-500 font-semibold bg-white dark:bg-gray-900 px-0.5 rounded">
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

          {onToggleFavorite && (
            <div className="relative w-16">
              <button
                onClick={() => onToggleFavorite(content)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"
              >
                <Heart
                  className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${
                    content.isFavorite
                      ? 'fill-gray-700 dark:fill-gray-300'
                      : ''
                  }`}
                />
              </button>
            </div>
          )}

          <div className="relative w-16">
            <button className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full">
              <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Description Section - Only show if description exists */}
      {contentDescription && (
        <div className="px-[5%] pb-8 border-t border-gray-100 dark:border-gray-800 pt-4 overflow-y-auto">
          {/* Share button - Only show when unlocked */}
          {!isLocked && (
            <div className="flex justify-end mb-3">
              <button 
                onClick={() => {
                  console.log('Share content');
                  // Share functionality
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">シェア</span>
              </button>
            </div>
          )}
          
          {/* Text content - Selectable when unlocked, non-selectable when locked */}
          <div 
            className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed ${
              isLocked ? 'select-none' : ''
            }`}
          >
            {contentDescription}
          </div>
        </div>
      )}

      {/* Next up */}
      {onNextEpisode && series && episode && (
        <div className="px-[5%] pb-8 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">次のエピソード</p>
          <button
            onClick={onNextEpisode}
            className="w-full flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
          >
            {series.thumbnail && (
              <img
                src={series.thumbnail}
                alt={series.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                エピソード {episode.episodeNumber + 1}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{series.title}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}