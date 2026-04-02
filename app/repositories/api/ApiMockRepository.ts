import AsyncStorage from '@react-native-async-storage/async-storage'

import type {
  ApiResult,
  EpisodeSummary,
  FavoriteParams,
  FavoriteSeriesItem,
  FavoritesResponse,
  HistoriesResponse,
  HomeResponse,
  IApiRepository,
  LibrariesParams,
  LibrariesResponse,
  LibraryItem,
  LoginParams,
  PlaybackHistoryItem,
  PlayEndParams,
  PlayProgressParams,
  SeriesResponse,
  SeriesSummaryDetail,
  SettingsResponse,
} from './IApiRepository'

const mockSeries: SeriesSummaryDetail[] = [
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
  {
    series_id: 6,
    img: 'https://picsum.photos/seed/meditation1/400/300',
    num_total: 1,
    num_comp: 0,
    category: 'ライフスタイル',
    title: '5分間瞑想レッスン',
    description: '忙しい日常の中でも実践できる短時間の瞑想セッションです。ストレス軽減と集中力向上に効果的です。',
    duration: 300,
  },
  {
    series_id: 7,
    img: 'https://picsum.photos/seed/english1/400/300',
    num_total: 1,
    num_comp: 1,
    category: '語学',
    title: 'ビジネス英語：プレゼンテーション編',
    description:
      '英語でのプレゼンテーションに必要なフレーズと技術を学びます。実践的な例文とともに、説得力のある発表スキルを身につけます。',
    duration: 1800,
  },
  {
    series_id: 8,
    img: 'https://picsum.photos/seed/cooking1/400/300',
    num_total: 1,
    num_comp: 0,
    category: 'ライフスタイル',
    title: '時短料理：15分で作る本格パスタ',
    description:
      '忙しい平日でも簡単に作れる本格的なパスタのレシピを紹介します。材料の準備から完成までわずか15分で美味しい一品が完成します。',
    duration: 900,
  },
]

const mockLibrarySeries: LibraryItem[] = mockSeries.map((s, i) => ({
  ...s,
  num_times: Math.floor(Math.random() * 100) + 1,
  is_favorite: i % 3 === 0,
}))

const mockFavoriteSeries: FavoriteSeriesItem[] = [
  ...mockSeries.slice(0, 3).map((s) => ({
    series_id: s.series_id,
    img: s.img,
    num_total: s.num_total,
    num_comp: s.num_comp,
    num_times: Math.floor(Math.random() * 50) + 20,
    category: s.category,
    title: s.title,
    description: s.description,
    duration: s.duration,
  })),
  ...mockSeries.slice(5, 8).map((s) => ({
    series_id: s.series_id,
    img: s.img,
    num_total: s.num_total,
    num_comp: s.num_comp,
    num_times: Math.floor(Math.random() * 30) + 10,
    category: s.category,
    title: s.title,
    description: s.description,
    duration: s.duration,
  })),
]

const mockFavoriteEpisodes: EpisodeSummary[] = [
  {
    series_id: 1,
    item_id: 1,
    img: 'https://picsum.photos/seed/fav-ep1/400/300',
    num_times: 15,
    category: 'プログラミング',
    title: 'JavaScript基礎編 第1回',
    description: '変数とデータ型について学びます',
    duration: 1800,
  },
  {
    series_id: 2,
    item_id: 5,
    img: 'https://picsum.photos/seed/fav-ep2/400/300',
    num_times: 22,
    category: '語学',
    title: 'TOEIC Part 1 対策',
    description: '写真描写問題の攻略法',
    duration: 2400,
  },
]

