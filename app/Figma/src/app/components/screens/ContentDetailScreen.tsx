import { useState } from 'react';
import { ChevronLeft, Play, Plus, Heart } from 'lucide-react';
import { Content, formatDuration, getCategoryLabel } from '@/data/mockData';

interface ContentDetailScreenProps {
  content: Content;
  onBack: () => void;
  onPlay: (content: Content) => void;
  onToggleFavorite: (content: Content) => void;
}

export function ContentDetailScreen({
  content,
  onBack,
  onPlay,
  onToggleFavorite,
}: ContentDetailScreenProps) {
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [selectedLoop, setSelectedLoop] = useState(1);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);

  const speedOptions = [0.75, 1.0, 1.25, 1.5];
  const loopOptions = [
    { value: 1, label: '1回' },
    { value: 3, label: '3回' },
    { value: 999, label: '無限ループ' },
  ];
  const timerOptions = [
    { value: null, label: 'なし' },
    { value: 5, label: '5分' },
    { value: 10, label: '10分' },
    { value: 30, label: '30分' },
    { value: -1, label: '終了時停止' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 bottom-20 bg-white dark:bg-gray-900 z-40 overflow-y-auto">
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

      {/* Content thumbnail */}
      <div className="px-[5%] pt-6 pb-4">
        {content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full aspect-video rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-7xl">🎵</span>
          </div>
        )}
      </div>

      {/* Content info */}
      <div className="px-[5%] mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full mb-3">
              {getCategoryLabel(content.category)}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {content.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{content.type === 'audio' ? '音声' : '動画'}</span>
              <span>•</span>
              <span>{formatDuration(content.duration)}</span>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(content)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Heart
              className={`w-6 h-6 text-gray-700 dark:text-gray-300 ${
                content.isFavorite
                  ? 'fill-gray-700 dark:fill-gray-300'
                  : ''
              }`}
            />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          このコンテンツを毎日繰り返し学習することで、効果的にスキルを身につけることができます。
          自分のペースで学習を進めましょう。
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-[5%] mb-8 space-y-3">
        <button
          onClick={() => onPlay(content)}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-4 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Play className="w-5 h-5 fill-white" />
          再生
        </button>
        <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          今日のリストに追加
        </button>
      </div>

      {/* Settings panel */}
      <div className="px-[5%] space-y-6">
        {/* Speed */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">再生速度</h3>
          <div className="grid grid-cols-4 gap-2">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => setSelectedSpeed(speed)}
                className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                  selectedSpeed === speed
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Loop count */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">ループ回数</h3>
          <div className="grid grid-cols-3 gap-2">
            {loopOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLoop(option.value)}
                className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                  selectedLoop === option.value
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">タイマー</h3>
          <div className="grid grid-cols-3 gap-2">
            {timerOptions.map((option) => (
              <button
                key={option.value ?? 'none'}
                onClick={() => setSelectedTimer(option.value)}
                className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                  selectedTimer === option.value
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-[5%] mt-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">再生回数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{content.playCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">総学習時間</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.floor((content.playCount * content.duration) / 3600)}h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}