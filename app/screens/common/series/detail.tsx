import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ChevronDown, ChevronUp, CircleDot, CirclePlay, Download, Heart, Play } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '../../../components/ui/Button'
import { ContextMenu } from '../../../components/ui/ContextMenu'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { MediaMenuButton } from '../../../components/ui/MediaMenuButton'
import { SeriesProgessBar } from '../../../components/ui/SeriesProgessBar'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetSeries } from '../../../usecases/useGetSeries'

export const SeriesDetailScreen = ({
  route,
}: NativeStackScreenProps<
  {
    SeriesDetail: { seriesId: number }
  },
  'SeriesDetail'
>) => {
  const { seriesId } = route.params
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const { data, loading, refetch } = useGetSeries(seriesId)

  const [filterType, setFilterType] = useState<'all' | 'notStarted'>('all')
  const [sortOrder, setSortOrder] = useState<'default' | 'newest' | 'oldest'>('default')
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set())

  const [sortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortMenuAnchorY, setSortMenuAnchorY] = useState<number | undefined>(undefined)
  const sortButtonRef = useRef<View>(null)

  if (!data && loading) {
    return (
      <View style={[styles.screenContainer, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <LoadingSpinner size='large' />
      </View>
    )
  }

  if (!data) {
    return null
  }

  const filteredEpisodes =
    filterType === 'all'
      ? data.episodes
      : data.episodes.filter((ep) => ep.progress === 0 || ep.units.some((unit) => unit.progress === 0))

  const sortedEpisodes =
    sortOrder === 'default'
      ? filteredEpisodes
      : sortOrder === 'newest'
        ? [...filteredEpisodes].reverse()
        : filteredEpisodes

  return (
    <View style={[styles.screenContainer]}>
      <View style={{ height: 0.5, backgroundColor: colors.border }} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={<ThemedRefreshControl refreshing={data !== null && loading} onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
          <Image source={{ uri: data.img }} style={{ width: '100%', aspectRatio: 1, borderRadius: borderRadius.sm }} />

          <View style={{ paddingTop: spacing.md, flexDirection: 'column', gap: spacing.sm }}>
            <Text style={styles.linkText}>{data.category}</Text>
            <Text style={styles.text3xl}>{data.title}</Text>
            {data.description && <Text style={styles.bodyText}>{data.description}</Text>}

            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {data.type_media !== 0 && (
                  <Text style={styles.bodySmall}>{data.type_media === 1 ? '動画' : '音声'}</Text>
                )}
                <Text style={styles.bodySmall}>{data.num_total}メディア</Text>
                <Text style={styles.bodySmall}>
                  合計{' '}
                  {(() => {
                    const hours = Math.floor(data.duration / 3600)
                    const minutes = Math.floor((data.duration % 3600) / 60)
                    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:00` : `${minutes}:00`
                  })()}
                </Text>
              </View>
              <MediaMenuButton
                mediaId={data.series_id}
                mediaType='series'
                size={20}
                buttonStyle={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </View>

            <SeriesProgessBar variant='dark' num_comp={data.num_comp} num_total={data.num_total} />
          </View>

          <View style={{ paddingTop: spacing.lg, gap: spacing.sm }}>
            {data.progress > 0 && data.num_comp < data.num_total ? (
              <>
                <Button variant='primary' icon={<Play size={20} />} fillIcon onPress={() => {}}>
                  {`続きから再生 (Episode ${data.episodes[0]?.episode_id || 1})`}
                </Button>
                <Button variant='secondary' icon={<CirclePlay size={20} />} onPress={() => {}}>
                  最初から再生
                </Button>
              </>
            ) : data.num_comp >= data.num_total ? (
              <Button variant='primary' onPress={() => {}}>
                すべて完了！もう一度学習する
              </Button>
            ) : (
              <Button variant='primary' icon={<Play size={20} />} onPress={() => {}}>
                最初から再生 (Episode 1)
              </Button>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'column', gap: spacing.md }}>
          <Text style={styles.text2xl}>エピソード一覧</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                {
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: filterType === 'all' ? colors.primary : colors.secondary,
                },
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[{ color: filterType === 'all' ? colors.primaryForeground : colors.secondaryForeground }]}>
                すべて
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                {
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: filterType === 'notStarted' ? colors.primary : colors.secondary,
                },
              ]}
              onPress={() => setFilterType('notStarted')}
            >
              <Text
                style={[{ color: filterType === 'notStarted' ? colors.primaryForeground : colors.secondaryForeground }]}
              >
                未再生のみ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              ref={sortButtonRef}
              style={[
                styles.buttonSecondary,
                {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginLeft: 'auto',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                sortButtonRef.current?.measure(
                  (_x: number, _y: number, _width: number, height: number, _pageX: number, pageY: number) => {
                    setSortMenuAnchorY(pageY + height + 4)
                    setSortMenuVisible(true)
                  },
                )
              }}
            >
              <Text style={{ color: colors.secondaryForeground }}>
                {sortOrder === 'default' ? '登録順' : sortOrder === 'newest' ? '新着順' : '古い順'}
              </Text>
              <ChevronDown size={16} color={colors.secondaryForeground} />
            </TouchableOpacity>
            <ContextMenu
              visible={sortMenuVisible}
              items={[
                { label: '登録順', onPress: () => setSortOrder('default') },
                { label: '新着順', onPress: () => setSortOrder('newest') },
                { label: '古い順', onPress: () => setSortOrder('oldest') },
              ]}
              onClose={() => setSortMenuVisible(false)}
              position='right'
              anchorY={sortMenuAnchorY}
            />
          </View>
        </View>

        <View style={{ paddingTop: spacing.md }}>
          {sortedEpisodes.map((episode, index) => {
            const hasUnits = episode.units.length > 0
            const totalPlayCount = hasUnits ? episode.units.reduce((sum) => sum + 0, 0) : 0
            const isExpanded = expandedEpisodes.has(episode.episode_id)
            return (
              <View key={episode.episode_id}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.lg,
                    flexDirection: 'row',
                    gap: spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                  onPress={() => {
                    if (hasUnits) {
                      setExpandedEpisodes((prev) => {
                        const next = new Set(prev)
                        if (next.has(episode.episode_id)) {
                          next.delete(episode.episode_id)
                        } else {
                          next.add(episode.episode_id)
                        }
                        return next
                      })
                    }
                  }}
                >
                  <View style={{ position: 'relative', width: 64, height: 64 }}>
                    <Image
                      source={{ uri: episode.img }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: borderRadius.lg,
                      }}
                    />
                    {index % 2 === 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          left: -4,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 12,
                          padding: 4,
                        }}
                      >
                        <Heart size={12} color='#ef4444' fill='#ef4444' strokeWidth={0} />
                      </View>
                    )}
                    {totalPlayCount === 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: colors.primary,
                          borderRadius: 12,
                          padding: 4,
                        }}
                      >
                        <CircleDot size={12} color='white' strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, flexDirection: 'column', gap: spacing.xs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={styles.bodySmall}>Ep.{index + 1} </Text>
                      <Text style={styles.titleLarge} numberOfLines={1}>
                        {episode.title}
                      </Text>
                    </View>

                    {hasUnits && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={styles.bodyTiny}>{episode.units.length} Units</Text>
                        <Text style={[styles.bodyTiny, { color: colors.text }]}>
                          {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        {!hasUnits && (
                          <Text style={[styles.bodyTiny, { color: colors.text }]}>
                            {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                          </Text>
                        )}
                        {totalPlayCount > 0 && (
                          <View
                            style={{
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              backgroundColor: colors.muted,
                              borderRadius: borderRadius.sm,
                            }}
                          >
                            <Text style={styles.bodyTiny}>{totalPlayCount.toLocaleString()}回再生</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        {index % 2 === 0 && <Download size={16} color={colors.primary} />}
                        {hasUnits ? (
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} color={colors.textSecondary} />
                            ) : (
                              <ChevronDown size={16} color={colors.textSecondary} />
                            )}
                          </View>
                        ) : (
                          <MediaMenuButton mediaId={episode.episode_id} mediaType='episode' size={16} />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {hasUnits && isExpanded && (
                  <View style={{ paddingLeft: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
                    {episode.units.map((unit, unitIndex) => (
                      <View key={unit.episode_id}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: spacing.md,
                            paddingRight: spacing.sm,
                            gap: 0,
                            borderTopWidth: unitIndex === 0 ? 0 : 1,
                            borderTopColor: colors.border,
                          }}
                          onPress={() => {}}
                        >
                          <View style={{ width: 20, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 }} />

                          <View style={{ flex: 1, minWidth: 0, paddingVertical: 2.5, paddingRight: 2 }}>
                            <Text style={styles.titleMedium} numberOfLines={1}>
                              <Text style={styles.bodySmall}>UN.{unitIndex + 1} </Text>
                              {unit.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={styles.bodyTiny}>
                                {Math.floor(unit.duration / 60)}:{(unit.duration % 60).toString().padStart(2, '0')}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 8 }}>
                            <MediaMenuButton mediaId={unit.episode_id} mediaType='unit' size={16} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
