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
  Palette,
  Repeat,
  Settings,
  Trash2,
  Wifi,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useTheme } from '@/contexts/ThemeContext'

interface SettingsScreenProps {
  onDownloadTap?: () => void
}

export function SettingsScreen({ onDownloadTap }: SettingsScreenProps) {
  const { theme, setTheme } = useTheme()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showNextEpisode, setShowNextEpisode] = useState(true)
  const [showHistoryRetentionMenu, setShowHistoryRetentionMenu] = useState(false)
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30)
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [mobileDataEnabled, setMobileDataEnabled] = useState(false)

  // Load next episode visibility from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('showNextEpisode')
    if (saved !== null) {
      setShowNextEpisode(JSON.parse(saved))
    }
  }, [])

  // Load history retention days from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('historyRetentionDays')
    if (saved !== null) {
      setHistoryRetentionDays(parseInt(saved))
    }
  }, [])

  // Load notifications enabled from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    if (saved !== null) {
      setNotificationsEnabled(JSON.parse(saved))
    }
  }, [])

  // Load mobile data enabled from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mobileDataEnabled')
    if (saved !== null) {
      setMobileDataEnabled(JSON.parse(saved))
    }
  }, [])

  // Save next episode visibility to localStorage
  const toggleNextEpisode = () => {
    const newValue = !showNextEpisode
    setShowNextEpisode(newValue)
    localStorage.setItem('showNextEpisode', JSON.stringify(newValue))
  }

  // Save history retention days to localStorage
  const updateHistoryRetention = (days: number) => {
    setHistoryRetentionDays(days)
    localStorage.setItem('historyRetentionDays', days.toString())
    setShowHistoryRetentionMenu(false)
  }

  // Save notifications enabled to localStorage
  const toggleNotifications = () => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    localStorage.setItem('notificationsEnabled', JSON.stringify(newValue))
  }

  // Save mobile data enabled to localStorage
  const toggleMobileData = () => {
    const newValue = !mobileDataEnabled
    setMobileDataEnabled(newValue)
    localStorage.setItem('mobileDataEnabled', JSON.stringify(newValue))
  }

  const themeOptions = [
    { value: 'light' as const, label: 'ライトモード' },
    { value: 'dark' as const, label: 'ダークモード' },
    { value: 'system' as const, label: 'システムに合わせる' },
  ]

  const historyRetentionOptions = [
    { value: 30, label: '30日' },
    { value: 45, label: '45日' },
    { value: 60, label: '60日' },
    { value: 75, label: '75日' },
    { value: 90, label: '90日' },
  ]

  const getThemeLabel = () => {
    const option = themeOptions.find((opt) => opt.value === theme)
    return option?.label || 'システムに合わせる'
  }

  const settingsGroups = [
    {
      title: 'カラー・テーマ',
      items: [
        {
          icon: Palette,
          label: 'テーマ',
          value: getThemeLabel(),
          onClick: () => setShowThemeMenu(true),
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
          value: '1.0x',
        },
        {
          icon: Repeat,
          label: 'デフォルトループ回数',
          value: '1回',
        },
        {
          icon: Clock,
          label: 'デフォルトタイマー',
          value: 'なし',
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
          onClick: () => setShowHistoryRetentionMenu(true),
        },
        {
          icon: Trash2,
          label: 'キャッシュを削除',
          onClick: () => setShowClearCacheConfirm(true),
        },
      ],
    },
    {
      title: 'サポート',
      items: [
        {
          icon: HelpCircle,
          label: 'ヘルプ',
        },
        {
          icon: FileText,
          label: '利用規約',
        },
        {
          icon: Info,
          label: 'アプリ情報',
          value: 'v1.0.0',
        },
      ],
    },
  ]

  return (
    <div className='pb-40 pt-6 dark:bg-gray-900'>
      {/* Header */}
      <div className='px-[5%] mb-8'>
        <div className='flex items-center gap-3'>
          <Settings className='w-8 h-8 text-gray-700 dark:text-gray-300' />
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Settings</h1>
        </div>
      </div>

      {/* Settings groups */}
      <div className='space-y-8'>
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-[5%] mb-3'>
              {group.title}
            </h2>
            <div className='bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700'>
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon

                // Render toggle button
                if (item.isToggle) {
                  return (
                    <button
                      key={itemIndex}
                      className='w-full flex items-center gap-4 px-[5%] py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0'
                      onClick={item.onToggle}
                    >
                      <div className='w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Icon className='w-5 h-5 text-gray-600 dark:text-gray-300' />
                      </div>
                      <span className='flex-1 text-left font-medium text-gray-900 dark:text-white'>{item.label}</span>
                      {/* Toggle switch */}
                      <div
                        className={`w-12 h-7 rounded-full transition-colors ${
                          item.toggleValue ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full mt-1 transition-transform ${
                            item.toggleValue ? 'ml-6' : 'ml-1'
                          }`}
                        />
                      </div>
                    </button>
                  )
                }

                // Render regular button
                return (
                  <button
                    key={itemIndex}
                    className='w-full flex items-center gap-4 px-[5%] py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0'
                    onClick={item.onClick}
                  >
                    <div className='w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Icon className='w-5 h-5 text-gray-600 dark:text-gray-300' />
                    </div>
                    <span className='flex-1 text-left font-medium text-gray-900 dark:text-white'>{item.label}</span>
                    {item.value && <span className='text-sm text-gray-500 dark:text-gray-400'>{item.value}</span>}
                    <ChevronRight className='w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Theme menu */}
      {showThemeMenu && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl mx-6 max-w-sm w-full'>
            <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-white'>テーマを選択</h3>
            </div>
            <div className='p-2'>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                    theme === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    setTheme(option.value)
                    setShowThemeMenu(false)
                  }}
                >
                  <span className='flex-1 text-left font-medium text-gray-900 dark:text-white'>{option.label}</span>
                  {theme === option.value && (
                    <Check className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                  )}
                </button>
              ))}
            </div>
            <div className='p-4 border-t border-gray-100 dark:border-gray-700'>
              <button
                onClick={() => setShowThemeMenu(false)}
                className='w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History retention menu */}
      {showHistoryRetentionMenu && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl mx-6 max-w-sm w-full'>
            <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-white'>履歴の保持期間を選択</h3>
            </div>
            <div className='p-2'>
              {historyRetentionOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                    historyRetentionDays === option.value
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => updateHistoryRetention(option.value)}
                >
                  <span className='flex-1 text-left font-medium text-gray-900 dark:text-white'>{option.label}</span>
                  {historyRetentionDays === option.value && (
                    <Check className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                  )}
                </button>
              ))}
            </div>
            <div className='p-4 border-t border-gray-100 dark:border-gray-700'>
              <button
                onClick={() => setShowHistoryRetentionMenu(false)}
                className='w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear cache confirmation */}
      {showClearCacheConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl mx-6 max-w-sm w-full'>
            <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-white'>キャッシュを削除</h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>キャッシュを削除してもよろしいですか？</p>
            </div>
            <div className='p-4 flex gap-3'>
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                className='flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  // Clear cache (localStorage for now)
                  console.log('Clearing cache...')
                  // In a real app, you would clear actual cache here
                  alert('キャッシュを削除しました')
                  setShowClearCacheConfirm(false)
                }}
                className='flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors'
              >
                実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App version footer */}
      <div className='px-[5%] mt-12 text-center'>
        <p className='text-xs text-gray-400 dark:text-gray-500'>Learning Player App</p>
        <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>© 2026 All rights reserved</p>
      </div>
    </div>
  )
}
