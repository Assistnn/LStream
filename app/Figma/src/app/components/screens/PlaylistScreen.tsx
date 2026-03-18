import { useState } from 'react';
import { List, Plus, Play, Pin, Trash2, Clock, Edit, Download } from 'lucide-react';
import { Playlist, formatDuration } from '@/data/mockData';

interface PlaylistScreenProps {
  playlists: Playlist[];
  queueCount: number;
  onQueueTap: () => void;
  onPlaylistTap: (playlist: Playlist) => void;
  onCreatePlaylist: () => void;
  onDeletePlaylist: (playlistId: string) => void;
  onTogglePin?: (playlistId: string) => void;
  onEditPlaylist?: (playlistId: string) => void;
  pinnedPlaylists?: Set<string>;
}

export function PlaylistScreen({
  playlists,
  queueCount,
  onQueueTap,
  onPlaylistTap,
  onCreatePlaylist,
  onDeletePlaylist,
  onTogglePin,
  onEditPlaylist,
  pinnedPlaylists = new Set(),
}: PlaylistScreenProps) {
  const [swipedPlaylist, setSwipedPlaylist] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent, playlistId: string) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setSwipedPlaylist(playlistId);
    setTouchOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent, playlistId: string) => {
    if (!touchStart || swipedPlaylist !== playlistId) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // Only allow horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
      
      // Limit swipe distance - increased for two buttons on left
      const maxSwipe = 160;
      const limitedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
      setTouchOffset(limitedOffset);

      if (limitedOffset > 30) {
        setSwipeDirection('right');
      } else if (limitedOffset < -30) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = (playlistId: string) => {
    if (swipedPlaylist !== playlistId) return;

    if (swipeDirection && Math.abs(touchOffset) > 30) {
      // Keep the swiped state - increase left swipe offset for two buttons
      setTouchOffset(swipeDirection === 'right' ? 80 : -160);
    } else {
      // Reset if swipe was not significant
      setSwipedPlaylist(null);
      setSwipeDirection(null);
      setTouchOffset(0);
    }
    
    setTouchStart(null);
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    if (swipedPlaylist === playlist.id && swipeDirection) {
      // If swiped, close the swipe
      setSwipedPlaylist(null);
      setSwipeDirection(null);
      setTouchOffset(0);
    } else if (!touchStart) {
      // Otherwise navigate to playlist detail (only if not currently touching)
      onPlaylistTap(playlist);
    }
  };

  const handlePinToggle = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    onTogglePin?.(playlistId);
    setSwipedPlaylist(null);
    setSwipeDirection(null);
    setTouchOffset(0);
  };

  const handleDelete = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    onDeletePlaylist(playlistId);
    setSwipedPlaylist(null);
    setSwipeDirection(null);
    setTouchOffset(0);
  };

  const handleEdit = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    onEditPlaylist?.(playlistId);
    setSwipedPlaylist(null);
    setSwipeDirection(null);
    setTouchOffset(0);
  };

  const formatAlarmTime = (playlist: Playlist): string => {
    if (!playlist.alarm?.enabled) return '';
    
    const days = playlist.alarm.days;
    const dayLabels: Record<string, string> = {
      sun: '日',
      mon: '月',
      tue: '火',
      wed: '水',
      thu: '木',
      fri: '金',
      sat: '土',
    };
    
    const dayText = days.map(d => dayLabels[d]).join('・');
    return `${dayText} ${playlist.alarm.time}`;
  };

  const getTotalDuration = (playlist: Playlist): number => {
    return playlist.items.reduce((total, item) => {
      const episode = item.episode;
      if (item.chapter) {
        return total + item.chapter.duration;
      }
      return total + episode.duration;
    }, 0);
  };

  const isPlaylistDownloaded = (playlist: Playlist): boolean => {
    // Check if all items in the playlist are downloaded
    return playlist.items.length > 0 && playlist.items.every(item => {
      if (item.chapter) {
        return item.chapter.isDownloaded;
      }
      return item.episode.isDownloaded;
    });
  };

  return (
    <div className="pb-40 pt-6 dark:bg-gray-900">
      {/* Header */}
      <div className="px-[5%] mb-6">
        <div className="flex items-center gap-3 mb-4">
          <List className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">プレイリスト</h1>
        </div>
      </div>

      {/* Queue Section */}
      <div className="mb-6 border-t border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onQueueTap}
          className="w-full flex items-center gap-4 px-[5%] py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              再生キュー
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {queueCount}メディア
            </p>
          </div>
        </button>
      </div>

      {/* Playlists Section */}
      <div>
        <div className="px-[5%] mb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">マイプレイリスト</h2>
            <button
              onClick={onCreatePlaylist}
              className="w-[30px] h-[30px] bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-white rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-[18px] h-[18px] text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>

        {playlists.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
            {playlists.map((playlist) => {
              const isPinned = pinnedPlaylists.has(playlist.id);
              const isThisSwiped = swipedPlaylist === playlist.id;
              const currentOffset = isThisSwiped ? touchOffset : 0;

              return (
                <div key={playlist.id} className="relative overflow-hidden">
                  {/* Swipe Actions Background */}
                  {isThisSwiped && swipeDirection === 'left' && (
                    <div className="absolute inset-0 flex items-center justify-end">
                      <button
                        onClick={(e) => handleEdit(e, playlist.id)}
                        className="h-full px-5 flex items-center justify-center text-white bg-blue-500"
                      >
                        <Edit className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, playlist.id)}
                        className="h-full px-5 flex items-center justify-center text-white bg-red-500"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                  {isThisSwiped && swipeDirection === 'right' && (
                    <div className="absolute inset-0 flex items-center justify-start bg-blue-500">
                      <button
                        onClick={(e) => handlePinToggle(e, playlist.id)}
                        className="h-full px-6 flex items-center justify-center text-white"
                      >
                        <Pin className={`w-6 h-6 ${isPinned ? 'fill-white' : ''}`} />
                      </button>
                    </div>
                  )}

                  {/* Playlist Item */}
                  <div
                    className="flex items-center gap-4 px-[5%] py-3 bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative"
                    onClick={() => handlePlaylistClick(playlist)}
                    onTouchStart={(e) => handleTouchStart(e, playlist.id)}
                    onTouchMove={(e) => handleTouchMove(e, playlist.id)}
                    onTouchEnd={() => handleTouchEnd(playlist.id)}
                    style={{
                      transform: `translateX(${currentOffset}px)`,
                      transition: touchStart ? 'none' : 'transform 0.3s ease-out',
                    }}
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg relative overflow-hidden">
                      {playlist.coverImage ? (
                        <img
                          src={playlist.coverImage}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${playlist.gradient || 'from-blue-500 to-blue-600'}`} />
                      )}
                      {isPinned && (
                        <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
                          <Pin className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
                          {playlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-[5px]">
                        <span>{playlist.items.length}メディア</span>
                        <span>{formatDuration(getTotalDuration(playlist))}</span>
                        {playlist.alarm?.enabled && (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{formatAlarmTime(playlist)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="w-10 h-10 text-gray-700 dark:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              プレイリストがありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              新規作成からプレイリストを作成してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}