import type {
  Episode,
  HistoryItem,
  IApiRepository,
  LibraryItem,
  LoginCredentials,
  SeriesDetail,
  SeriesItem,
} from './IApiRepository'

const mockEpisodesForHome = [
  {
    id: '1',
    title: 'TypeScript入門講座',
    description: 'TypeScriptの基礎から学べる初心者向け講座です',
    img: 'https://picsum.photos/seed/typescript/400/300',
    category: 'プログラミング',
    duration: 1800,
    type: 'video' as const,
    lastPlayed: '2026-03-03T15:30:00Z',
  },
  {
    id: '2',
    title: 'React Native実践開発',
    description: 'React Nativeでモバイルアプリを開発する方法を学びます',
    img: 'https://picsum.photos/seed/reactnative/400/300',
    category: 'プログラミング',
    duration: 2400,
    type: 'video' as const,
    lastPlayed: '2026-03-02T10:15:00Z',
  },
  {
    id: '3',
    title: '英会話フレーズ100選',
    description: '日常で使える英会話フレーズを音声で学習',
    img: 'https://picsum.photos/seed/english/400/300',
    category: '語学',
    duration: 3600,
    type: 'audio' as const,
  },
  {
    id: '4',
    title: 'ビジネス英語マスター',
    description: 'ビジネスシーンで使える英語表現を習得',
    img: 'https://picsum.photos/seed/business/400/300',
    category: '語学',
    duration: 2700,
    type: 'audio' as const,
  },
  {
    id: '5',
    title: 'UIデザイン基礎講座',
    description: 'UIデザインの基本原則を学ぶ',
    img: 'https://picsum.photos/seed/uidesign/400/300',
    category: 'デザイン',
    duration: 2100,
    type: 'video' as const,
  },
  {
    id: '6',
    title: 'Figma実践ガイド',
    description: 'Figmaを使ったデザインワークフロー',
    img: 'https://picsum.photos/seed/figma/400/300',
    category: 'デザイン',
    duration: 1950,
    type: 'video' as const,
  },
  {
    id: '7',
    title: 'マインドフルネス瞑想',
    description: '心を落ち着かせる瞑想ガイド',
    img: 'https://picsum.photos/seed/meditation/400/300',
    category: 'ライフスタイル',
    duration: 900,
    type: 'audio' as const,
    lastPlayed: '2026-03-01T08:00:00Z',
  },
  {
    id: '8',
    title: 'Web API設計入門',
    description: 'RESTful APIの設計手法を学ぶ',
    img: 'https://picsum.photos/seed/api/400/300',
    category: 'プログラミング',
    duration: 2250,
    type: 'video' as const,
  },
  {
    id: '9',
    title: 'TOEICリスニング対策',
    description: 'TOEICのリスニングパートを攻略',
    img: 'https://picsum.photos/seed/toeic/400/300',
    category: '語学',
    duration: 3000,
    type: 'audio' as const,
  },
  {
    id: '10',
    title: 'Docker完全ガイド',
    description: 'Dockerの基礎から応用まで',
    img: 'https://picsum.photos/seed/docker/400/300',
    category: 'プログラミング',
    duration: 2800,
    type: 'video' as const,
  },
]

