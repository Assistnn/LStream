import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ChevronDown, CirclePlay, Heart, Play } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EpisodeMediaList } from '../../../components/listitem/EpisodeMediaList'
import { Button } from '../../../components/ui/Button'
import { ContextMenu } from '../../../components/ui/ContextMenu'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { MediaMenuButton } from '../../../components/ui/MediaMenuButton'
import { SeriesProgessBar } from '../../../components/ui/SeriesProgessBar'
import { useThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useDownload } from '../../../hooks/DownloadContext'
import type { PlayableTrack } from '../../../hooks/PlayerContext'
import { usePlayer } from '../../../hooks/PlayerContext'
import { useTheme } from '../../../hooks/ThemeContext'
import { isFavoriteEpisode } from '../../../usecases/useGetFavorites'
import { useGetSeries } from '../../../usecases/useGetSeries'
import { seriesMediaToTrack } from '../../main/playlist/utils'

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
  const {
    navigation: { play },
    queueActions: { addToQueue },
  } = usePlayer()
  const { startDownload } = useDownload()

  const [filterType, setFilterType] = useState<'all' | 'notStarted'>('all')
  const [sortOrder, setSortOrder] = useState<'default' | 'newest' | 'oldest'>('default')

  const [sortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortMenuAnchorY, setSortMenuAnchorY] = useState<number | undefined>(undefined)
  const sortButtonRef = useRef<View>(null)
  const refreshControl = useThemedRefreshControl(data !== null && loading, refetch)

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

  const playableTracks =
    data.episodes.length > 0
      ? data.episodes.map(seriesMediaToTrack)
      : [
          {
            id: data.series_id,
            mediaType: data.type_media,
            url: data.url,
            img: data.img,
            title: data.title,
            duration: data.duration,
            progress: data.progress,
            parentTitle: '',
            chapters: data.chapters,
          } satisfies PlayableTrack,
        ]

  const filteredEpisodes =
    filterType === 'all'
      ? playableTracks
      : playableTracks.filter(
          (ep) => ep.progress === 0 || (ep.children && ep.children.some((unit) => unit.progress === 0)),
        )

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
        refreshControl={refreshControl}
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
                    const seconds = data.duration % 60
                    return hours > 0
                      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                      : `${minutes}:${seconds.toString().padStart(2, '0')}`
                  })()}
                </Text>
              </View>
              <MediaMenuButton
                seriesId={data.series_id}
                mediaId={data.series_id}
                mediaType='series'
                size={20}
                buttonStyle={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onAddAllToQueue={() => {
                  for (const ep of data.episodes) {
                    if (ep.units && ep.units.length > 0) {
                      for (const u of ep.units) {
                        addToQueue({
                          trackId: ep.item_id,
                          childId: u.item_id,
                          title: u.title,
                          parentTitle: ep.title,
                          thumbnail: u.img || ep.img,
                          duration: u.duration,
                          url: u.url,
                          mediaType: u.type_media,
                        })
                      }
                    } else {
                      addToQueue({
                        trackId: ep.item_id,
                        title: ep.title,
                        parentTitle: data.title,
                        thumbnail: ep.img,
                        duration: ep.duration,
                        url: ep.url,
                        mediaType: ep.type_media,
                      })
                    }
                  }
                }}
                onDownloadAll={() => {
                  for (const ep of data.episodes) {
                    if (ep.units && ep.units.length > 0) {
                      for (const u of ep.units) {
                        startDownload({
                          seriesId: data.series_id,
                          mediaId: u.item_id,
                          title: u.title,
                          seriesTitle: `${data.title} / ${ep.title}`,
                          thumbnail: u.img || ep.img,
                          duration: u.duration,
                          mediaType: u.type_media,
                          url: u.url,
                        })
                      }
                    } else {
                      startDownload({
                        seriesId: data.series_id,
                        mediaId: ep.item_id,
                        title: ep.title,
                        seriesTitle: data.title,
                        thumbnail: ep.img,
                        duration: ep.duration,
                        mediaType: ep.type_media,
                        url: ep.url,
                      })
                    }
                  }
                }}
              />
            </View>

            <SeriesProgessBar variant='dark' num_comp={data.num_comp} num_total={data.num_total} />
          </View>

          <View style={{ paddingTop: spacing.lg, gap: spacing.sm }}>
            {(() => {
              const isSingleContent = data.episodes.length === 0
              const hasProgress = isSingleContent
                ? data.progress > 0
                : data.episodes.some(
                    (ep) => ep.progress > 0 || (ep.units && ep.units.some((unit) => unit.progress > 0)),
                  )
              const inProgressEpisode = data.episodes.find((ep) => ep.progress > 0 && ep.progress < ep.duration)
              const nextUnwatchedEpisode = data.episodes.find((ep) => ep.progress === 0)
              const resumeEpisode = inProgressEpisode || nextUnwatchedEpisode || data.episodes[0]
              const resumeEpisodeIndex = resumeEpisode
                ? data.episodes.findIndex((ep) => ep.item_id === resumeEpisode.item_id)
                : -1

              return hasProgress && data.num_comp < data.num_total ? (
                <>
                  <Button
                    variant='primary'
                    icon={<Play size={20} />}
                    fillIcon
                    onPress={() => {
                      if (isSingleContent) {
                        play(data.series_id, playableTracks)
                      } else if (resumeEpisode) {
                        play(data.series_id, playableTracks, resumeEpisode.item_id)
                      }
                    }}
                  >
                    {isSingleContent ? '続きから再生' : `続きから再生 (Episode ${resumeEpisodeIndex + 1})`}
                  </Button>
                  <Button
                    variant='secondary'
                    icon={<CirclePlay size={20} />}
                    onPress={() => {
                      play(data.series_id, playableTracks)
                    }}
                  >
                    最初から再生
                  </Button>
                </>
              ) : data.num_comp >= data.num_total ? (
                <Button
                  variant='primary'
                  onPress={() => {
                    play(data.series_id, playableTracks)
                  }}
                >
                  すべて完了！もう一度学習する
                </Button>
              ) : (
                <Button
                  variant='primary'
                  icon={<Play size={20} />}
                  onPress={() => {
                    play(data.series_id, playableTracks)
                  }}
                >
                  {isSingleContent ? '再生' : '最初から再生 (Episode 1)'}
                </Button>
              )
            })()}
          </View>
        </View>

        {data.episodes.length > 0 && (
          <>
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
                  <Text
                    style={[{ color: filterType === 'all' ? colors.primaryForeground : colors.secondaryForeground }]}
                  >
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
                    style={[
                      { color: filterType === 'notStarted' ? colors.primaryForeground : colors.secondaryForeground },
                    ]}
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

            <EpisodeMediaList
              episodes={sortedEpisodes}
              onEpisodePress={(ep) => play(data.series_id, playableTracks, ep.id)}
              onUnitPress={(ep, unit) => play(data.series_id, playableTracks, ep.id, unit.id)}
              renderThumbnailOverlay={(ep) => (
                <>
                  {isFavoriteEpisode(seriesId, ep.id) && (
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
                </>
              )}
              renderEpisodeActions={(ep, hasUnits) =>
                !hasUnits ? (
                  <MediaMenuButton
                    seriesId={data.series_id}
                    mediaId={ep.id}
                    mediaType='episode'
                    size={16}
                    mediaInfo={{
                      title: ep.title,
                      seriesTitle: data.title,
                      thumbnail: ep.img,
                      duration: ep.duration,
                      url: ep.url,
                      contentMediaType: ep.mediaType,
                    }}
                  />
                ) : null
              }
              renderUnitActions={(unit, ep) => (
                <MediaMenuButton
                  seriesId={data.series_id}
                  mediaId={unit.id}
                  mediaType='unit'
                  size={16}
                  mediaInfo={{
                    title: unit.title,
                    seriesTitle: `${data.title} / ${ep.title}`,
                    thumbnail: unit.img || ep.img,
                    duration: unit.duration,
                    url: unit.url,
                    contentMediaType: unit.mediaType,
                  }}
                />
              )}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}
