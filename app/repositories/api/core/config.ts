import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

const DEFAULT_SERVER_ID = 'd3'

export const buildApiBaseUrl = (serverId?: string | null) =>
  `https://${serverId ?? DEFAULT_SERVER_ID}.lseed.jp/api/app`

const API_TIMEOUT = 30000

export const getDeviceHeaders = () => ({
  'x-os-name': Platform.OS,
  'x-os-version': DeviceInfo.getSystemVersion(),
  'x-app-version': DeviceInfo.getVersion(),
})

const OAUTH_HOST = 'login.lseed.app'
const OAUTH_CALLBACK_PATH = '/app/lstream'

// ログインサーバー（oauth・Passport）。ログイン・トークン更新・ログアウト・テナント追加で共通に使う
export const OAUTH_CONFIG = {
  host: OAUTH_HOST,
  baseURL: `https://${OAUTH_HOST}`,
  clientId: '019e9136-9104-71f2-bca4-a7bbdb2fb91d',
  callbackPath: OAUTH_CALLBACK_PATH,
  redirectUri: `https://${OAUTH_HOST}${OAUTH_CALLBACK_PATH}`,
}

export const API_CONFIG = {
  baseURL: buildApiBaseUrl(),
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
}
