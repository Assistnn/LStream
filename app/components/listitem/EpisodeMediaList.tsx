import { ChevronDown, ChevronUp, Play } from 'lucide-react-native'
import type React from 'react'
import { useState } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import { usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import type { SeriesMedia } from '../../repositories/api/IApiRepository'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const EpisodeMediaList = ({
  episodes,
  onEpisodePress,
  onUnitPress,
  renderThumbnailOverlay,
  renderEpisodeActions,
  renderUnitActions,
}: {
  episodes: SeriesMedia[]
  onEpisodePress?: (episode: SeriesMedia) => void
  onUnitPress?: (episode: SeriesMedia, unit: Omit<SeriesMedia, 'units'>) => void
  renderThumbnailOverlay?: (episode: SeriesMedia) => React.ReactNode
  renderEpisodeActions?: (episode: SeriesMedia, hasUnits: boolean) => React.ReactNode
  renderUnitActions?: (episode: SeriesMedia, unit: Omit<SeriesMedia, 'units'>) => React.ReactNode
}) => {
  const { colors, styles, spacing } = useTheme()
  const { currentContent } = usePlayer()
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set())

  return (
    <View>
      {episodes.map((ep, index) => {
        const hasUnits = ep.units && ep.units.length > 0
        const isExpanded = expandedEpisodes.has(ep.item_id)
        const isCurrentEpisode = currentContent?.episodeId === ep.item_id

        return (
          <View key={ep.item_id}>
            <TouchableOpacity
              onPress={() => {
                if (hasUnits) {
                  setExpandedEpisodes((prev) => {
                    const next = new Set(prev)
                    if (next.has(ep.item_id)) next.delete(ep.item_id)
                    else next.add(ep.item_id)
                    return next
                  })
                } else {
                  onEpisodePress?.(ep)
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: isCurrentEpisode ? colors.muted : colors.background,
              }}
            >
              <View style={{ position: 'relative', width: 56, height: 56 }}>
                <Image
                  source={{ uri: ep.img }}
                  style={{ width: 56, height: 56, borderRadius: spacing.xs }}
                  resizeMode='cover'
                />
                {renderThumbnailOverlay?.(ep)}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={[styles.bodySmall, { color: colors.text }]}>Ep.{index + 1} </Text>
                  <Text
                    style={[
                      styles.titleMedium,
                      {
                        flex: 1,
                        fontWeight: '600',
                        color: isCurrentEpisode ? colors.primary : colors.text,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {ep.title}
                  </Text>
                </View>

                {hasUnits && ep.units && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing['2xs'] }}>
                    <Text style={styles.bodyTiny}>{ep.units.length} Units</Text>
                    <Text style={[styles.bodyTiny, { color: colors.text }]}>{formatTime(ep.duration)}</Text>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    {!hasUnits && <Text style={styles.bodyTiny}>{formatTime(ep.duration)}</Text>}
                    {isCurrentEpisode && (
                      <Text style={[styles.bodyTiny, { color: colors.primary, fontWeight: '700' }]}>再生中</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    {renderEpisodeActions?.(ep, !!hasUnits)}
                    {hasUnits &&
                      (isExpanded ? (
                        <ChevronUp size={16} color={colors.textSecondary} />
                      ) : (
                        <ChevronDown size={16} color={colors.textSecondary} />
                      ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {hasUnits && isExpanded && ep.units && (
              <View style={{ paddingLeft: spacing['5xl'] }}>
                {ep.units.map((unit, unitIndex) => {
                  const isCurrentUnit = currentContent?.unitId === unit.item_id

                  return (
                    <TouchableOpacity
                      key={unit.item_id}
                      onPress={() => onUnitPress?.(ep, unit)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        paddingVertical: spacing.md,
                        paddingRight: spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={styles.bodySmall}>Un.{unitIndex + 1} </Text>
                          <Text
                            style={[
                              styles.textDefault,
                              {
                                flex: 1,
                                fontWeight: '500',
                                color: isCurrentUnit ? colors.primary : colors.text,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {unit.title}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <Text style={styles.bodyTiny}>{formatTime(unit.duration)}</Text>
                          {isCurrentUnit && (
                            <Text style={[styles.bodyTiny, { color: colors.primary, fontWeight: '700' }]}>再生中</Text>
                          )}
                        </View>
                      </View>
                      {renderUnitActions?.(ep, unit)}
                      {isCurrentUnit && <Play size={32} color={colors.primary} fill={colors.primary} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}
