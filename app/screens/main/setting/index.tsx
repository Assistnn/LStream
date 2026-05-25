import notifee, { AuthorizationStatus } from '@notifee/react-native'
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Gauge,
  HelpCircle,
  History,
  Info,
  LogOut,
  Palette,
  Repeat,
  Settings as SettingsIcon,
  Trash2,
  User,
  Wifi,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  Alert,
  Linking,
  Modal,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { PageTitle } from '../../../components/ui/PageTitle'
import { syncAllAlarms } from '../../../hooks/alarmService'
import { useAuth } from '../../../hooks/AuthContext'
import type { ThemeMode } from '../../../hooks/ThemeContext'
import { useTheme } from '../../../hooks/ThemeContext'
import packageJson from '../../../package.json'
import { PlaylistRepository } from '../../../repositories/playlist'
import type { LoopMode } from '../../../repositories/storage'
import { StorageRepository } from '../../../repositories/storage'
import { clearFavoritesCache } from '../../../usecases/useGetFavorites'
import { clearSettingsCache } from '../../../usecases/useSettings'
import { AccountModal } from '../home/components/AccountModal'
import { AddTenantModal } from '../home/components/AddTenantModal'

const WebAuthSessionModule = (TurboModuleRegistry.get('WebAuthSessionModule') ??
  NativeModules.WebAuthSessionModule) as {
  openAuthSession: (url: string, host: string, path: string) => Promise<string>
}

const ICON_SIZE = 20
const ICON_BG_SIZE = 32

type SettingItem =
  | {
      icon: React.ComponentType<{ color: string; size: number }>
      label: string
      isToggle: true
      toggleValue: boolean
      onToggle: (value: boolean) => void
    }
  | {
      icon: React.ComponentType<{ color: string; size: number }>
      label: string
      isToggle?: false
      value?: string
      onPress?: () => void
    }

