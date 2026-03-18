// Type definitions
export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  duration: number;
  startTime?: number; // Start time in seconds from episode beginning
  isCompleted: boolean;
  playCount: number;
  lastPlayed?: Date;
  isFavorite?: boolean;
  isDownloaded?: boolean;
  isLocked?: boolean;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  duration: number;
  isCompleted: boolean;
  playCount: number;
  lastPlayed?: Date;
  isFavorite?: boolean;
  isDownloaded?: boolean;
  videoUrl?: string;
  aspectRatio?: '16:9' | '9:16';
  chapters?: Chapter[];
  isLocked?: boolean;
  description?: string; // For episode description/text content
}

export interface Series {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'audio';
  thumbnail: string;
  isFavorite: boolean;
  isDownloaded: boolean;
  totalEpisodes: number;
  completedEpisodes: number;
  lastPlayedEpisode?: number;
  isAccessible?: boolean; // If false, series is visible but content is not accessible
  episodes: Episode[];
}

export interface Content {
  id: string;
  title: string;
  category: string;
  type: 'video' | 'audio';
  duration: number;
  thumbnail?: string;
  isFavorite: boolean;
  isDownloaded: boolean;
  lastPlayed?: Date;
  playCount: number;
  isSeries: false;
  isLocked?: boolean;
  description?: string; // For content description/text content
}

export type LibraryItem = Series | Content;

export interface HistoryItem {
  id: string;
  series: Series;
  episode?: Episode;
  chapter?: Chapter;
  playedAt: Date;
  duration: number; // Total duration of the content
  progress: number; // Progress in seconds
  thumbnail: string;
}

export interface PlaylistItem {
  series: Series;
  episode: Episode;
  chapter?: Chapter;
}

export interface AlarmSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
  days: ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[]; // Selected days of the week
  random?: boolean; // Random playback option
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: PlaylistItem[];
  alarm?: AlarmSettings;
  coverImage?: string; // URL to cover image (1:1 aspect ratio)
  gradient?: string; // Tailwind gradient classes (e.g., "from-blue-500 to-purple-600")
  createdAt: Date;
}

export const categories = [
  { id: 'all', label: 'すべて' },
  { id: 'meditation', label: '瞑想' },
  { id: 'english', label: '英語' },
  { id: 'business', label: 'ビジネス' },
  { id: 'affirmation', label: '自己肯定感' },
  { id: 'sales', label: 'セールス練習' },
];

