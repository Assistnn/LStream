import { Clock, Heart, Home, Library, ListMusic, Settings } from 'lucide-react'

interface BottomTabProps {
  activeTab: 'today' | 'library' | 'favorites' | 'playlist' | 'history' | 'settings'
  onTabChange: (tab: 'today' | 'library' | 'favorites' | 'playlist' | 'history' | 'settings') => void
}

export function BottomTab({ activeTab, onTabChange }: BottomTabProps) {
  const tabs = [
    { id: 'today' as const, label: 'ホーム', icon: Home },
    { id: 'library' as const, label: 'ライブラリ', icon: Library },
    { id: 'favorites' as const, label: 'お気に入り', icon: Heart },
    { id: 'playlist' as const, label: 'プレイリスト', icon: ListMusic },
    { id: 'history' as const, label: '履歴', icon: Clock },
    { id: 'settings' as const, label: '設定', icon: Settings },
  ]

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom z-50'>
      <div className='flex justify-around items-center h-16 px-2'>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className='flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors'
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