export const SettingsTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { themeMode, styles, colors, spacing, setThemeMode } = useTheme()
  const { signOut } = useAuth()

  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showNextEpisode, setShowNextEpisode] = useState(true)
  const [showHistoryRetentionMenu, setShowHistoryRetentionMenu] = useState(false)
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [mobileDataEnabled, setMobileDataEnabled] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showLoopMenu, setShowLoopMenu] = useState(false)
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [loopMode, setLoopMode] = useState<LoopMode>('off')
  const [sleepTimer, setSleepTimer] = useState<number | undefined>(undefined)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await StorageRepository.getAllSettings()
      setShowNextEpisode(settings.showNextEpisode)
      setHistoryRetentionDays(settings.historyRetentionDays)
      setMobileDataEnabled(settings.mobileDataEnabled)
      const playerSettings = await StorageRepository.getPlayerSettings()
      setPlaybackRate(playerSettings.playbackRate)
      setLoopMode(playerSettings.loopMode)
      const notifSettings = await notifee.getNotificationSettings()
      const isAuthorized =
        notifSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        notifSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      setNotificationsEnabled(isAuthorized && settings.notificationsEnabled)
    }
    void loadSettings()
  }, [])

  const toggleNextEpisode = async (value: boolean) => {
    setShowNextEpisode(value)
    await StorageRepository.setShowNextEpisode(value)
  }

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const notifSettings = await notifee.getNotificationSettings()
      if (
        notifSettings.authorizationStatus === AuthorizationStatus.DENIED ||
        notifSettings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED
      ) {
        const permission = await notifee.requestPermission()
        if (permission.authorizationStatus === AuthorizationStatus.DENIED) {
          Alert.alert('通知が許可されていません', '端末の設定から通知を有効にしてください', [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '設定を開く',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  void Linking.openURL('app-settings:')
                } else {
                  void Linking.openSettings()
                }
              },
            },
          ])
          return
        }
      }
    }
    setNotificationsEnabled(value)
    await StorageRepository.setNotificationsEnabled(value)
    const playlists = await PlaylistRepository.getPlaylists()
    await syncAllAlarms(playlists)
  }

  const toggleMobileData = async (value: boolean) => {
    setMobileDataEnabled(value)
    await StorageRepository.setMobileDataEnabled(value)
  }

  const updateHistoryRetention = async (days: number) => {
    setHistoryRetentionDays(days)
    setShowHistoryRetentionMenu(false)
    await StorageRepository.setHistoryRetentionDays(days)
  }

  const clearCache = () => {
    Alert.alert('キャッシュを削除', 'キャッシュを削除してもよろしいですか?', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '実行',
        style: 'destructive',
        onPress: async () => {
          try {
            await NativeModules.CacheManagerModule.clearHttpCache()
            clearSettingsCache()
            clearFavoritesCache()
            Alert.alert('完了', 'キャッシュを削除しました')
          } catch {
            Alert.alert('エラー', 'キャッシュの削除に失敗しました')
          }
        },
      },
    ])
  }

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('エラー', 'このURLを開くことができません')
      }
    } catch (error) {
      console.error('Failed to open URL:', error)
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました')
    }
  }

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: 'ライトモード' },
    { value: 'dark', label: 'ダークモード' },
    { value: 'system', label: 'システムに合わせる' },
  ]

  const historyRetentionOptions = [
    { value: 30, label: '30日' },
    { value: 45, label: '45日' },
    { value: 60, label: '60日' },
    { value: 75, label: '75日' },
    { value: 90, label: '90日' },
  ]

  const speedOptions = [
    { value: 0.75, label: '0.75x' },
    { value: 1.0, label: '1.0x' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 2.0, label: '2.0x' },
  ]

  const loopOptions: Array<{ value: LoopMode; label: string }> = [
    { value: 'off', label: 'オフ' },
    { value: 'single', label: '1メディアリピート' },
    { value: 'all', label: '全メディアリピート' },
  ]

  const timerOptions = [
    { value: undefined as number | undefined, label: 'なし' },
    { value: 15, label: '15分' },
    { value: 30, label: '30分' },
    { value: 60, label: '1時間' },
    { value: 120, label: '2時間' },
    { value: 240, label: '4時間' },
  ]

  const updatePlaybackRate = async (rate: number) => {
    setPlaybackRate(rate)
    setShowSpeedMenu(false)
    await StorageRepository.setPlaybackRate(rate)
  }

  const updateLoopMode = async (mode: LoopMode) => {
    setLoopMode(mode)
    setShowLoopMenu(false)
    await StorageRepository.setLoopMode(mode)
  }

  const updateSleepTimer = async (value: number | undefined) => {
    setSleepTimer(value)
    setShowTimerMenu(false)
    await StorageRepository.setDefaultSleepTimer(value)
  }

  const getThemeLabel = () => {
    return themeOptions.find((opt) => opt.value === themeMode)?.label || 'システムに合わせる'
  }

  const settingsGroups: Array<{ title: string; items: SettingItem[] }> = [
    {
      title: 'カラー・テーマ',
      items: [
        {
          icon: Palette,
          label: 'テーマ',
          value: getThemeLabel(),
          onPress: () => setShowThemeMenu(true),
        },
      ],
    },
    {
      title: '表示設定',
      items: [
        {
          icon: Eye,
          label: '次のエピソードを表示',
          isToggle: true,
          toggleValue: showNextEpisode,
          onToggle: toggleNextEpisode,
        },
        {
          icon: Bell,
          label: '通知を有効にする',
          isToggle: true,
          toggleValue: notificationsEnabled,
          onToggle: toggleNotifications,
        },
        {
          icon: Wifi,
          label: 'モバイルデータを使用する',
          isToggle: true,
          toggleValue: mobileDataEnabled,
          onToggle: toggleMobileData,
        },
      ],
    },
    {
      title: '再生設定',
      items: [
        {
          icon: Gauge,
          label: 'デフォルト再生速度',
          value: `${playbackRate}x`,
          onPress: () => setShowSpeedMenu(true),
        },
        {
          icon: Repeat,
          label: 'デフォルトループ',
          value: loopOptions.find((o) => o.value === loopMode)?.label ?? 'オフ',
          onPress: () => setShowLoopMenu(true),
        },
        {
          icon: Clock,
          label: 'デフォルトタイマー',
          value: timerOptions.find((o) => o.value === sleepTimer)?.label ?? 'なし',
          onPress: () => setShowTimerMenu(true),
        },
      ],
    },
    {
      title: '履歴',
      items: [
        {
          icon: History,
          label: '履歴の保持期間',
          value: `${historyRetentionDays}日`,
          onPress: () => setShowHistoryRetentionMenu(true),
        },
        {
          icon: Trash2,
          label: 'キャッシュを削除',
          onPress: clearCache,
        },
      ],
    },
    {
      title: 'アカウント',
      items: [
        {
          icon: User,
          label: 'アカウント情報',
          onPress: () => setShowAccountModal(true),
        },
        {
          icon: LogOut,
          label: 'ログアウト',
          onPress: () =>
            Alert.alert('ログアウト', '本当にログアウトしますか？', [
              { text: 'キャンセル', style: 'cancel' },
              { text: 'ログアウト', style: 'destructive', onPress: () => void signOut() },
            ]),
        },
      ],
    },
    {
      title: 'サポート',
      items: [
        {
          icon: HelpCircle,
          label: 'ヘルプ',
          onPress: () => openUrl('https://www.google.com'),
        },
        {
          icon: FileText,
          label: '利用規約',
          onPress: () => openUrl('https://yahoo.co.jp'),
        },
        {
          icon: Info,
          label: 'アプリ情報',
          value: `v${packageJson.version}`,
        },
      ],
    },
  ]

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        <PageTitle icon={SettingsIcon} title='Settings' />
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={{ marginBottom: spacing['3xl'] }}>
            <Text
              style={[
                styles.textDefault,
                {
                  marginBottom: spacing.md,
                  paddingHorizontal: spacing.lg,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                },
              ]}
            >
              {group.title}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon
                const isLast = itemIndex === group.items.length - 1

                if (item.isToggle) {
                  return (
                    <View
                      key={itemIndex}
                      style={[
                        localStyles.settingItem,
                        { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[localStyles.iconBg, { backgroundColor: colors.muted }]}>
                        <Icon color={colors.text} size={ICON_SIZE} />
                      </View>
                      <Text style={[styles.textDefault, { flex: 1 }]}>{item.label}</Text>
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.muted, true: colors.primary }}
                        thumbColor='#FFFFFF'
                      />
                    </View>
                  )
                }

                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      localStyles.settingItem,
                      { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border },
                    ]}
                    onPress={item.onPress}
                    disabled={!item.onPress}
                  >
                    <View style={[localStyles.iconBg, { backgroundColor: colors.muted }]}>
                      <Icon color={colors.text} size={ICON_SIZE} />
                    </View>
                    <Text style={[styles.textDefault, { flex: 1 }]}>{item.label}</Text>
                    {item.value && <Text style={styles.bodySmall}>{item.value}</Text>}
                    {item.onPress && <ChevronRight color={colors.textSecondary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg }}>
          <Text style={styles.bodySmall}>Learning Player App</Text>
          <Text style={[styles.bodySmall, { marginTop: spacing.xs }]}>© 2026 All rights reserved</Text>
        </View>
      </ScrollView>

      <Modal visible={showThemeMenu} transparent animationType='fade' onRequestClose={() => setShowThemeMenu(false)}>
        <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeMenu(false)}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[localStyles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.titleLarge, { marginBottom: 0 }]}>テーマを選択</Text>
            </View>
            <View style={{ padding: spacing.sm }}>
              {themeOptions.map((option) => {
                const isActive = themeMode === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[localStyles.modalItem, isActive && { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setThemeMode(option.value)
                      setShowThemeMenu(false)
                    }}
                  >
                    <Text style={styles.textDefault}>{option.label}</Text>
                    {isActive && <Check color={colors.primary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={[localStyles.modalFooter]}>
              <TouchableOpacity style={localStyles.cancelButton} onPress={() => setShowThemeMenu(false)}>
                <Text style={styles.bodySmall}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showHistoryRetentionMenu}
        transparent
        animationType='fade'
        onRequestClose={() => setShowHistoryRetentionMenu(false)}
      >
        <TouchableOpacity
          style={localStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHistoryRetentionMenu(false)}
        >
          <View style={[localStyles.modalContent, { backgroundColor: colors.card }]}>
            <View style={localStyles.modalHeader}>
              <Text style={[{ marginBottom: 0 }]}>履歴の保持期間を選択</Text>
            </View>
            <View style={{ padding: spacing.sm }}>
              {historyRetentionOptions.map((option) => {
                const isActive = historyRetentionDays === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[localStyles.modalItem, isActive && { backgroundColor: colors.primary }]}
                    onPress={() => updateHistoryRetention(option.value)}
                  >
                    <Text style={styles.textDefault}>{option.label}</Text>
                    {isActive && <Check color={colors.primary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={[localStyles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={localStyles.cancelButton} onPress={() => setShowHistoryRetentionMenu(false)}>
                <Text style={styles.bodySmall}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSpeedMenu} transparent animationType='fade' onRequestClose={() => setShowSpeedMenu(false)}>
        <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setShowSpeedMenu(false)}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.card }]}>
            <View style={localStyles.modalHeader}>
              <Text style={[styles.titleLarge, { marginBottom: 0 }]}>デフォルト再生速度</Text>
            </View>
            <View style={{ padding: spacing.sm }}>
              {speedOptions.map((option) => {
                const isActive = playbackRate === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[localStyles.modalItem, isActive && { backgroundColor: colors.primary }]}
                    onPress={() => updatePlaybackRate(option.value)}
                  >
                    <Text style={styles.textDefault}>{option.label}</Text>
                    {isActive && <Check color={colors.primary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={localStyles.modalFooter}>
              <TouchableOpacity style={localStyles.cancelButton} onPress={() => setShowSpeedMenu(false)}>
                <Text style={styles.bodySmall}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLoopMenu} transparent animationType='fade' onRequestClose={() => setShowLoopMenu(false)}>
        <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setShowLoopMenu(false)}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.card }]}>
            <View style={localStyles.modalHeader}>
              <Text style={[styles.titleLarge, { marginBottom: 0 }]}>デフォルトループ</Text>
            </View>
            <View style={{ padding: spacing.sm }}>
              {loopOptions.map((option) => {
                const isActive = loopMode === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[localStyles.modalItem, isActive && { backgroundColor: colors.primary }]}
                    onPress={() => updateLoopMode(option.value)}
                  >
                    <Text style={styles.textDefault}>{option.label}</Text>
                    {isActive && <Check color={colors.primary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={localStyles.modalFooter}>
              <TouchableOpacity style={localStyles.cancelButton} onPress={() => setShowLoopMenu(false)}>
                <Text style={styles.bodySmall}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTimerMenu} transparent animationType='fade' onRequestClose={() => setShowTimerMenu(false)}>
        <TouchableOpacity style={localStyles.modalOverlay} activeOpacity={1} onPress={() => setShowTimerMenu(false)}>
          <View style={[localStyles.modalContent, { backgroundColor: colors.card }]}>
            <View style={localStyles.modalHeader}>
              <Text style={[styles.titleLarge, { marginBottom: 0 }]}>デフォルトタイマー</Text>
            </View>
            <View style={{ padding: spacing.sm }}>
              {timerOptions.map((option) => {
                const isActive = sleepTimer === option.value
                return (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={[localStyles.modalItem, isActive && { backgroundColor: colors.primary }]}
                    onPress={() => updateSleepTimer(option.value)}
                  >
                    <Text style={styles.textDefault}>{option.label}</Text>
                    {isActive && <Check color={colors.primary} size={20} />}
                  </TouchableOpacity>
                )
              })}
            </View>
            <View style={localStyles.modalFooter}>
              <TouchableOpacity style={localStyles.cancelButton} onPress={() => setShowTimerMenu(false)}>
                <Text style={styles.bodySmall}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onAddTenant={() => {
          setShowAccountModal(false)
          setTimeout(() => setShowAddTenant(true), 300)
        }}
      />
      <AddTenantModal
        visible={showAddTenant}
        onClose={() => setShowAddTenant(false)}
        onSubmit={async (code) => {
          setShowAddTenant(false)
          await new Promise<void>((resolve) => setTimeout(resolve, 500))
          try {
            await WebAuthSessionModule.openAuthSession(`https://${code}.lseed.app`, 'login.lseed.app', '/app/lstream')
          } catch (e: unknown) {
            if (e instanceof Error && (e.message?.includes('cancelled') || e.message?.includes('USER_CANCELLED')))
              return
            Alert.alert('エラー', '認証に失敗しました')
          }
        }}
      />
    </View>
  )
}

const localStyles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: '5%',
    gap: 16,
  },
  iconBg: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 24,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalFooter: {
    padding: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
})
