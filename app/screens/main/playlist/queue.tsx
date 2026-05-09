import { useNavigation } from '@react-navigation/native'
import { ChevronLeft, ListMusic, Play } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '../../../components/ui/EmptyState'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'
import { QueueItemRow } from './components/QueueItemRow'
import { formatTotalDuration, toPlayableTrack } from './utils'

export const QueueScreen = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const { queue, autoPlayNext, currentContent, navigation: playerNav, queueActions } = usePlayer()
  const [activeSwipeRowId, setActiveSwipeRowId] = useState<string | null>(null)

  const total = useMemo(() => queue.reduce((s, i) => s + i.duration, 0), [queue])

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: spacing.xs }}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.text3xl}>再生キュー</Text>
              <Text style={styles.bodySmall}>
                {queue.length}件のメディア ・ 合計 {formatTotalDuration(total)}
              </Text>
            </View>
          </View>

          {queue.length > 0 && (
            <TouchableOpacity
              onPress={() => playerNav.playFromList(queue.map(toPlayableTrack), queue[0].trackId, queue[0].childId)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                backgroundColor: colors.foreground,
              }}
            >
              <Play size={14} color={colors.background} fill={colors.background} />
              <Text style={[styles.textBold, { color: colors.background }]}>すべて再生</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-play toggle */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            padding: spacing.lg,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.textBold}>連続再生</Text>
            <Text style={styles.bodySmall}>次のコンテンツを自動で再生</Text>
          </View>
          <Switch
            value={autoPlayNext}
            onValueChange={queueActions.setAutoPlayNext}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        </View>

        {/* Queue list */}
        <View style={{ marginTop: spacing.xl }}>
          {queue.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title='再生キューが空です'
              description='「プレイリスト」や各メディアから追加できます'
            />
          ) : (
            queue.map((item, index) => (
              <QueueItemRow
                key={item.id}
                item={item}
                index={index}
                isPlaying={currentContent?.episodeId === item.trackId && currentContent.unitId === item.childId}
                onPress={() => playerNav.playFromList(queue.map(toPlayableTrack), item.trackId, item.childId)}
                onRemove={() => queueActions.removeFromQueue(item.id)}
                activeSwipeRowId={activeSwipeRowId}
                setActiveSwipeRowId={setActiveSwipeRowId}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
