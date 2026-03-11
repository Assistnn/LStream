import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EpisodeListItem } from '../../../../components/listitem/EpisodeListItem'
import { Button } from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { ProgressBar } from '../../../../components/ui/ProgressBar'
import { useTheme } from '../../../../hooks/ThemeContext'
import { SectionHeader } from '../../../../components/ui/SectionHeader'

const mockEpisodeForList = {
  episode_id: 1,
  type_media: 2,
  url: 'https://example.com/ep1.m3u8',
  img: 'https://picsum.photos/400/300',
  title: 'Ep.1 Un.2 自己紹介のフレーズ 〜ビジネス英会話を学ぶマスター〜',
  duration: 420,
  units: [],
}

// const mockSeries = {
//   id: '1',
//   title: 'サンプルシリーズタイトル',
//   thumbnail: 'https://picsum.photos/400/400',
//   category: '語学',
//   totalEpisodes: 10,
//   completedEpisodes: 3,
//   isFavorite: true,
//   isDownloaded: false,
//   type: 'video' as const,
// }

export const DebugUIScreen = () => {
  const { styles, spacing } = useTheme()
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: spacing['4xl'] }}
      >
        <Text style={[{ marginBottom: spacing['2xl'] }]}>UI Components</Text>

        {/* Buttons */}
        <SectionHeader title='Buttons' />
        <View style={{ gap: spacing.md, marginBottom: spacing['3xl'] }}>
          <Button>Primary Button</Button>
          <Button variant='secondary'>Secondary Button</Button>
          <Button variant='outline'>Outline Button</Button>
          <Button size='small'>Small Button</Button>
          <Button size='large'>Large Button</Button>
          <Button loading={loading} onPress={() => setLoading(!loading)}>
            {loading ? 'Loading...' : 'Toggle Loading'}
          </Button>
          <Button disabled>Disabled Button</Button>
        </View>

        {/* ProgressBar */}
        <SectionHeader title='Progress Bar' />
        <View style={{ gap: spacing.md, marginBottom: spacing['3xl'] }}>
          <View>
            <Text style={[styles.textCaption, { marginBottom: spacing.sm }]}>25%</Text>
            <ProgressBar progress={25} />
          </View>
          <View>
            <Text style={[styles.textCaption, { marginBottom: spacing.sm }]}>50%</Text>
            <ProgressBar progress={50} />
          </View>
          <View>
            <Text style={[styles.textCaption, { marginBottom: spacing.sm }]}>75%</Text>
            <ProgressBar progress={75} />
          </View>
          <View>
            <Text style={[styles.textCaption, { marginBottom: spacing.sm }]}>100%</Text>
            <ProgressBar progress={100} />
          </View>
        </View>

        {/* LoadingSpinner */}
        <SectionHeader title='Loading Spinner' />
        <View style={{ height: 100, marginBottom: spacing['3xl'] }}>
          <LoadingSpinner size='large' text='読み込み中...' />
        </View>

        {/* EmptyState */}
        <SectionHeader title='Empty State' />
        <View style={{ height: 200, marginBottom: spacing['3xl'] }}>
          <EmptyState icon='📭' title='コンテンツがありません' description='まだコンテンツが追加されていません' />
        </View>

        {/* EpisodeListItem */}
        <SectionHeader title='Episode List Item' />
        <View style={{ marginBottom: spacing['3xl'] }}>
          <EpisodeListItem
            episode={mockEpisodeForList}
            variant='default'
            playCount={9723}
            menuItems={[
              { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist') },
              { label: '再生キューに追加', onPress: () => console.log('Add to queue') },
              { label: 'ダウンロード', onPress: () => console.log('Download') },
            ]}
          />
          <EpisodeListItem
            episode={{ ...mockEpisodeForList, episode_id: 2, title: '自己肯定感を高める10の習慣' }}
            variant='default'
            menuItems={[
              { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist') },
              { label: '再生キューに追加', onPress: () => console.log('Add to queue') },
              { label: 'ダウンロード', onPress: () => console.log('Download') },
            ]}
          />
          <EpisodeListItem
            episode={{ ...mockEpisodeForList, episode_id: 3, title: 'Ep.21 Day 21 - 実践編' }}
            variant='default'
            playCount={15000}
            menuItems={[
              { label: 'プレイリストに追加', onPress: () => console.log('Add to playlist') },
              { label: '再生キューに追加', onPress: () => console.log('Add to queue') },
              { label: 'ダウンロード', onPress: () => console.log('Download') },
            ]}
          />
        </View>

        {/* SectionHeader */}
        <SectionHeader title='Section Headers' />
        <View style={{ gap: spacing.md, marginBottom: spacing['3xl'] }}>
          <SectionHeader title='タイトルのみ' />
          <SectionHeader title='アクション付き' action='すべて表示' onActionPress={() => console.log('Action!')} />
        </View>
      </ScrollView>
    </View>
  )
}
