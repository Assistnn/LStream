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
  getSettings: 'real',
  getHome: 'real',
  getSeries: 'real',
  getLibraries: 'real',
  getFavorites: 'real',
  updateFavorite: 'real',
  getHistories: 'real',
  updatePlayProgress: 'real',
  updatePlayEnd: 'real',
  getMe: 'mock',
}
