import { ChevronLeft, Play, Clock, Download as DownloadIcon, MoreVertical, Trash2, Lock, CheckSquare, Square } from 'lucide-react';
import { mockPlayHistory, HistoryItem, formatDuration, getCategoryLabel } from '@/data/mockData';
import { DownloadItem } from './DownloadScreen';
import { useState, useMemo, useRef, useEffect } from 'react';

interface HistoryScreenProps {
  onBack: () => void;
  onPlayHistory: (history: HistoryItem) => void;
  downloads: DownloadItem[];
  onDeleteDownloads: (ids: string[]) => void;
  onToggleLock: (id: string) => void;
}

export function HistoryScreen({ 
  onBack, 
  onPlayHistory,
  downloads,
  onDeleteDownloads,
  onToggleLock,
}: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'download'>('history');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  const handleDeleteAll = () => {
    const unlockedIds = downloads.filter(d => !d.isLocked).map(d => d.id);
    if (unlockedIds.length === 0) {
      showToast('削除可能なメディアがありません');
      setShowDeleteMenu(false);
      return;
    }
    onDeleteDownloads(unlockedIds);
    showToast(`${unlockedIds.length}件を削除しました`);
    setShowDeleteMenu(false);
  };

  const handleSelectDelete = () => {
    setShowDeleteMenu(false);
    setDeleteMode(true);
  };

  const handleConfirmSelectDelete = () => {
    if (selectedIds.size === 0) {
      showToast('削除可能なメディアがありません');
      return;
    }
    onDeleteDownloads(Array.from(selectedIds));
    showToast(`${selectedIds.size}件を削除しました`);
    setDeleteMode(false);
    setSelectedIds(new Set());
  };

  const handleCancelSelectMode = () => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  };

  const handleCompleteDelete = () => {
    if (downloads.length === 0) {
      showToast('削除可能なメディアがありません');
      setShowDeleteMenu(false);
      return;
    }
    onDeleteDownloads(downloads.map(d => d.id));
    showToast(`${downloads.length}件を削除しました`);
    setShowDeleteMenu(false);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = downloads.map(d => d.id);
    setSelectedIds(new Set(allIds));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    mockPlayHistory.forEach((item) => {
      const date = new Date(item.playedAt);
      const today = new Date('2026-02-02');
      const yesterday = new Date('2026-02-01');
      
      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = '今日';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = '昨日';
      } else {
        dateKey = `${date.getMonth() + 1}月${date.getDate()}日`;
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    return groups;
  }, []);

  return (
    <div className="pb-40 pt-6 dark:bg-gray-900 overflow-y-auto library-scrollbar" style={{ scrollbarGutter: 'stable' }}>
      {/* Header */}
      <div className="px-[5%] mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">履歴</h1>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-[5%] mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            再生履歴
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              activeTab === 'download'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            ダウンロード
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'history' ? (
        <div>
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="mb-4">
              {/* Date Header */}
              <div className="px-[5%] py-2">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {date}
                </h2>
              </div>

              {/* History Items */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {items.map((item, index) => {
                  const progressPercent = (item.progress / item.duration) * 100;
                  const timeStr = new Date(item.playedAt).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  
                  // Check if this item is downloaded
                  const isDownloaded = item.chapter ? item.chapter.isDownloaded : item.episode?.isDownloaded;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-[5%] py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        index !== items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                      }`}
                      onClick={() => onPlayHistory(item)}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img
                          src={item.thumbnail}
                          alt={item.series.title}
                          className="w-full h-full rounded-[5px] object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[5px]">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {item.episode?.title || item.series.title}
                          {item.chapter && ` - CH${item.chapter.chapterNumber}`}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {item.series.title} • {timeStr}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {/* Progress Bar */}
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-1 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      </div>

                      {/* Download Icon - Right side like in Library */}
                      {isDownloaded && (
                        <div className="flex-shrink-0">
                          <DownloadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Download Tab Header with Menu or Select Mode Actions */}
          {deleteMode ? (
            <div className="px-[5%] mb-4 flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                すべて選択
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmSelectDelete}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors"
                >
                  削除
                </button>
                <button
                  onClick={handleCancelSelectMode}
                  className="px-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="px-[5%] mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {downloads.length}件 • {downloads.reduce((sum, item) => sum + item.sizeMB, 0).toFixed(1)}MB
              </p>
              {downloads.length > 0 && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDeleteMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <button
                        onClick={handleDeleteAll}
                        className="w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        すべてを削除
                      </button>
                      <button
                        onClick={handleSelectDelete}
                        className="w-full px-4 py-2 text-sm text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        選択して削除
                      </button>
                      <button
                        onClick={handleCompleteDelete}
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-5 dark:hover:bg-red-900/30 transition-colors"
                      >
                        完全に削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download Items */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {downloads.map((download, index) => {
              const duration = download.chapter ? download.chapter.duration : download.episode.duration;
              const isSelected = selectedIds.has(download.id);
              
              return (
                <div
                  key={download.id}
                  className={`flex items-center gap-3 px-[5%] py-3 transition-colors ${
                    deleteMode && isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${
                    index !== downloads.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  {/* Selection Checkbox - Left of image */}
                  {deleteMode && (
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => handleToggleSelect(download.id)}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <img
                      src={download.series.thumbnail}
                      alt={download.series.title}
                      className="w-full h-full rounded-[5px] object-cover"
                    />
                    
                    {/* Lock Icon Overlay */}
                    {download.isLocked && (
                      <div className="absolute top-1 left-1">
                        <div className="w-5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {download.episode.title}
                      {download.chapter && ` - CH${download.chapter.chapterNumber}`}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {download.series.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {download.sizeMB}MB • {formatDuration(duration)}
                      </span>
                    </div>
                  </div>

                  {/* Download Icon - Right side like in Library */}
                  {!deleteMode && (
                    <div className="flex-shrink-0">
                      <DownloadIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessToast && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowSuccessToast(false)}
        >
          <div 
            className="bg-gray-900 dark:bg-gray-800 text-white px-8 py-4 rounded-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}