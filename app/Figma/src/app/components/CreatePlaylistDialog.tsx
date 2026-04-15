import { Clock, Image, Shuffle, X } from 'lucide-react'
import { useState } from 'react'

import type { AlarmSettings, Playlist } from '@/data/mockData'

interface CreatePlaylistDialogProps {
  onClose: () => void
  onCreate: (name: string, description: string, alarm?: AlarmSettings, coverImage?: string) => void
  onUpdate?: (id: string, name: string, description: string, alarm?: AlarmSettings, coverImage?: string) => void
  editingPlaylist?: Playlist
}

const DAY_OPTIONS = [
  { id: 'sun', label: '日' },
  { id: 'mon', label: '月' },
  { id: 'tue', label: '火' },
  { id: 'wed', label: '水' },
  { id: 'thu', label: '木' },
  { id: 'fri', label: '金' },
  { id: 'sat', label: '土' },
] as const

export function CreatePlaylistDialog({ onClose, onCreate, onUpdate, editingPlaylist }: CreatePlaylistDialogProps) {
  const [name, setName] = useState(editingPlaylist?.name || '')
  const [description, setDescription] = useState(editingPlaylist?.description || '')
  const [alarmEnabled, setAlarmEnabled] = useState(editingPlaylist?.alarm?.enabled || false)
  const [alarmTime, setAlarmTime] = useState(editingPlaylist?.alarm?.time || '07:00')
  const [alarmHour, setAlarmHour] = useState(editingPlaylist?.alarm?.time.split(':')[0] || '07')
  const [alarmMinute, setAlarmMinute] = useState(editingPlaylist?.alarm?.time.split(':')[1] || '00')
  const [selectedDays, setSelectedDays] = useState<('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[]>(
    editingPlaylist?.alarm?.days || [],
  )
  const [alarmRandom, setAlarmRandom] = useState(editingPlaylist?.alarm?.random || false)
  const [coverImage, setCoverImage] = useState(editingPlaylist?.coverImage || '')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)

  const handleDayToggle = (day: (typeof DAY_OPTIONS)[number]['id']) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImageFile(file)
      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = () => {
    if (!name.trim()) return

    const alarm: AlarmSettings | undefined = alarmEnabled
      ? {
          enabled: true,
          time: `${alarmHour}:${alarmMinute}`,
          days: selectedDays,
          random: alarmRandom,
        }
      : undefined

    if (editingPlaylist) {
      onUpdate?.(editingPlaylist.id, name, description, alarm, coverImage)
    } else {
      onCreate(name, description, alarm, coverImage)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50' onClick={onClose}>
      <div
        className='w-full max-w-[460px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            {editingPlaylist ? 'プレイリスト編集' : '新規プレイリスト'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
          >
            <X className='w-6 h-6 text-gray-700 dark:text-gray-300' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Name Input */}
          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
              プレイリスト名 *
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='例：朝の習慣'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* Description Input */}
          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='プレイリストの説明を入力してください'
              rows={2}
              maxLength={40}
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            />
            <div className='mt-1 text-xs text-gray-500 dark:text-gray-400 text-right'>{description.length}/40</div>
          </div>

          {/* Cover Image Input */}
          <div>
            <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
              カバー画像（任意）
            </label>

            {/* File Input (hidden) */}
            <input type='file' accept='image/*' onChange={handleImageSelect} className='hidden' id='coverImageUpload' />

            {/* Upload Button */}
            <label
              htmlFor='coverImageUpload'
              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2'
            >
              <Image className='w-5 h-5' />
              <span>{coverImage ? '画像を変更' : '写真フォルダから選択'}</span>
            </label>

            {/* Preview */}
            {coverImage && (
              <div className='mt-3 relative'>
                <img src={coverImage} alt='Cover preview' className='w-full h-32 object-cover rounded-lg' />
                <button
                  onClick={() => {
                    setCoverImage('')
                    setCoverImageFile(null)
                  }}
                  className='absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors'
                >
                  <X className='w-4 h-4 text-white' />
                </button>
              </div>
            )}
          </div>

          {/* Alarm Settings */}
          <div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-gray-700 dark:text-gray-300' />
                <span className='font-semibold text-gray-900 dark:text-white'>アラーム設定</span>
              </div>
              {/* Toggle Switch */}
              <button
                onClick={() => setAlarmEnabled(!alarmEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  alarmEnabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                    alarmEnabled ? 'translate-x-6 bg-white dark:bg-gray-900' : 'translate-x-0 bg-white dark:bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {alarmEnabled && (
              <div className='mt-4 space-y-4'>
                {/* Time Picker */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>開始時間</label>
                  <div className='flex gap-2 items-center'>
                    <select
                      value={alarmHour}
                      onChange={(e) => setAlarmHour(e.target.value)}
                      className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}時
                        </option>
                      ))}
                    </select>
                    <span className='text-gray-500 dark:text-gray-400 font-semibold'>:</span>
                    <select
                      value={alarmMinute}
                      onChange={(e) => setAlarmMinute(e.target.value)}
                      className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}分
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Day Selector */}
                <div>
                  <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>曜日</label>
                  <div className='flex gap-2 justify-between'>
                    {DAY_OPTIONS.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => handleDayToggle(day.id)}
                        className={`w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                          selectedDays.includes(day.id)
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Random Playback */}
                <div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Shuffle className='w-5 h-5 text-gray-700 dark:text-gray-300' />
                      <span className='font-semibold text-gray-900 dark:text-white'>ランダム再生</span>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => setAlarmRandom(!alarmRandom)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        alarmRandom ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                          alarmRandom
                            ? 'translate-x-6 bg-white dark:bg-gray-900'
                            : 'translate-x-0 bg-white dark:bg-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm [@media(max-width:320px)]:text-xs [@media(max-width:320px)]:px-3'
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className='flex-1 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm [@media(max-width:320px)]:text-xs [@media(max-width:320px)]:px-3'
          >
            {editingPlaylist ? '更新' : '作成'}
          </button>
        </div>
      </div>
    </div>
  )
}
