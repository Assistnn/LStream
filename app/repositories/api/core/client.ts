import NetInfo from '@react-native-community/netinfo'
import { Alert } from 'react-native'
import DeviceInfo from 'react-native-device-info'

import type { AuthTokens } from '../../auth/tokenStorage'
import { tokenStorage } from '../../auth/tokenStorage'
import { StorageRepository } from '../../storage'
import { API_CONFIG, buildApiBaseUrl, getDeviceHeaders, OAUTH_CONFIG } from './config'
import type { ApiResponse } from './errors'
import { ApiException, ApiResponseException, ApiResultCode, AppVersionException, createApiError } from './errors'

type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  requiresAuth?: boolean
  retriedAfterTokenError?: boolean
}

// oauth/token の応答。tenants はログインサーバーが付け足す連携済みテナントの一覧
export type OAuthTokenResponse = {
  access_token?: string
  refresh_token?: string
  tenants?: unknown[]
}

type AuthListener = {
  // トークンを更新できたとき（最新のテナント一覧つき）
  onTokensRefreshed: (tenants: unknown[]) => void
  // リフレッシュトークンも無効で、再ログインが必要になったとき
  onSessionExpired: () => void
}

class ApiClient {
  private baseURL: string
  private timeout: number
  private defaultHeaders: Record<string, string>
  private ready: boolean
  private friendId: string | null
  private refreshing: Promise<boolean> | null = null
  private authListener: AuthListener | null = null

  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
    this.defaultHeaders = API_CONFIG.headers
    this.ready = false
    this.friendId = null
  }

  setActiveServerId(serverId: string | null) {
    this.baseURL = buildApiBaseUrl(serverId)
    this.ready = true
  }

  setActiveFriendId(friendId: number | null) {
    this.friendId = friendId === null ? null : String(friendId)
  }

  setAuthListener(listener: AuthListener | null) {
    this.authListener = listener
  }

  async getToken() {
    return (await tokenStorage.get())?.accessToken ?? null
  }

  async getRefreshToken() {
    return (await tokenStorage.get())?.refreshToken ?? null
  }

  async setTokens(tokens: AuthTokens) {
    await tokenStorage.set(tokens)
  }

  async clearTokens() {
    await tokenStorage.clear()
  }

  // ログインサーバーで、リフレッシュトークンから新しいトークンを受け取る。
  // 同時に何件のリクエストが期限切れになっても、更新は1回だけ行う（Passport は更新のたびに古いトークンを失効させるため）。
  refreshToken() {
    this.refreshing ??= this.requestNewTokens().finally(() => {
      this.refreshing = null
    })
    return this.refreshing
  }

  private async requestNewTokens() {
    const refreshToken = await this.getRefreshToken()
    if (!refreshToken) return false

    let response: Response
    try {
      response = await fetch(`${OAUTH_CONFIG.baseURL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: OAUTH_CONFIG.clientId,
          refresh_token: refreshToken,
        }).toString(),
      })
    } catch (error) {
      // 通信できないだけならトークンは残し、次の機会にやり直す
      console.warn('Failed to refresh token:', error)
      return false
    }

    const tokenResponse = (await response.json().catch(() => ({}))) as OAuthTokenResponse
    if (!response.ok || !tokenResponse.access_token) {
      // リフレッシュトークンが期限切れ・失効（invalid_grant 等）なら再ログインが必要（混雑による 429 は除く）
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        await this.clearTokens()
        this.authListener?.onSessionExpired()
      }
      return false
    }

    await this.setTokens({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? refreshToken,
    })
    this.authListener?.onTokensRefreshed(tokenResponse.tenants ?? [])
    return true
  }

  // ログアウト時に、この端末のトークンをログインサーバーで失効させる（他の端末は残る）
  async revokeTokens() {
    const revoke = async () => {
      const token = await this.getToken()
      if (!token) return true
      const response = await fetch(`${OAUTH_CONFIG.baseURL}/api/token/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
      return response.status !== 401
    }
    try {
      // アクセストークンの期限が切れていたら、更新してから失効させる
      if (!(await revoke()) && (await this.refreshToken())) {
        await revoke()
      }
    } catch (error) {
      console.warn('Failed to revoke token:', error)
    }
  }

  // 期限切れ・失効（result=4）のとき、新しいトークンで1回だけやり直す
  private async retryAfterTokenError<T>(endpoint: string, config: RequestConfig, sentToken: string | undefined) {
    if (config.retriedAfterTokenError) return null
    // 送ったあとに別のリクエストがトークンを更新していれば、更新せずにそのトークンでやり直す
    const currentToken = await this.getToken()
    const canRetry = (currentToken !== null && currentToken !== sentToken) || (await this.refreshToken())
    return canRetry ? this.request<T>(endpoint, { ...config, retriedAfterTokenError: true }) : null
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    if (!this.ready) {
      throw new ApiException({
        message: 'API client is not initialized. Active tenant must be set before making requests.',
        code: 'NOT_INITIALIZED',
      })
    }
    const { method = 'GET', headers = {}, body, requiresAuth = true } = config

    const mobileDataEnabled = await StorageRepository.getMobileDataEnabled()
    if (!mobileDataEnabled) {
      const state = await NetInfo.fetch()
      if (state.type === 'cellular') {
        Alert.alert(
          'モバイルデータ通信',
          'Wi-Fi接続時のみ利用できます。設定からモバイルデータの使用を有効にしてください。',
        )
        throw new ApiException({ message: 'Mobile data is disabled', code: 'MOBILE_DATA_DISABLED' })
      }
    }

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

    if (this.friendId) {
      requestHeaders['x-app-id'] = this.friendId
    }

    if (__DEV__) {
      console.log('[API Request]', {
        method,
        endpoint,
        url,
        headers: { ...requestHeaders, ...(requestHeaders['x-app-token'] ? { 'x-app-token': '***' } : {}) },
        body,
        requiresAuth,
      })
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

      if (__DEV__) {
        console.log('[API Response:raw]', {
          method,
          endpoint,
          status: response.status,
          ok: response.ok,
        })
      }

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
        // LSEED はトークンの期限切れ・失効を HTTP 400 + result=4 で返す
        let tokenErrorData: ApiResponse<unknown> | null = null
        try {
          const errorData = await response.json()
          if (__DEV__) {
            console.log('[API Response:error]', {
              method,
              endpoint,
              status: response.status,
              data: errorData,
            })
          }

          if (errorData.result === ApiResultCode.TokenError) {
            tokenErrorData = errorData
          } else if (errorData.result !== undefined) {
            throw new ApiResponseException(errorData.result, errorData.title, errorData.message)
          }

          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (error) {
          if (error instanceof ApiResponseException) {
            throw error
          }
        }

        if (tokenErrorData) {
          const retried = await this.retryAfterTokenError<T>(endpoint, config, requestHeaders['x-app-token'])
          if (retried !== null) return retried
          throw new ApiResponseException(ApiResultCode.TokenError, tokenErrorData.title, tokenErrorData.message)
        }

        throw new ApiException({
          message: errorMessage,
          statusCode: response.status,
        })
      }

      if (response.status === 204) {
        if (__DEV__) {
          console.log('[API Response:success]', {
            method,
            endpoint,
            status: response.status,
            data: null,
          })
        }
        return undefined as T
      }

      const data: ApiResponse<T> = await response.json()
      if (__DEV__) {
        console.log('[API Response:success]', {
          method,
          endpoint,
          status: response.status,
          data,
        })
      }

      switch (data.result) {
        case ApiResultCode.Success:
          return data.data === undefined ? (data as T) : data.data

        case ApiResultCode.ErrorWithAlert:
          throw new ApiResponseException(ApiResultCode.ErrorWithAlert, data.title, data.message)

        case ApiResultCode.ErrorNoAlert:
          throw new ApiResponseException(ApiResultCode.ErrorNoAlert, data.title, data.message)

        case ApiResultCode.TokenError: {
          const retried = await this.retryAfterTokenError<T>(endpoint, config, requestHeaders['x-app-token'])
          if (retried !== null) return retried
          throw new ApiResponseException(ApiResultCode.TokenError, data.title, data.message)
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
