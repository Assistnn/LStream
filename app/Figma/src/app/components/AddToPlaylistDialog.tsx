import { Check, List, Plus, X } from 'lucide-react'

import type { Playlist } from '@/data/mockData'

interface AddToPlaylistDialogProps {
  playlists: Playlist[]
  onClose: () => void
  onSelect: (playlistId: string) => void
  onCreatePlaylist?: () => void
}

export function AddToPlaylistDialog({ playlists, onClose, onSelect, onCreatePlaylist }: AddToPlaylistDialogProps) {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50' onClick={onClose}>
      <div
        className='w-full max-w-[460px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-h-[70vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>プレイリストに追加</h2>
          {onCreatePlaylist && (
            <button
              onClick={onCreatePlaylist}
              className='w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center hover:opacity-80 transition-opacity'
            >
              <Plus className='w-5 h-5 text-white dark:text-gray-900' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='p-4'>
          {playlists.length > 0 ? (
            <div className='space-y-2'>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onSelect(playlist.id)
                    onClose()
                  }}
                  className='w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors'
                >
                  <div className='w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden'>
                    {playlist.coverImage ? (
                      <img src={playlist.coverImage} alt={playlist.name} className='w-full h-full object-cover' />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${playlist.gradient || 'from-blue-500 to-blue-600'}`}
                      />
                    )}
                  </div>
                  <div className='flex-1 text-left min-w-0'>
                    <h3 className='font-semibold text-gray-900 dark:text-white truncate'>{playlist.name}</h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>{playlist.items.length}メディア</p>
                  </div>
                  <Check className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                </button>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                <List className='w-8 h-8 text-gray-700 dark:text-gray-300' />
              </div>
              <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>プレイリストがありません</h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>先にプレイリストを作成してください</p>
              {onCreatePlaylist && (
                <button
                  onClick={onCreatePlaylist}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-full transition-colors'
                >
                  <Plus className='w-5 h-5' />
                  <span>プレイリストを追加</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
