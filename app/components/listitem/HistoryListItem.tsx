import { Play } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'
import type { SeriesItemWithItemId } from '../../repositories/api/IApiRepository'

// TODO: APIレスポンス調整中。UIもまだ適当
export const HistoryListItem = ({
  item,
  isTop,
}: {
  item: SeriesItemWithItemId & { playedAt: Date }
  isTop: boolean
}) => {
  const { colors, spacing, typography, borderRadius } = useTheme()

  const progressPercent = (item.num_comp / item.num_total) * 100
  const playedDate = new Date(item.playedAt)
  const dateStr = `${playedDate.getMonth() + 1}/${playedDate.getDate()}`

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderTopWidth: isTop ? 1 : 0,
        borderTopColor: colors.border,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}
      onPress={() => {}}
    >
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.img }} style={{ width: 64, height: 64, borderRadius: borderRadius.md }} />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={20} color='#FFFFFF' fill='#FFFFFF' />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.base,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}
          numberOfLines={1}
        >
          {item.title} • {dateStr}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1, height: 4, backgroundColor: colors.muted, borderRadius: borderRadius.full }}>
            <View
              style={{
                height: 4,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.full,
                width: `${progressPercent}%`,
              }}
            />
          </View>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
            {Math.round(progressPercent)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
