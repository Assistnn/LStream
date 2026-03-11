import AsyncStorage from '@react-native-async-storage/async-storage'
import DeviceInfo from 'react-native-device-info'

import { API_CONFIG, getDeviceHeaders } from './config'
import type { ApiResponse } from './errors'
import { ApiException, ApiResponseException, ApiResultCode, AppVersionException, createApiError } from './errors'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  requiresAuth?: boolean
}

class ApiClient {
  private baseURL: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
    this.defaultHeaders = API_CONFIG.headers
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get token:', error)
      return null
    }
  }

  async setToken(token: string) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('Failed to set token:', error)
    }
  }

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get refresh token:', error)
      return null
    }
  }

  async setRefreshToken(token: string) {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token)
    } catch (error) {
      console.error('Failed to set refresh token:', error)
    }
  }

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY])
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, requiresAuth = true } = config

    const url = `${this.baseURL}${endpoint}`
    const deviceHeaders = await getDeviceHeaders()
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...deviceHeaders,
      ...headers,
    }

    if (requiresAuth) {
      const token = await this.getToken()
      if (token) {
        requestHeaders['x-app-token'] = token
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const necessaryVersion = response.headers.get('x-app-necessary-version')
      if (necessaryVersion) {
        const currentVersion = DeviceInfo.getVersion()
        const v1Parts = currentVersion.split('.').map(Number)
        const v2Parts = necessaryVersion.split('.').map(Number)
        const maxLength = Math.max(v1Parts.length, v2Parts.length)
        let versionComparison = 0
        for (let i = 0; i < maxLength; i++) {
          const v1 = v1Parts[i] || 0
          const v2 = v2Parts[i] || 0
          if (v1 > v2) {
            versionComparison = 1
            break
          }
          if (v1 < v2) {
            versionComparison = -1
            break
          }
        }
        if (versionComparison < 0) {
          throw new AppVersionException(necessaryVersion)
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // ignore
        }

        throw new ApiException({
          message: errorMessage,
          statusCode: response.status,
        })
      }

      if (response.status === 204) {
        return undefined as T
      }

      const data: ApiResponse<T> = await response.json()

      switch (data.result) {
        case ApiResultCode.Success:
          return data.data as T

        case ApiResultCode.ErrorWithAlert:
          throw new ApiResponseException(ApiResultCode.ErrorWithAlert, data.title, data.message)

        case ApiResultCode.ErrorNoAlert:
          throw new ApiResponseException(ApiResultCode.ErrorNoAlert, data.title, data.message)

        case ApiResultCode.TokenError: {
          const refreshed = await this.refreshToken()
          if (refreshed) {
            return this.request<T>(endpoint, config)
          }
          throw new ApiResponseException(ApiResultCode.TokenError, undefined, 'Token error or expired')
        }

        default:
          throw new ApiException({
            message: 'Unknown result code',
            code: 'UNKNOWN_RESULT',
          })
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (
        error instanceof ApiException ||
        error instanceof ApiResponseException ||
        error instanceof AppVersionException
      ) {
        throw error
      }

      if ((error as Error).name === 'AbortError') {
        throw new ApiException({
          message: 'Request timeout',
          code: 'TIMEOUT',
        })
      }

      throw new ApiException(createApiError(error))
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken()
      if (!refreshToken) {
        return false
      }

      const response = await this.request<{ token: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        requiresAuth: false,
      })

      await this.setToken(response.token)
      await this.setRefreshToken(response.refreshToken)
      return true
    } catch (error) {
      console.error('Failed to refresh token:', error)
      await this.clearTokens()
      return false
    }
  }

  async get<T>(endpoint: string, requiresAuth = true) {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth })
  }

  async post<T>(endpoint: string, body?: unknown, requiresAuth = true) {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth })
  }

  async put<T>(endpoint: string, body?: unknown, requiresAuth = true) {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth })
  }

  async patch<T>(endpoint: string, body?: unknown, requiresAuth = true) {
    return this.request<T>(endpoint, { method: 'PATCH', body, requiresAuth })
  }

  async delete<T>(endpoint: string, requiresAuth = true) {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth })
  }
}

export const apiClient = new ApiClient()
