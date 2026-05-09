import { List, Pause, Play, X } from 'lucide-react-native'
import { useCallback, useRef } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import { FavoriteButton } from '../ui/FavoriteButton'

export const MiniPlayer = ({ onTap, onListTap }: { onTap: () => void; onListTap: () => void }) => {
  const { colors } = useTheme()
  const {
    currentContent,
    state: { playbackState },
    controls: { pause, resume },
    view: { closePlayer, setCompactSlot },
  } = usePlayer()
  const slotRef = useRef<View>(null)

  const measureSlot = useCallback(() => {
    slotRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setCompactSlot({ x, y, width, height })
      }
    })
  }, [setCompactSlot])

  if (!currentContent) return null

  const isPlaying = playbackState === 'playing'
  const episode = currentContent.episodes.find((ep) => ep.id === currentContent.episodeId)
  if (!episode) return null
  const unit = currentContent.unitId ? episode.children?.find((u) => u.id === currentContent.unitId) : undefined
  const thumbnail = unit?.img || episode.img

  return (
    <View
      style={{
        height: 56,
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
        backgroundColor: colors.navBar,
        borderTopColor: colors.border,
      }}
    >
      <TouchableOpacity style={{ flex: 1 }} onPress={onTap} activeOpacity={0.8}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 0,
          }}
        >
          <View ref={slotRef} onLayout={measureSlot} collapsable={false} style={{ width: 56 * (16 / 9), height: 56 }}>
            {!currentContent.isVideo &&
              (thumbnail ? (
                <Image source={{ uri: thumbnail }} style={{ width: 56 * (16 / 9), height: 56 }} resizeMode='cover' />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 56,
                    backgroundColor: '#6b7280',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🎵</Text>
                </View>
              ))}
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {unit?.title || episode.title}
            </Text>
            <Text style={{ fontSize: 11, marginTop: 2, color: colors.textSecondary }} numberOfLines={1}>
              {unit ? episode.title : episode.parentTitle}
              {(unit?.mediaType || episode.mediaType) === 1
                ? ' • 動画'
                : (unit?.mediaType || episode.mediaType) === 2
                  ? ' • 音声'
                  : ''}
            </Text>
          </View>

          <FavoriteButton
            itemId={currentContent.unitId ?? currentContent.episodeId}
            size={20}
            buttonStyle={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}
          />

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              onListTap()
            }}
            style={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <List size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              if (isPlaying) {
                pause()
              } else {
                resume()
              }
            }}
            style={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPlaying ? (
              <Pause size={24} color={colors.text} fill={colors.text} />
            ) : (
              <Play size={24} color={colors.text} fill={colors.text} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              closePlayer()
            }}
            style={{ padding: 6, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )
}
