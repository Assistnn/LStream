import type { IApiRepository } from './IApiRepository'

type ApiMode = 'real' | 'mock'
type ApiMethodConfig = {
  [K in keyof IApiRepository]: ApiMode
}

export const API_METHOD_CONFIG: ApiMethodConfig = {
  isAuthenticated: 'mock',
  refreshToken: 'mock',
  login: 'mock',
  logout: 'mock',
  getSettings: 'mock',
  getHome: 'mock',
  getSeries: 'mock',
  getLibraries: 'mock',
  getFavorites: 'mock',
  getHistories: 'mock',
  updatePlayProgress: 'mock',
  updatePlayEnd: 'mock',
  updateFavorite: 'mock',
}
