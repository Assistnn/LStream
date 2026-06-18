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

export const API_CONFIG = {
  baseURL: buildApiBaseUrl(),
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
}
