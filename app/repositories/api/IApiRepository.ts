export interface IApiRepository {
  isAuthenticated(): Promise<boolean>
  refreshToken(): Promise<boolean>
  login(credentials: LoginParams): Promise<AuthResponse>
  logout(): Promise<void>
  getSettings(): Promise<SettingsResponse>
  getHome(): Promise<HomeResponse>
  getSeries(seriesId: number): Promise<SeriesResponse>
  getLibraries(params: LibrariesParams): Promise<LibrariesResponse>
  getFavorites(): Promise<FavoritesResponse>
  updateFavorite(params: FavoriteParams): Promise<ApiResult>
  getHistories(): Promise<HistoriesResponse>
  updatePlayProgress(params: PlayProgressParams): Promise<ApiResult>
  updatePlayEnd(params: PlayEndParams): Promise<ApiResult>
  getMe(): Promise<MeResponse>
}

export interface ApiResult {
  result: number
}

/* =========================
 * 認証
 * ========================= */

export type LoginParams = {
  friend_id: string
  friend_pw: string
  tenant_code: string
  device_token: string
  device_uuid: string
}

export type AuthResponse = ApiResult & {
  token: string
}

export type Tenant = {
  tenant_id: string
  name: string
  code: string
  is_active: boolean
}

export type MeResponse = ApiResult & {
  user_id: string
  user_name: string
  email: string
  tenants: Tenant[]
}

export type SettingsResponse = ApiResult & {
  header_light: string
  header_dark: string
  categories: {
    category_id: number
    name: string
  }[]
}

/* =========================
 * 共通ドメイン
 * ========================= */

export interface SeriesSummary {
  series_id: number
  img: string
  num_total: number
  num_comp: number
  category: string
  title: string
}

export interface SeriesSummaryDetail extends SeriesSummary {
  description: string
  duration: number
}

export interface SeriesPlaybackSummary extends SeriesSummary {
  item_id: number
  progress: number
}

export interface EpisodeSummary {
  series_id: number
  item_id: number
  img: string
  num_times: number
  category: string
  title: string
  description: string
  duration: number
}

export interface PlaybackHistoryItem {
  series_id: number
  item_id: number
  url: string
  img: string
  title_series: string
  title_media: string
  duration: number
  progress: number
  date: string
}

export interface ApiChapter {
  title: string
  position: number
}

export interface SeriesMedia {
  item_id: number
  type_media: 0 | 1 | 2
  url: string
  img: string
  title: string
  content?: string
  duration: number
  progress: number
  chapters?: ApiChapter[]
  units?: Omit<SeriesMedia, 'units'>[]
  // アプリ側で設定。unit > 親episode、episode > 親シリーズのタイトルが入る
  parentTitle: string
}

/* =========================
 * ホーム
 * ========================= */

export interface HomeNewsItem {
  series_id: number
  item_id: number
  img: string
  num_total: number
  category: string
  title: string
}

export interface HomeResponse extends ApiResult {
  recommends: SeriesSummaryDetail[]
  recents: SeriesPlaybackSummary[]
  news: HomeNewsItem[]
  histories: PlaybackHistoryItem[]
}

/* =========================
 * シリーズ
 * ========================= */

export interface SeriesResponse extends ApiResult, SeriesSummaryDetail {
  type_media: 0 | 1 | 2
  url: string
  progress: number
  chapters?: ApiChapter[]
  episodes: SeriesMedia[]
}

/* =========================
 * ライブラリ
 * ========================= */

export type LibrariesParams = {
  type: number
  order: number
  asc: number
  category?: number
  keyword?: string
}

export interface LibraryItem extends SeriesSummaryDetail {
  num_times: number
  is_favorite: boolean
}

export interface LibrariesResponse extends ApiResult {
  libraries: LibraryItem[]
}

/* =========================
 * お気に入り
 * ========================= */

export interface FavoriteSeriesItem extends SeriesSummaryDetail {
  num_times: number
}

export interface FavoritesResponse extends ApiResult {
  series: FavoriteSeriesItem[]
  episodes: EpisodeSummary[]
}

export type FavoriteParams = {
  series_id: number
  item_id: number
  enabled: number
}

/* =========================
 * 履歴
 * ========================= */

export interface HistoriesResponse extends ApiResult {
  histories: PlaybackHistoryItem[]
}

/* =========================
 * 再生
 * ========================= */

export type PlayProgressParams = {
  series_id: number
  item_id: number
  progress: number
}

export type PlayEndParams = {
  series_id: number
  item_id: number
}
