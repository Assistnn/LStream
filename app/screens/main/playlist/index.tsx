import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { List, ListMusic, Play, Plus } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg'

import { EmptyState } from '../../../components/ui/EmptyState'
import { PageTitle } from '../../../components/ui/PageTitle'
import type { Playlist } from '../../../hooks/PlaylistContext'
import { usePlaylist } from '../../../hooks/PlaylistContext'
import { useTheme } from '../../../hooks/ThemeContext'
import { CreatePlaylistModal } from './components/CreatePlaylistModal'
import { PlaylistRow } from './components/PlaylistRow'
import type { PlaylistStackParamList } from './types'
import { formatTotalDuration, sortPlaylists } from './utils'

export const PlaylistTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius } = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<PlaylistStackParamList>>()
  const { playlists, queue, createPlaylist, updatePlaylist, deletePlaylist } = usePlaylist()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Playlist | null>(null)

  const sorted = useMemo(() => sortPlaylists(playlists), [playlists])
  const queueTotal = useMemo(() => queue.reduce((s, i) => s + i.duration, 0), [queue])

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        <PageTitle icon={ListMusic} title='プレイリスト' />

        {/* Queue Section */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Queue')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Svg width='100%' height='100%' style={{ position: 'absolute' }}>
              <Defs>
                <SvgLinearGradient id='queueGrad' x1='0' y1='0' x2='1' y2='1'>
                  <Stop offset='0' stopColor='#3B82F6' />
                  <Stop offset='1' stopColor='#2563EB' />
                </SvgLinearGradient>
              </Defs>
              <Rect x='0' y='0' width='100%' height='100%' fill='url(#queueGrad)' />
            </Svg>
            <Play size={32} color='#FFFFFF' fill='#FFFFFF' />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={styles.textBold}>再生キュー</Text>
            <Text style={styles.bodySmall}>
              {queue.length > 0 ? `${queue.length}メディア ・ ${formatTotalDuration(queueTotal)}` : '0メディア'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* My Playlists Section */}
        <View style={{ marginTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}
          >
            <Text style={styles.titleLarge}>マイプレイリスト</Text>
            <TouchableOpacity
              onPress={() => {
                setEditing(null)
                setCreateOpen(true)
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: borderRadius.full,
                borderWidth: 2,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {sorted.length === 0 ? (
            <EmptyState icon={List} title='プレイリストがありません' description='右上の「+」から作成できます' />
          ) : (
            sorted.map((p) => (
              <PlaylistRow
                key={p.id}
                playlist={p}
                onPress={() => navigation.navigate('PlaylistDetail', { playlistId: p.id })}
                onEdit={() => {
                  setEditing(p)
                  setCreateOpen(true)
                }}
                onDelete={() => {
                  Alert.alert('プレイリストを削除', `「${p.name}」を削除しますか？`, [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '削除', style: 'destructive', onPress: () => deletePlaylist(p.id) },
                  ])
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CreatePlaylistModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        editing={editing}
        onSubmit={(payload) => {
          if (editing) {
            updatePlaylist(editing.id, {
              name: payload.name,
              description: payload.description,
              gradient: payload.gradient,
              alarm: payload.alarm,
            })
          } else {
            createPlaylist(payload)
          }
          setCreateOpen(false)
          setEditing(null)
        }}
      />
    </View>
  )
}