const mockSeries: SeriesItem[] = [
  {
    series_id: 1,
    img: 'https://picsum.photos/seed/jsseries/400/300',
    num_total: 12,
    num_comp: 5,
    category: 'プログラミング',
    title: 'JavaScript完全マスター',
    description:
      'JavaScriptの基礎から応用まで体系的に学べる総合コースです。変数、関数、オブジェクト指向といった基本概念から、非同期処理、モダンなES6+の機能、フレームワークの活用まで、実践的なスキルを身につけることができます。',
    duration: 14400,
  },
  {
    series_id: 2,
    img: 'https://picsum.photos/seed/toeicseries/400/300',
    num_total: 20,
    num_comp: 12,
    category: '語学',
    title: 'TOEIC対策コース',
    description:
      'TOEIC高得点を目指すための総合的な学習プログラムです。リスニング、リーディング、文法、語彙力を効率的に強化し、スコアアップに必要な戦略とテクニックを習得できます。実践的な模擬問題も豊富に収録しています。',
    duration: 24000,
  },
  {
    series_id: 3,
    img: 'https://picsum.photos/seed/uxseries/400/300',
    num_total: 8,
    num_comp: 8,
    category: 'デザイン',
    title: 'UI/UXデザイン実践',
    description:
      'ユーザー中心のデザイン思考を基に、実践的なUI/UXスキルを身につけるコースです。ユーザーリサーチ、ワイヤーフレーム作成、プロトタイピング、ユーザビリティテストまで、デザインプロセス全体を学べます。',
    duration: 9600,
  },
  {
    series_id: 4,
    img: 'https://picsum.photos/seed/awsseries/400/300',
    num_total: 15,
    num_comp: 3,
    category: 'プログラミング',
    title: 'AWS入門から実践まで',
    description:
      'Amazon Web Services（AWS）の主要サービスを網羅的に学習できるコースです。EC2、S3、RDS、Lambdaなどの基本サービスから、スケーラブルなアーキテクチャ設計、セキュリティ対策まで、実務で必要なスキルを習得できます。',
    duration: 18000,
  },
  {
    series_id: 5,
    img: 'https://picsum.photos/seed/yogaseries/400/300',
    num_total: 10,
    num_comp: 0,
    category: 'ライフスタイル',
    title: 'ヨガ＆ストレッチ',
    description:
      '初心者でも無理なく始められるヨガとストレッチの基礎プログラムです。柔軟性の向上、姿勢改善、ストレス解消など、心と体の健康をサポートします。朝のルーティンや仕事の合間にも取り入れやすい内容です。',
    duration: 12000,
  },
]

const mockSeriesDetail: SeriesDetail[] = [
  {
    series_id: 1,
    type_media: 1,
    url: 'https://example.com/series1.m3u8',
    img: 'https://picsum.photos/seed/jsseries/400/300',
    num_total: 12,
    num_comp: 5,
    category: 'プログラミング',
    title: 'JavaScript完全マスター',
    description:
      'JavaScriptの基礎から応用まで体系的に学べる総合コースです。変数、関数、オブジェクト指向といった基本概念から、非同期処理、モダンなES6+の機能、フレームワークの活用まで、実践的なスキルを身につけることができます。',
    duration: 14400,
    episodes: [],
  },
  {
    series_id: 2,
    type_media: 2,
    url: 'https://example.com/series2.m3u8',
    img: 'https://picsum.photos/seed/toeicseries/400/300',
    num_total: 20,
    num_comp: 12,
    category: '語学',
    title: 'TOEIC対策コース',
    description:
      'TOEIC高得点を目指すための総合的な学習プログラムです。リスニング、リーディング、文法、語彙力を効率的に強化し、スコアアップに必要な戦略とテクニックを習得できます。実践的な模擬問題も豊富に収録しています。',
    duration: 24000,
    episodes: [],
  },
]

const mockEpisodes: Episode[] = [
  {
    episode_id: 1,
    type_media: 1,
    url: 'https://example.com/ep1.m3u8',
    img: 'https://picsum.photos/seed/typescript/400/300',
    title: 'TypeScript入門講座',
    duration: 1800,
    units: [],
  },
  {
    episode_id: 2,
    type_media: 1,
    url: 'https://example.com/ep2.m3u8',
    img: 'https://picsum.photos/seed/reactnative/400/300',
    title: 'React Native実践開発',
    duration: 2400,
    units: [],
  },
  {
    episode_id: 3,
    type_media: 2,
    url: 'https://example.com/ep3.m3u8',
    img: 'https://picsum.photos/seed/english/400/300',
    title: '英会話フレーズ100選',
    duration: 3600,
    units: [],
  },
]

