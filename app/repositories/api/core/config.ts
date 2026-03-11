import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api' : 'https://api.example.com/api'
const API_TIMEOUT = 30000

export const getDeviceHeaders = () => ({
  'x-os-name': Platform.OS,
  'x-os-version': DeviceInfo.getSystemVersion(),
  'x-app-version': DeviceInfo.getVersion(),
})

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
}
