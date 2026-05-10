import { apiClient } from './core/client'
import type {
  ApiResult,
  AuthResponse,
  FavoriteParams,
  FavoritesResponse,
  HistoriesResponse,
  HomeResponse,
  IApiRepository,
  LibrariesParams,
  LibrariesResponse,
  LoginParams,
  MeResponse,
  PlayEndParams,
  PlayProgressParams,
  SeriesResponse,
  SettingsResponse,
} from './IApiRepository'

export class ApiRepository implements IApiRepository {
  async isAuthenticated() {
    const token = await apiClient.getToken()
    return !!token
  }
  async refreshToken() {
    return apiClient.refreshToken()
  }

  async login(credentials: LoginParams) {
    const response = await apiClient.post<AuthResponse>('/friend_login', credentials, false)
    if (response.result === 1) {
      await apiClient.setToken(response.token)
    }
    return response
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout', undefined, true)
    } finally {
      await apiClient.clearTokens()
    }
  }

  async getSettings() {
    return apiClient.get<SettingsResponse>('/str_settings')
  }

  async getHome() {
    return apiClient.get<HomeResponse>('/str_home')
  }

  async getSeries(seriesId: number) {
    const data = await apiClient.get<SeriesResponse>(`/str_series?series_id=${seriesId}`)
    data.episodes = data.episodes.map((ep) => ({
      ...ep,
      parentTitle: data.title,
      units: ep.units?.map((u) => ({ ...u, parentTitle: ep.title })),
    }))
    return data
  }

  async getLibraries(params: LibrariesParams) {
    const queryParams = new URLSearchParams({
      type: params.type.toString(),
      order: params.order.toString(),
      asc: params.asc.toString(),
      ...(params.category && { category: params.category.toString() }),
      ...(params.keyword && { keyword: params.keyword }),
    })
    return apiClient.get<LibrariesResponse>(`/str_libraries?${queryParams.toString()}`)
  }

  async getFavorites() {
    return apiClient.get<FavoritesResponse>('/str_favorites')
  }

  async updateFavorite(params: FavoriteParams) {
    return apiClient.post<ApiResult>('/str_favorite', params)
  }

  async getHistories() {
    return apiClient.get<HistoriesResponse>('/str_histories')
  }

  async updatePlayProgress(params: PlayProgressParams) {
    return apiClient.post<ApiResult>('/str_play_progress', params)
  }

  async updatePlayEnd(params: PlayEndParams) {
    return apiClient.post<ApiResult>('/str_play_end', params)
  }

  async getMe() {
    return apiClient.get<MeResponse>('/me')
  }
}
