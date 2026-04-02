import { List, Pause, Play, X } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import { FavoriteButton } from '../ui/FavoriteButton'

export const MiniPlayer = ({ onTap, onListTap }: { onTap: () => void; onListTap: () => void }) => {
  const { colors } = useTheme()
  const { currentContent, playbackState, togglePlayPause, closePlayer, renderMediaDisplay } = usePlayer()

  if (!currentContent) return null

  const isPlaying = playbackState === 'playing'
  const { series, episode, chapter } = currentContent

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
          {renderMediaDisplay({ width: 80, height: 56 }, 'mini')}
          <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {chapter?.title || episode.title}
            </Text>
            <Text style={{ fontSize: 11, marginTop: 2, color: colors.textSecondary }} numberOfLines={1}>
              {chapter ? episode.title : series.title}
              {(chapter?.type_media || episode.type_media) === 1
                ? ' • 動画'
                : (chapter?.type_media || episode.type_media) === 2
                  ? ' • 音声'
                  : ''}
            </Text>
          </View>

          <FavoriteButton
            seriesId={series.series_id}
            itemId={episode.item_id}
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
              togglePlayPause()
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
