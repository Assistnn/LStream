import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, MoreVertical, Lock, Unlock, Trash2, CheckSquare, Square } from 'lucide-react';
import { Series, Episode } from '@/data/mockData';

export interface DownloadItem {
  id: string;
  series: Series;
  episode: Episode;
  chapter?: {
    id: string;
    title: string;
  };
  sizeMB: number;
  playCount: number;
  isLocked: boolean;
}

interface DownloadScreenProps {
  downloads: DownloadItem[];
  onBack: () => void;
  onDelete: (ids: string[]) => void;
  onToggleLock: (id: string) => void;
  onPlay: (item: DownloadItem) => void;
}

type DeleteMode = 'deleteAll' | 'select' | 'deleteComplete' | null;

export function DownloadScreen({ 
  downloads,
  onBack,
  onDelete,
  onToggleLock,
  onPlay,
}: DownloadScreenProps) {
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (deleteMode === 'select') return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (deleteMode === 'select') return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = (id: string) => {
    if (deleteMode === 'select') return;
    const diff = touchCurrentX.current - touchStartX.current;
    
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        // Right swipe - Lock/Unlock
        setSwipedId(id);
        setSwipeDirection('right');
      } else {
        // Left swipe - Delete
        setSwipedId(id);
        setSwipeDirection('left');
      }
    }
    
    setDragOffset(0);
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  const handleSwipeAction = (id: string, action: 'lock' | 'delete') => {
    if (action === 'lock') {
      onToggleLock(id);
    } else if (action === 'delete') {
      onDelete([id]);
      showToast('1件を削除しました');
    }
    setSwipedId(null);
    setSwipeDirection(null);
  };

  const handleDeleteAll = () => {
    const unlockedIds = downloads.filter(d => !d.isLocked).map(d => d.id);
    if (unlockedIds.length === 0) {
      showToast('削除可能なメディアがありません');
      return;
    }
    onDelete(unlockedIds);
    showToast(`${unlockedIds.length}件を削除しました`);
    setShowDeleteMenu(false);
  };

  const handleSelectDelete = () => {
    if (selectedIds.size === 0) {
      showToast('削除可能なメディアがありません');
      return;
    }
    onDelete(Array.from(selectedIds));
    showToast(`${selectedIds.size}件を削除しました`);
    setDeleteMode(null);
    setSelectedIds(new Set());
    setShowDeleteMenu(false);
  };

  const handleCompleteDelete = () => {
    setConfirmMessage('ロックされているものも含め、すべてが削除されますがよろしいですか？');
    setConfirmAction(() => () => {
      onDelete(downloads.map(d => d.id));
      setShowDeleteMenu(false);
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
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

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (swipedId) {
        setSwipedId(null);
        setSwipeDirection(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [swipedId]);

  const totalSize = downloads.reduce((sum, item) => sum + item.sizeMB, 0);

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => {
              if (deleteMode === 'select') {
                setDeleteMode(null);
                setSelectedIds(new Set());
              } else {
                onBack();
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {deleteMode === 'select' ? '選択を削除' : 'ダウンロード'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {downloads.length}件 · {totalSize.toFixed(1)}MB
            </p>
          </div>
        </div>
        
        {deleteMode === 'select' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              すべて選択
            </button>
            <button
              onClick={handleSelectDelete}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
              削除 ({selectedIds.size})
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteMenu(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <MoreVertical className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Download className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ダウンロードがありません
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ダウンロードしたコンテンツがここに表示されます
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700">
            {downloads.map((item, index) => {
              const isSwiped = swipedId === item.id;
              const isSelected = selectedIds.has(item.id);
              
              return (
                <div
                  key={item.id}
                  className="relative border-b border-gray-100 dark:border-gray-700 last:border-b-0 overflow-hidden"
                >
                  {/* Swipe Actions Background */}
                  {isSwiped && (
                    <>
                      {swipeDirection === 'left' && (
                        <div className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end px-6">
                          <button
                            onClick={() => handleSwipeAction(item.id, 'delete')}
                            className="text-white"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                      {swipeDirection === 'right' && (
                        <div className="absolute inset-y-0 left-0 bg-blue-500 flex items-center justify-start px-6">
                          <button
                            onClick={() => handleSwipeAction(item.id, 'lock')}
                            className="text-white"
                          >
                            {item.isLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Main Content */}
                  <div
                    className={`bg-white dark:bg-gray-800 transition-transform ${
                      isSwiped && swipeDirection === 'left' ? '-translate-x-20' :
                      isSwiped && swipeDirection === 'right' ? 'translate-x-20' : ''
                    } ${deleteMode === 'select' && isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    onTouchStart={(e) => handleTouchStart(e, item.id)}
                    onTouchMove={(e) => handleTouchMove(e, item.id)}
                    onTouchEnd={() => handleTouchEnd(item.id)}
                    style={{
                      transform: dragOffset !== 0 && swipedId === item.id ? `translateX(${dragOffset}px)` : undefined,
                    }}
                  >
                    <button
                      onClick={() => {
                        if (deleteMode === 'select') {
                          handleToggleSelect(item.id);
                        } else {
                          onPlay(item);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        deleteMode === 'select' && isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      {deleteMode === 'select' && (
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                      )}

                      {/* Lock Icon */}
                      {item.isLocked && deleteMode !== 'select' && (
                        <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      )}

                      {/* Thumbnail */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {item.series.coverImage ? (
                          <img
                            src={item.series.coverImage}
                            alt={item.series.title}
                            className="w-full h-full object-cover"
                          />
                        ) : item.series.thumbnail ? (
                          <img
                            src={item.series.thumbnail}
                            alt={item.series.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {item.chapter ? item.chapter.title : item.episode.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.series.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.sizeMB.toFixed(1)}MB
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            再生 {item.playCount}回
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Menu */}
      {showDeleteMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowDeleteMenu(false)}
        >
          <div
            className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowDeleteMenu(false);
                handleDeleteAll();
              }}
              className="w-full py-3 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4 transition-colors"
            >
              すべてを削除
            </button>
            <button
              onClick={() => {
                setShowDeleteMenu(false);
                setDeleteMode('select');
              }}
              className="w-full py-3 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4 transition-colors"
            >
              選択を削除
            </button>
            <button
              onClick={() => {
                setShowDeleteMenu(false);
                handleCompleteDelete();
              }}
              className="w-full py-3 text-left font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg px-4 transition-colors"
            >
              完全に削除
            </button>
            <button
              onClick={() => setShowDeleteMenu(false)}
              className="w-full py-3 text-center font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              確認
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {confirmMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {successMessage}
        </div>
      )}
    </div>
  );
}