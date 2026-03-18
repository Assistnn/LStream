import { ContentCard } from '@/app/components/ContentCard';
import { SeriesCard } from '@/app/components/SeriesCard';
import { Content, Series, Episode, Chapter, mockLibraryItems, mockPlayHistory, mockNewArrivals, NewArrivalItem, isSeries, formatDuration, getCategoryLabel } from '@/data/mockData';
import { ServiceAccount } from '@/app/components/screens/AccountScreen';
import { Play, ChevronRight, Video, Headphones } from 'lucide-react';

interface TodayScreenProps {
  onPlayContent: (content: Content) => void;
  onPlayEpisode: (series: Series, episode: Episode, chapter?: Chapter) => void;
  onToggleFavorite: (item: Content | Series) => void;
  onSeriesTap: (series: Series) => void;
  activeServiceAccount: ServiceAccount | null;
  onAccountTap: () => void;
  onViewAllHistory: () => void;
  onViewAllNewArrivals: () => void;
}

export function TodayScreen({ 
  onPlayContent, 
  onPlayEpisode,
  onToggleFavorite, 
  onSeriesTap,
  activeServiceAccount,
  onAccountTap,
  onViewAllHistory,
  onViewAllNewArrivals,
}: TodayScreenProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = 'ホーム';
  
  const dateStr = now.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 今日のおすすめ (最初の3つのシリーズ)
  const todayRecommendations = mockLibraryItems
    .filter(isSeries)
    .slice(0, 3);

  // 前回の続き (シリーズで進行中のもの + 最近再生したコンテンツ)
  const continueSeries = mockLibraryItems
    .filter(isSeries)
    .filter((s: Series) => s.completedEpisodes > 0 && s.completedEpisodes < s.totalEpisodes)
    .slice(0, 3);

  const recentContents = mockLibraryItems
    .filter((item) => !isSeries(item) && (item as Content).lastPlayed)
    .sort((a, b) => {
      const aDate = (a as Content).lastPlayed;
      const bDate = (b as Content).lastPlayed;
      if (!aDate || !bDate) return 0;
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 3);

  const continueItems = [...continueSeries, ...recentContents].slice(0, 5);

  // 最新の再生履歴 (最初の10件)
  const recentHistory = mockPlayHistory.slice(0, 10);

  // Group recent history by date
  const groupedRecentHistory = recentHistory.reduce((groups: { [key: string]: typeof recentHistory }, item) => {
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
    
    return groups;
  }, {});

  return (
    <div className="pb-40 pt-6 dark:bg-gray-900">
      {/* Header */}
      <div className="px-[5%] mb-8">
        <div className="flex items-center justify-between mb-1">
          {activeServiceAccount?.logoUrl ? (
            <img
              src={activeServiceAccount.logoUrl}
              alt={activeServiceAccount.serviceName}
              className="h-10 object-contain cursor-pointer"
              onClick={onAccountTap}
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer" onClick={onAccountTap}>
              {activeServiceAccount?.serviceName || 'サービス'}
            </h1>
          )}
          <button
            onClick={onAccountTap}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold hover:opacity-80 transition-opacity"
          >
            {activeServiceAccount?.serviceName.charAt(0).toUpperCase() || 'U'}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</p>
      </div>

      {/* 今日のおすすめ */}
      {todayRecommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-[5%]">今日のおすすめ</h2>
          <div className="flex gap-4 overflow-x-auto px-[5%] pb-2 scrollbar-hide snap-x snap-mandatory">
            {todayRecommendations.map((series) => (
              <div key={series.id} className="flex-shrink-0 w-[85%] snap-center">
                <SeriesCard
                  series={series}
                  variant="large"
                  onTap={onSeriesTap}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 前回の続き */}
      {continueItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-[5%]">
            前回の続き
          </h2>
          <div className="flex gap-3 overflow-x-auto px-[5%] pb-2 scrollbar-hide">
            {continueItems.map((item) => 
              isSeries(item) ? (
                <SeriesCard
                  key={item.id}
                  series={item}
                  variant="small"
                  onTap={onSeriesTap}
                />
              ) : (
                <ContentCard
                  key={item.id}
                  content={item}
                  variant="small"
                  onPlay={onPlayContent}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* 新着 */}
      {mockNewArrivals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-[5%]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">新着</h2>
            <button
              onClick={onViewAllNewArrivals}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-500 hover:opacity-80 transition-opacity"
            >
              <span>すべてを表示</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-[5%] pb-2 scrollbar-hide">
            {mockNewArrivals.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[160px] cursor-pointer"
                onClick={() => {
                  if (item.type === 'content' && item.content) {
                    onPlayContent(item.content);
                  } else if (item.type === 'episode' && item.series && item.episode) {
                    onPlayEpisode(item.series, item.episode);
                  } else if (item.type === 'chapter' && item.series && item.episode && item.chapter) {
                    onPlayEpisode(item.series, item.episode, item.chapter);
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 rounded-full">
                    {item.itemType === 'video' ? (
                      <Video className="w-3 h-3 text-white" />
                    ) : (
                      <Headphones className="w-3 h-3 text-white" />
                    )}
                    <span className="text-[10px] text-white font-medium">
                      {item.itemType === 'video' ? 'VIDEO' : 'AUDIO'}
                    </span>
                  </div>

                  {/* Play button */}
                  <div className="absolute bottom-2 right-2">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-900 fill-gray-900" />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                    {formatDuration(item.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.type === 'content' ? getCategoryLabel(item.category) : item.series?.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最新の再生履歴 */}
      {recentHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 px-[5%]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">最新の再生履歴</h2>
            <button
              onClick={onViewAllHistory}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-500 hover:opacity-80 transition-opacity"
            >
              <span>すべてを表示</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
            {Object.keys(groupedRecentHistory).map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white px-[5%] py-2">
                  {dateKey}
                </h3>
                {groupedRecentHistory[dateKey].map((historyItem, index) => {
                  const progressPercent = (historyItem.progress / historyItem.duration) * 100;
                  const playedDate = new Date(historyItem.playedAt);
                  const dateStr = `${playedDate.getMonth() + 1}/${playedDate.getDate()}`;
                  
                  return (
                    <div
                      key={historyItem.id}
                      className={`flex items-center gap-3 px-[5%] py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        index !== groupedRecentHistory[dateKey].length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                      }`}
                      onClick={() => {
                        if (historyItem.episode) {
                          onPlayEpisode(historyItem.series, historyItem.episode, historyItem.chapter);
                        }
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img
                          src={historyItem.thumbnail}
                          alt={historyItem.series.title}
                          className="w-full h-full rounded-[5px] object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[5px]">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {historyItem.episode?.title || historyItem.series.title}
                          {historyItem.chapter && ` - CH${historyItem.chapter.chapterNumber}`}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {historyItem.series.title} • {dateStr}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}