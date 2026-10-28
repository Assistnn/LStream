import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'

export type AuthTokens = { accessToken: string; refreshToken: string | null }

const KEYCHAIN_OPTIONS = {
  service: 'jp.lseed.lstream.auth',
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
}

// AsyncStorage はアプリの削除で消えるが iOS の Keychain は残るため、この印が無ければ再インストール直後とみなす
const INSTALLED_KEY = 'authStorageInstalled'

// 以前のバージョンが AsyncStorage に平文で保存していたキー
const LEGACY_ACCESS_TOKEN_KEYS = ['auth_token', 'authToken']
const LEGACY_REFRESH_TOKEN_KEY = 'refresh_token'

let cache: AuthTokens | null | undefined
let loading: Promise<AuthTokens | null> | null = null

const writeKeychain = async (tokens: AuthTokens) => {
  await Keychain.setGenericPassword('lstream', JSON.stringify(tokens), KEYCHAIN_OPTIONS)
}

const load = async (): Promise<AuthTokens | null> => {
  try {
    if (!(await AsyncStorage.getItem(INSTALLED_KEY))) {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_OPTIONS.service })

      const legacy = Object.fromEntries(
        await AsyncStorage.multiGet([...LEGACY_ACCESS_TOKEN_KEYS, LEGACY_REFRESH_TOKEN_KEY]),
      )
      const legacyAccessToken = LEGACY_ACCESS_TOKEN_KEYS.map((key) => legacy[key]).find(Boolean)
      if (legacyAccessToken) {
        await writeKeychain({ accessToken: legacyAccessToken, refreshToken: legacy[LEGACY_REFRESH_TOKEN_KEY] ?? null })
      }
      await AsyncStorage.multiRemove([...LEGACY_ACCESS_TOKEN_KEYS, LEGACY_REFRESH_TOKEN_KEY])
      await AsyncStorage.setItem(INSTALLED_KEY, '1')
    }

    const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_OPTIONS.service })
    if (!credentials) return null
    const tokens = JSON.parse(credentials.password) as AuthTokens
    return tokens.accessToken ? tokens : null
  } catch (error) {
    console.error('Failed to load auth tokens:', error)
    return null
  }
}

// アクセストークンとリフレッシュトークンを iOS の Keychain・Android の Keystore で暗号化して保存する。
// 読み出しは毎回 Keychain を開かないよう、メモリにも持つ。
export const tokenStorage = {
  async get() {
    if (cache !== undefined) return cache
    loading ??= load()
    const loaded = await loading
    loading = null
    // 読み込み中に set / clear された場合は、そちらを正とする
    if (cache === undefined) cache = loaded
    return cache
  },

  async set(tokens: AuthTokens) {
    cache = tokens
    try {
      await writeKeychain(tokens)
    } catch (error) {
      console.error('Failed to save auth tokens:', error)
    }
  },

  async clear() {
    cache = null
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_OPTIONS.service })
    } catch (error) {
      console.error('Failed to clear auth tokens:', error)
    }
  },
}
