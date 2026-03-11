export type ApiError = {
  message: string
  statusCode?: number
  code?: string
  details?: unknown
}

export const createApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: (error as { statusCode?: number }).statusCode,
      code: (error as { code?: string }).code,
      details: error,
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  return {
    message: 'An unknown error occurred',
    details: error,
  }
}

export class ApiException extends Error {
  statusCode?: number
  code?: string
  details?: unknown

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiException'
    this.statusCode = error.statusCode
    this.code = error.code
    this.details = error.details
  }
}

export enum ApiResultCode {
  Success = 1,
  ErrorWithAlert = 2,
  ErrorNoAlert = 3,
  TokenError = 4,
}

export type ApiResponse<T = unknown> = {
  result: ApiResultCode
  title?: string
  message?: string
  data?: T
}

export class ApiResponseException extends Error {
  result: ApiResultCode
  title?: string

  constructor(result: ApiResultCode, title?: string, message?: string) {
    super(message || 'API response error')
    this.name = 'ApiResponseException'
    this.result = result
    this.title = title
  }
}

export class AppVersionException extends Error {
  necessaryVersion: string

  constructor(necessaryVersion: string) {
    super('App update required')
    this.name = 'AppVersionException'
    this.necessaryVersion = necessaryVersion
  }
}