const mockHistory: HistoryItem[] = [
  {
    id: 'h1',
    thumbnail: 'https://picsum.photos/seed/typescript/400/300',
    title: 'TypeScript入門講座 EP1',
    seriesTitle: 'TypeScript入門講座',
    progress: 450,
    duration: 1800,
    playedAt: '2026-03-03T10:30:00Z',
  },
  {
    id: 'h2',
    thumbnail: 'https://picsum.photos/seed/reactnative/400/300',
    title: 'React Native実践開発 EP3',
    seriesTitle: 'React Native実践開発',
    progress: 1200,
    duration: 2400,
    playedAt: '2026-03-02T15:20:00Z',
  },
  {
    id: 'h3',
    thumbnail: 'https://picsum.photos/seed/uidesign/400/300',
    title: 'UIデザイン基礎講座',
    seriesTitle: 'UIデザイン基礎講座',
    progress: 300,
    duration: 2100,
    playedAt: '2026-03-01T20:15:00Z',
  },
  {
    id: 'h4',
    thumbnail: 'https://picsum.photos/seed/api/400/300',
    title: 'Web API設計入門 EP2',
    seriesTitle: 'Web API設計入門',
    progress: 1800,
    duration: 2250,
    playedAt: '2026-02-29T12:00:00Z',
  },
  {
    id: 'h5',
    thumbnail: 'https://picsum.photos/seed/docker/400/300',
    title: 'Docker完全ガイド EP1',
    seriesTitle: 'Docker完全ガイド',
    progress: 600,
    duration: 2800,
    playedAt: '2026-02-28T18:45:00Z',
  },
  {
    id: 'h6',
    thumbnail: 'https://picsum.photos/seed/english/400/300',
    title: '英会話フレーズ100選',
    seriesTitle: '英会話フレーズ100選',
    progress: 2400,
    duration: 3600,
    playedAt: '2026-02-27T09:30:00Z',
  },
  {
    id: 'h7',
    thumbnail: 'https://picsum.photos/seed/meditation/400/300',
    title: 'マインドフルネス瞑想',
    seriesTitle: 'マインドフルネス瞑想',
    progress: 600,
    duration: 900,
    playedAt: '2026-02-26T07:00:00Z',
  },
  {
    id: 'h8',
    thumbnail: 'https://picsum.photos/seed/toeic/400/300',
    title: 'TOEICリスニング対策 EP5',
    seriesTitle: 'TOEICリスニング対策',
    progress: 1500,
    duration: 3000,
    playedAt: '2026-02-25T19:45:00Z',
  },
  {
    id: 'h9',
    thumbnail: 'https://picsum.photos/seed/business/400/300',
    title: 'ビジネス英語マスター',
    seriesTitle: 'ビジネス英語マスター',
    progress: 1800,
    duration: 2700,
    playedAt: '2026-02-24T14:20:00Z',
  },
  {
    id: 'h10',
    thumbnail: 'https://picsum.photos/seed/figma/400/300',
    title: 'Figma実践ガイド EP2',
    seriesTitle: 'Figma実践ガイド',
    progress: 1200,
    duration: 1950,
    playedAt: '2026-02-23T16:00:00Z',
  },
]

export class ApiMockRepository implements IApiRepository {
  async isAuthenticated() {
    return true
  }

  async refreshToken() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return true
  }

  async getMe() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      id: '1',
      email: 'mock@example.com',
      name: 'Mock User',
    }
  }

  async login(credentials: LoginCredentials) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
    return {
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: credentials.email,
        name: 'Mock User',
      },
    }
  }

  async logout() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
  }

  async getHomeData() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      recommends: mockSeries.slice(0, 3),
      recents: mockSeries.map((s, i) => ({
        ...s,
        item_id: i + 1,
        num_total: i % 2 === 0 ? 0 : s.num_total,
      })),
      news: mockEpisodesForHome.slice(0, 10).map((c) => ({
        ...c,
        type: 'episode' as const,
        itemType: c.type,
      })),
      histories: mockSeries.map((s, i) => {
        const daysAgo = Math.floor(Math.random() * 30)
        const playedAt = new Date()
        playedAt.setDate(playedAt.getDate() - daysAgo)
        playedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
        return {
          ...s,
          item_id: i + 1,
          num_total: i % 2 === 0 ? 0 : s.num_total,
          playedAt,
        }
      }),
    }
  }

  async getNewArrivals() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return mockEpisodes
  }

  async getFavoriteSeries() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return mockSeriesDetail
  }

  async getFavoriteEpisodes() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return mockEpisodes
  }

  async getHistory() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return mockHistory
  }

  async getLibrary() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    const seriesItems: LibraryItem[] = mockSeriesDetail.map((s) => ({
      itemType: 'series' as const,
      id: String(s.series_id),
      title: s.title,
      thumbnail: s.img,
      category: s.category,
      totalEpisodes: s.num_total,
      completedEpisodes: s.num_comp,
      type: s.type_media === 1 ? ('video' as const) : ('audio' as const),
    }))
    const episodeItems: LibraryItem[] = mockEpisodes.map((e) => ({
      itemType: 'episode' as const,
      id: String(e.episode_id),
      title: e.title,
      thumbnail: e.img,
      category: '',
      duration: e.duration,
      type: e.type_media === 1 ? ('video' as const) : ('audio' as const),
    }))
    return [...seriesItems, ...episodeItems].sort(() => Math.random() - 0.5)
  }
}
