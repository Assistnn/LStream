export type LoginCredentials = {
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name?: string
  }
}
export type HomeData = {
  recommends: SeriesItem[]
  recents: SeriesItemWithItemId[]
  news: Array<{
    id: string
    title: string
    img: string
    duration: number
    category: string
    type: 'episode' | 'series'
    itemType: 'audio' | 'video'
  }>
  histories: Array<
    SeriesItemWithItemId & {
      playedAt: Date
    }
  >
}

export type Series = {
  series_id: number
  img: string
  num_total: number
  category: string
  title: string
}

export type SeriesItem = Series & {
  num_comp: number
  description: string
  duration: number
}

export type SeriesItemWithItemId = SeriesItem & {
  item_id: number
}

export type SeriesDetail = SeriesItem & {
  type_media: number
  url: string
  episodes: Episode[]
}

export type Episode = {
  episode_id: number
  type_media: number
  url: string
  img: string
  title: string
  duration: number
  units: Unit[]
}

export type Unit = {
  episode_id: number
  type_media: number
  url: string
  img: string
  title: string
  duration: number
}

export type HistoryItem = {
  id: string
  thumbnail: string
  title: string
  seriesTitle: string
  progress: number
  duration: number
  playedAt: string
}

export type LibraryItem =
  | {
      itemType: 'series'
      id: string
      title: string
      thumbnail?: string
      category: string
      totalEpisodes: number
      completedEpisodes: number
      type: 'audio' | 'video'
    }
  | {
      itemType: 'episode'
      id: string
      title: string
      thumbnail?: string
      category: string
      duration: number
      progress?: number
      type: 'audio' | 'video'
    }

export interface IApiRepository {
  isAuthenticated(): Promise<boolean>
  refreshToken(): Promise<boolean>
  getMe(): Promise<AuthResponse['user']>
  login(credentials: LoginCredentials): Promise<AuthResponse>
  logout(): Promise<void>
  getHomeData(): Promise<HomeData>
  getNewArrivals(): Promise<Episode[]>
  getFavoriteSeries(): Promise<SeriesDetail[]>
  getFavoriteEpisodes(): Promise<Episode[]>
  getHistory(): Promise<HistoryItem[]>
  getLibrary(): Promise<LibraryItem[]>
}
