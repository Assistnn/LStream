import { Play, Pause, X, Heart, List } from 'lucide-react';
import { Content } from '@/data/mockData';

interface MiniPlayerProps {
  content: (Content & { subtitle?: string; episodeNumber?: number; chapterNumber?: number; isFavorite?: boolean }) | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTap: () => void;
  onClose?: () => void;
  onToggleFavorite?: () => void;
  onShowChapterList?: () => void;
}

export function MiniPlayer({
  content,
  isPlaying,
  onTogglePlay,
  onTap,
  onClose,
  onToggleFavorite,
  onShowChapterList,
}: MiniPlayerProps) {
  if (!content) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-gray-100 dark:bg-gray-750 border-t border-gray-300 dark:border-gray-600 shadow-lg z-40" style={{ backgroundColor: 'var(--mini-player-bg, rgb(243 244 246))' }}>
      <style>{`
        .dark [style*="--mini-player-bg"] {
          --mini-player-bg: rgb(55 65 81) !important;
          background-color: rgb(55 65 81) !important;
        }
      `}</style>
      <div
        className="flex items-center gap-0 cursor-pointer"
        onClick={onTap}
      >
        {/* 16:9 Thumbnail - No left padding */}
        {content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-[90px] h-[56px] object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-[90px] h-[56px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">🎵</span>
          </div>
        )}
        
        {/* Text Content with Favorite */}
        <div className="flex-1 min-w-0 px-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {content.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {content.subtitle || (content.type === 'audio' ? '音声' : '動画')}
            </p>
          </div>
          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <Heart 
                className={`w-4 h-4 ${
                  content.isFavorite 
                    ? 'fill-blue-500 text-blue-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </button>
          )}
        </div>

        {/* Chapter List Button */}
        {onShowChapterList && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowChapterList();
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <List className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
          ) : (
            <Play className="w-6 h-6 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
          )}
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 mr-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        )}
      </div>
    </div>
  );
}