const mockHistories: PlaybackHistoryItem[] = [
  {
    series_id: 1,
    item_id: 1,
    url: 'https://example.com/media1.m3u8',
    img: 'https://picsum.photos/seed/history1/400/300',
    title_series: 'JavaScript完全マスター',
    title_media: 'JavaScript基礎編 第1回',
    duration: 1800,
    progress: 45,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    series_id: 2,
    item_id: 3,
    url: 'https://example.com/media2.m3u8',
    img: 'https://picsum.photos/seed/history2/400/300',
    title_series: 'TOEIC対策コース',
    title_media: 'リスニング強化レッスン',
    duration: 2100,
    progress: 78,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    series_id: 3,
    item_id: 2,
    url: 'https://example.com/media3.m3u8',
    img: 'https://picsum.photos/seed/history3/400/300',
    title_series: 'UI/UXデザイン実践',
    title_media: 'プロトタイピング入門',
    duration: 1500,
    progress: 100,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    series_id: 4,
    item_id: 1,
    url: 'https://example.com/media4.m3u8',
    img: 'https://picsum.photos/seed/history4/400/300',
    title_series: 'AWS入門から実践まで',
    title_media: 'EC2の基礎知識',
    duration: 2700,
    progress: 30,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

const mockSeriesDetail: SeriesResponse[] = [
  {
    result: 1,
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
    progress: 42,
    episodes: [
      {
        item_id: 101,
        type_media: 2,
        url: 'https://example.com/js/ep101.m3u8',
        img: 'https://picsum.photos/seed/jsep1/400/300',
        title: 'JavaScript入門',
        duration: 3600,
        progress: 3600,
        units: [
          {
            item_id: 1011,
            type_media: 2,
            url: 'https://example.com/js/ep1011.m3u8',
            img: 'https://picsum.photos/seed/jsep1u1/400/300',
            title: '変数と型',
            duration: 1200,
            progress: 1200,
          },
          {
            item_id: 1012,
            type_media: 2,
            url: 'https://example.com/js/ep1012.m3u8',
            img: 'https://picsum.photos/seed/jsep1u2/400/300',
            title: '関数とスコープ',
            duration: 1200,
            progress: 1200,
          },
          {
            item_id: 1013,
            type_media: 2,
            url: 'https://example.com/js/ep1013.m3u8',
            img: 'https://picsum.photos/seed/jsep1u3/400/300',
            title: '制御構文',
            duration: 1200,
            progress: 1200,
          },
        ],
      },
      {
        item_id: 102,
        type_media: 2,
        url: 'https://example.com/js/ep102.m3u8',
        img: 'https://picsum.photos/seed/jsep2/400/300',
        title: 'オブジェクト指向プログラミング',
        duration: 2400,
        progress: 0,
        units: [],
      },
      {
        item_id: 103,
        type_media: 2,
        url: 'https://example.com/js/ep103.m3u8',
        img: 'https://picsum.photos/seed/jsep3/400/300',
        title: '非同期処理とPromise',
        duration: 2400,
        progress: 0,
        units: [],
      },
      {
        item_id: 104,
        type_media: 2,
        url: 'https://example.com/js/ep104.m3u8',
        img: 'https://picsum.photos/seed/jsep4/400/300',
        title: 'モダンJavaScript',
        duration: 3000,
        progress: 1500,
        units: [
          {
            item_id: 1041,
            type_media: 2,
            url: 'https://example.com/js/ep1041.m3u8',
            img: 'https://picsum.photos/seed/jsep4u1/400/300',
            title: 'ES6+の新機能',
            duration: 1500,
            progress: 1500,
          },
          {
            item_id: 1042,
            type_media: 2,
            url: 'https://example.com/js/ep1042.m3u8',
            img: 'https://picsum.photos/seed/jsep4u2/400/300',
            title: 'モジュールシステム',
            duration: 1500,
            progress: 0,
          },
        ],
      },
    ],
  },
  {
    result: 1,
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
    progress: 60,
    episodes: [],
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

  async login(_credentials: LoginParams) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
    const token = 'mock-token'
    await AsyncStorage.setItem('auth_token', token)
    return {
      result: 1,
      token,
    }
  }

  async logout() {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
  }

  async getSettings(): Promise<SettingsResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      result: 1,
      header_light: 'https://picsum.photos/seed/header-light/800/200',
      header_dark: 'https://picsum.photos/seed/header-dark/800/200',
      categories: [
        { category_id: 1, name: 'プログラミング' },
        { category_id: 2, name: '語学' },
        { category_id: 3, name: 'デザイン' },
        { category_id: 4, name: 'ライフスタイル' },
        { category_id: 5, name: 'ビジネス' },
      ],
    }
  }

  async getHome(): Promise<HomeResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      result: 1,
      recommends: mockSeries.slice(0, 3),
      recents: mockSeries.map((s, i) => ({
        series_id: s.series_id,
        img: s.img,
        num_total: s.num_total,
        num_comp: s.num_comp,
        category: s.category,
        title: s.title,
        item_id: i + 1,
        progress: Math.floor(Math.random() * 100),
      })),
      news: mockSeries.slice(0, 10).map((s, i) => ({
        series_id: s.series_id,
        item_id: i + 1,
        img: s.img,
        num_total: s.num_total,
        category: s.category,
        title: s.title,
      })),
      histories: mockHistories,
    }
  }

  async getSeries(seriesId: number): Promise<SeriesResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    const series = mockSeriesDetail.find((s) => s.series_id === seriesId)
    if (!series) {
      throw new Error('Series not found')
    }
    return series
  }

  async getLibraries(params: LibrariesParams): Promise<LibrariesResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))

    let filtered = [...mockLibrarySeries]

    if (params.type === 4) {
      filtered = filtered.filter((s) => s.is_favorite)
    }

    if (params.category) {
      const categoryMap: Record<number, string> = {
        1: 'プログラミング',
        2: '語学',
        3: 'デザイン',
        4: 'ライフスタイル',
        5: 'ビジネス',
      }
      const categoryName = categoryMap[params.category]
      if (categoryName) {
        filtered = filtered.filter((s) => s.category === categoryName)
      }
    }

    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword) ||
          s.category.toLowerCase().includes(keyword),
      )
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (params.order === 1) {
        comparison = a.series_id - b.series_id
      } else if (params.order === 2) {
        comparison = a.num_times - b.num_times
      } else if (params.order === 3) {
        comparison = a.title.localeCompare(b.title)
      }
      return params.asc === 1 ? comparison : -comparison
    })

    return {
      result: 1,
      libraries: filtered,
    }
  }

  async getFavorites(): Promise<FavoritesResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      result: 1,
      series: mockFavoriteSeries,
      episodes: mockFavoriteEpisodes,
    }
  }

  async updateFavorite(params: FavoriteParams): Promise<ApiResult> {
    console.log('Update favorite:', params)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100))
    return {
      result: 1,
    }
  }

  async getHistories(): Promise<HistoriesResponse> {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300))
    return {
      result: 1,
      histories: mockHistories,
    }
  }

  async updatePlayProgress(params: PlayProgressParams): Promise<ApiResult> {
    console.log('Update play progress:', params)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100))
    return {
      result: 1,
    }
  }

  async updatePlayEnd(params: PlayEndParams): Promise<ApiResult> {
    console.log('Play ended:', params)
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100))
    return {
      result: 1,
    }
  }
}
