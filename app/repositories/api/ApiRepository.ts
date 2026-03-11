import { apiClient } from './core/client'
import type {
  AuthResponse,
  Episode,
  HistoryItem,
  HomeData,
  IApiRepository,
  LibraryItem,
  LoginCredentials,
  SeriesDetail,
} from './IApiRepository'

export class ApiRepository implements IApiRepository {
  async isAuthenticated() {
    const token = await apiClient.getToken()
    return !!token
  }
  async refreshToken() {
    return apiClient.refreshToken()
  }

  async getMe() {
    return apiClient.get<AuthResponse['user']>('/auth/me')
  }

  async login(credentials: LoginCredentials) {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, false)
    await apiClient.setToken(response.token)
    await apiClient.setRefreshToken(response.refreshToken)
    return response
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout', undefined, true)
    } finally {
      await apiClient.clearTokens()
    }
  }

  async getHomeData() {
    return apiClient.get<HomeData>('/api/home')
  }

  async getNewArrivals() {
    return apiClient.get<Episode[]>('/api/episodes/new-arrivals')
  }

  async getFavoriteSeries() {
    return apiClient.get<SeriesDetail[]>('/api/favorites/series')
  }

  async getFavoriteEpisodes() {
    return apiClient.get<Episode[]>('/api/favorites/episodes')
  }

  async getHistory() {
    return apiClient.get<HistoryItem[]>('/api/history')
  }

  async getLibrary() {
    return apiClient.get<LibraryItem[]>('/api/library')
  }
}