export const mockSeries: Series[] = [
  {
    id: 'series-1',
    title: 'ビジネス英会話 完全マスター',
    description: '基礎から応用まで、ビジネスシーン使える英会話を段階的に学習',
    category: 'english',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1565022536102-f7645c84354a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwc3R1ZHklMjBib29rc3xlbnwxfHx8fDE3Njg5NDcxOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isFavorite: true,
    isDownloaded: true,
    totalEpisodes: 12,
    completedEpisodes: 3,
    lastPlayedEpisode: 3,
    episodes: [
      {
        id: 'ep-1-1',
        episodeNumber: 1,
        title: '自己紹介とあいさつ',
        duration: 900,
        isCompleted: true,
        playCount: 8,
        lastPlayed: new Date('2026-01-15T20:00:00'),
        isFavorite: true,
        isDownloaded: true,
        videoUrl: 'qiyTDxBjmIw', // 16:9 video
        aspectRatio: '16:9',
        isLocked: false, // Unlocked
        description: 'Episode 1: 自己紹介とあいさつ\n\nこのエピソードでは、ビジネスシーンで必要な基本的な自己紹介のフレーズを学びます。初対面の相手に好印象を与え、スムーズにコミュニケーションを開始するためのテクニックを習得しましょう。\n\n第1章：ビジネスにおける第一印象の重要性\n最初の数秒で相手に与える印象が、その後の関係性に大きく影響します。適切な言葉選び、声のトーン、そして表情が重要です。\n\n第2章：基本の自己紹介フレーズ\n"Hello, my name is..." から始まる基本的なフレーズを確認します。名前、所属部署、役職を明確に伝えることで、相手に信頼感を与えることができます。',
        chapters: [
          {
            id: 'ep-1-1-ch-1',
            chapterNumber: 1,
            title: '基本的な挨拶',
            duration: 300,
            startTime: 0,
            isCompleted: true,
            playCount: 8,
          },
          {
            id: 'ep-1-1-ch-2',
            chapterNumber: 2,
            title: '自己紹介のフレーズ',
            duration: 300,
            startTime: 300,
            isCompleted: true,
            playCount: 7,
          },
          {
            id: 'ep-1-1-ch-3',
            chapterNumber: 3,
            title: '質問への返答テクニック',
            duration: 300,
            startTime: 600,
            isCompleted: false,
            playCount: 3,
          },
        ],
      },
      {
        id: 'ep-1-2',
        episodeNumber: 2,
        title: '電話応対の基本',
        duration: 1200,
        isCompleted: true,
        playCount: 5,
        lastPlayed: new Date('2026-01-17T19:30:00'),
        isFavorite: true,
        isDownloaded: true,
        videoUrl: 'Q2S1JLSJv1U', // 9:16 video
        aspectRatio: '9:16',
        isLocked: false, // Unlocked
        description: 'Episode 2: 電話応対の基本\n\nビジネスの電話応対で求められるプロフェッショナルな対応方法を学びます。明確で丁寧な英語表現を使い、相手に安心感を与える電話スキルを身につけましょう。\n\n第1章：電話の受け答えの基本\n電話を受けた際の第一声は非常に重要です。"Thank you for calling..." というフレーズで始め、相手に歓迎の意を示しましょう。\n\n第2章：用件の聞き取りと転送\n相手の用件を正確に聞き取り、適切な担当者に転送する方法を学びます。メモの取り方や復唱のテクニックも紹介します。',
      },
      {
        id: 'ep-1-3',
        episodeNumber: 3,
        title: 'メール作成のポイント',
        duration: 1100,
        isCompleted: true,
        playCount: 3,
        lastPlayed: new Date('2026-01-19T20:15:00'),
        isFavorite: false,
        isDownloaded: false,
        videoUrl: 'qiyTDxBjmIw', // 16:9 video
        aspectRatio: '16:9',
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-4',
        episodeNumber: 4,
        title: '会議での発言',
        duration: 1300,
        isCompleted: false,
        playCount: 0,
        videoUrl: 'Q2S1JLSJv1U', // 9:16 video
        aspectRatio: '9:16',
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-5',
        episodeNumber: 5,
        title: 'プレゼンテーションの基礎',
        duration: 1500,
        isCompleted: false,
        playCount: 0,
        videoUrl: 'qiyTDxBjmIw', // 16:9 video
        aspectRatio: '16:9',
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-6',
        episodeNumber: 6,
        title: '商談・交渉のフレーズ',
        duration: 1400,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-7',
        episodeNumber: 7,
        title: 'クレーム対応',
        duration: 1200,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-8',
        episodeNumber: 8,
        title: '社内コミュニケーション',
        duration: 1000,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-9',
        episodeNumber: 9,
        title: '出張・接待の英語',
        duration: 1100,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-10',
        episodeNumber: 10,
        title: '契約・法務の用語',
        duration: 1300,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-11',
        episodeNumber: 11,
        title: 'マーケティング・営業',
        duration: 1200,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
      {
        id: 'ep-1-12',
        episodeNumber: 12,
        title: '総合ロールプレイ',
        duration: 1800,
        isCompleted: false,
        playCount: 0,
        isLocked: true, // Locked
      },
    ],
  },
  {
    id: 'series-2',
    title: 'マインドフルネス瞑想 21日間',
    description: '毎日続けることで習慣化する、段階的な瞑想プログラム',
    category: 'meditation',
    type: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1764192114257-ae9ecf97eb6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwY2FsbSUyMG5hdHVyZXxlbnwxfHx8fDE3Njg4NTMxMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isFavorite: true,
    isDownloaded: true,
    totalEpisodes: 21,
    completedEpisodes: 5,
    lastPlayedEpisode: 5,
    isAccessible: false, // Not accessible - needs request
    episodes: Array.from({ length: 21 }, (_, i) => ({
      id: `ep-2-${i + 1}`,
      episodeNumber: i + 1,
      title: `Day ${i + 1} - ${
        i < 7 ? '基礎編' : i < 14 ? '応用編' : '実践編'
      }`,
      duration: 300 + Math.floor(Math.random() * 300),
      isCompleted: i < 5,
      playCount: i < 5 ? Math.floor(Math.random() * 10) + 1 : 0,
      lastPlayed: i < 5 ? new Date(`2026-01-${16 + i}T07:30:00`) : undefined,
      isDownloaded: true,
    })),
  },
  {
    id: 'series-3',
    title: 'セールス実践トレーニング',
    description: '営業のプロが教える、成果を出すための実践的なセールステクニック',
    category: 'sales',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1758691736722-cda1858056e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGxlYXJuaW5nfGVufDF8fHx8MTc2ODk0NzE5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    isFavorite: false,
    isDownloaded: true,
    totalEpisodes: 4,
    completedEpisodes: 0,
    episodes: [
      {
        id: 'ep-3-1',
        episodeNumber: 1,
        title: 'セールスの全体像を理解する（基礎編・マインドセット）',
        duration: 2400,
        isCompleted: false,
        playCount: 0,
        chapters: [
          {
            id: 'ep-3-1-ch-1',
            chapterNumber: 1,
            title: 'なぜセールスが苦手になるのか',
            duration: 600,
            isCompleted: true,
            playCount: 12,
          },
          {
            id: 'ep-3-1-ch-2',
            chapterNumber: 2,
            title: '売ることへの誤解と本当の役割',
            duration: 600,
            isCompleted: true,
            playCount: 8,
          },
          {
            id: 'ep-3-1-ch-3',
            chapterNumber: 3,
            title: '成果が出るセールスの全体構造',
            duration: 600,
            isCompleted: false,
            playCount: 5,
          },
          {
            id: 'ep-3-1-ch-4',
            chapterNumber: 4,
            title: 'セールスを「技術」として捉える視点',
            duration: 600,
            isCompleted: false,
            playCount: 3,
          },
        ],
      },
      {
        id: 'ep-3-2',
        episodeNumber: 2,
        title: '見込み客の心理を読み解く（顧客理解編）',
        duration: 2400,
        isCompleted: false,
        playCount: 0,
        chapters: [
          {
            id: 'ep-3-2-ch-1',
            chapterNumber: 1,
            title: 'お客さまはなぜ行動しないのか',
            duration: 600,
            isCompleted: false,
            playCount: 2,
          },
          {
            id: 'ep-3-2-ch-2',
            chapterNumber: 2,
            title: '顕在ニーズと潜在ニーズの違い',
            duration: 600,
            isCompleted: false,
            playCount: 1,
          },
          {
            id: 'ep-3-2-ch-3',
            chapterNumber: 3,
            title: '不安・期待・抵抗の正体',
            duration: 600,
            isCompleted: false,
            playCount: 0,
          },
          {
            id: 'ep-3-2-ch-4',
            chapterNumber: 4,
            title: '信頼関係が生まれる瞬間とは',
            duration: 600,
            isCompleted: false,
            playCount: 0,
          },
        ],
      },
      {
        id: 'ep-3-3',
        episodeNumber: 3,
        title: 'ヒアリング力を鍛える（質問・対話編）',
        duration: 2400,
        isCompleted: false,
        playCount: 26,
      },
      {
        id: 'ep-3-4',
        episodeNumber: 4,
        title: '価値を伝える説明力（プレゼン編）',
        duration: 2400,
        isCompleted: false,
        playCount: 15,
      },
    ],
  },
];

export const mockContents: Content[] = [
  {
    id: '1',
    title: '朝の5分瞑想',
    category: 'meditation',
    type: 'audio',
    duration: 300,
    thumbnail: 'https://images.unsplash.com/photo-1764192114257-ae9ecf97eb6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwY2FsbSUyMG5hdHVyZXxlbnwxfHx8fDE3Njg4NTMxMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isFavorite: true,
    isDownloaded: true,
    lastPlayed: new Date('2026-01-20T07:30:00'),
    playCount: 12450,
    isSeries: false,
  },
  {
    id: '4',
    title: '自己肯定感を高める10の習慣',
    category: 'affirmation',
    type: 'audio',
    duration: 900,
    thumbnail: 'https://images.unsplash.com/flagged/photo-1564401398070-9a0ec00bd38a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RpdmF0aW9uYWwlMjBzcGVha2VyfGVufDF8fHx8MTc2ODk0NzE5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    isFavorite: true,
    isDownloaded: false,
    lastPlayed: new Date('2026-01-18T12:00:00'),
    playCount: 8723,
    isSeries: false,
  },
  {
    id: '6',
    title: 'TOEICリスニング対策',
    category: 'english',
    type: 'audio',
    duration: 3600,
    isFavorite: true,
    isDownloaded: true,
    playCount: 5634,
    isSeries: false,
  },
  {
    id: '7',
    title: '夜の瞑想 - 睡眠の質を高める',
    category: 'meditation',
    type: 'audio',
    duration: 600,
    isFavorite: true,
    isDownloaded: true,
    lastPlayed: new Date('2026-01-19T22:00:00'),
    playCount: 9856,
    isSeries: false,
  },
  {
    id: '8',
    title: 'プレゼンテーション技術',
    category: 'business',
    type: 'video',
    duration: 2100,
    isFavorite: false,
    isDownloaded: false,
    playCount: 1234,
    isSeries: false,
  },
];

export const mockLibraryItems: LibraryItem[] = [
  ...mockSeries,
  ...mockContents,
];

// New Arrivals - Episodes, Chapters, and standalone Content items
export interface NewArrivalItem {
  id: string;
  type: 'episode' | 'chapter' | 'content';
  title: string;
  series?: Series;
  episode?: Episode;
  chapter?: Chapter;
  content?: Content;
  thumbnail: string;
  duration: number;
  category: string;
  itemType: 'video' | 'audio';
  addedAt: Date;
  isFavorite?: boolean;
}

// Mock New Arrivals Data (8 items for horizontal scroll)
export const mockNewArrivals: NewArrivalItem[] = [
  // Recent chapters from Series 3
  {
    id: 'new-1',
    type: 'chapter',
    title: 'セールスを「技術」として捉える視点',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[0],
    chapter: mockSeries[2].episodes[0].chapters?.[3],
    thumbnail: mockSeries[2].thumbnail,
    duration: 600,
    category: 'sales',
    itemType: 'video',
    addedAt: new Date('2026-02-03T10:00:00'),
    isFavorite: false,
  },
  {
    id: 'new-2',
    type: 'chapter',
    title: '成果が出るセールスの全体構造',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[0],
    chapter: mockSeries[2].episodes[0].chapters?.[2],
    thumbnail: mockSeries[2].thumbnail,
    duration: 600,
    category: 'sales',
    itemType: 'video',
    addedAt: new Date('2026-02-02T15:30:00'),
    isFavorite: false,
  },
  // Recent episode from Series 1
  {
    id: 'new-3',
    type: 'episode',
    title: '総合ロールプレイ',
    series: mockSeries[0],
    episode: mockSeries[0].episodes[11],
    thumbnail: mockSeries[0].thumbnail,
    duration: 1800,
    category: 'english',
    itemType: 'video',
    addedAt: new Date('2026-02-02T09:00:00'),
    isFavorite: false,
  },
  // Recent episode from Series 2
  {
    id: 'new-4',
    type: 'episode',
    title: 'Day 21 - 実践編',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[20],
    thumbnail: mockSeries[1].thumbnail,
    duration: 540,
    category: 'meditation',
    itemType: 'audio',
    addedAt: new Date('2026-02-01T18:00:00'),
    isFavorite: true,
  },
  // Standalone content
  {
    id: 'new-5',
    type: 'content',
    title: '朝の5分瞑想',
    content: mockContents[0],
    thumbnail: mockContents[0].thumbnail,
    duration: 300,
    category: 'meditation',
    itemType: 'audio',
    addedAt: new Date('2026-02-01T07:00:00'),
    isFavorite: true,
  },
  // Recent chapters from Series 3
  {
    id: 'new-6',
    type: 'chapter',
    title: '信頼関係が生まれる瞬間とは',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[1],
    chapter: mockSeries[2].episodes[1].chapters?.[3],
    thumbnail: mockSeries[2].thumbnail,
    duration: 600,
    category: 'sales',
    itemType: 'video',
    addedAt: new Date('2026-01-31T16:00:00'),
    isFavorite: false,
  },
  {
    id: 'new-7',
    type: 'chapter',
    title: '不安・期待・抵抗の正体',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[1],
    chapter: mockSeries[2].episodes[1].chapters?.[2],
    thumbnail: mockSeries[2].thumbnail,
    duration: 600,
    category: 'sales',
    itemType: 'video',
    addedAt: new Date('2026-01-31T12:00:00'),
    isFavorite: false,
  },
  // Recent episode
  {
    id: 'new-8',
    type: 'episode',
    title: 'Day 20 - 実践編',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[19],
    thumbnail: mockSeries[1].thumbnail,
    duration: 520,
    category: 'meditation',
    itemType: 'audio',
    addedAt: new Date('2026-01-31T08:00:00'),
    isFavorite: false,
  },
];

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const getCategoryLabel = (categoryId: string): string => {
  return categories.find((c) => c.id === categoryId)?.label || categoryId;
};

export const isSeries = (item: LibraryItem): item is Series => {
  return 'episodes' in item;
};

export const isContent = (item: LibraryItem): item is Content => {
  return 'isSeries' in item && !item.isSeries;
};

// Mock Play History Data
export const mockPlayHistory: HistoryItem[] = [
  // Today (2026-02-02)
  {
    id: 'history-1',
    series: mockSeries[0],
    episode: mockSeries[0].episodes[2],
    playedAt: new Date('2026-02-02T09:15:00'),
    duration: 1100,
    progress: 880,
    thumbnail: mockSeries[0].thumbnail,
  },
  {
    id: 'history-2',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[4],
    playedAt: new Date('2026-02-02T07:30:00'),
    duration: 450,
    progress: 450,
    thumbnail: mockSeries[1].thumbnail,
  },
  // Yesterday (2026-02-01)
  {
    id: 'history-3',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[0],
    chapter: mockSeries[2].episodes[0].chapters?.[1],
    playedAt: new Date('2026-02-01T20:45:00'),
    duration: 600,
    progress: 600,
    thumbnail: mockSeries[2].thumbnail,
  },
  {
    id: 'history-4',
    series: mockSeries[0],
    episode: mockSeries[0].episodes[1],
    playedAt: new Date('2026-02-01T19:30:00'),
    duration: 1200,
    progress: 1050,
    thumbnail: mockSeries[0].thumbnail,
  },
  {
    id: 'history-5',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[3],
    playedAt: new Date('2026-02-01T07:00:00'),
    duration: 420,
    progress: 420,
    thumbnail: mockSeries[1].thumbnail,
  },
  // 2 days ago (2026-01-31)
  {
    id: 'history-6',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[0],
    chapter: mockSeries[2].episodes[0].chapters?.[0],
    playedAt: new Date('2026-01-31T21:00:00'),
    duration: 600,
    progress: 600,
    thumbnail: mockSeries[2].thumbnail,
  },
  {
    id: 'history-7',
    series: mockSeries[0],
    episode: mockSeries[0].episodes[0],
    playedAt: new Date('2026-01-31T18:30:00'),
    duration: 900,
    progress: 900,
    thumbnail: mockSeries[0].thumbnail,
  },
  // 3 days ago (2026-01-30)
  {
    id: 'history-8',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[2],
    playedAt: new Date('2026-01-30T07:45:00'),
    duration: 380,
    progress: 380,
    thumbnail: mockSeries[1].thumbnail,
  },
  {
    id: 'history-9',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[1],
    chapter: mockSeries[2].episodes[1].chapters?.[0],
    playedAt: new Date('2026-01-30T20:15:00'),
    duration: 600,
    progress: 420,
    thumbnail: mockSeries[2].thumbnail,
  },
  // 4 days ago (2026-01-29)
  {
    id: 'history-10',
    series: mockSeries[0],
    episode: mockSeries[0].episodes[2],
    playedAt: new Date('2026-01-29T19:00:00'),
    duration: 1100,
    progress: 1100,
    thumbnail: mockSeries[0].thumbnail,
  },
  {
    id: 'history-11',
    series: mockSeries[1],
    episode: mockSeries[1].episodes[1],
    playedAt: new Date('2026-01-29T07:15:00'),
    duration: 360,
    progress: 360,
    thumbnail: mockSeries[1].thumbnail,
  },
  // 5 days ago (2026-01-28)
  {
    id: 'history-12',
    series: mockSeries[2],
    episode: mockSeries[2].episodes[2],
    playedAt: new Date('2026-01-28T21:30:00'),
    duration: 2400,
    progress: 1800,
    thumbnail: mockSeries[2].thumbnail,
  },
];