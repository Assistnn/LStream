import { ArrowDownUp, Grid3x3, Library as LibraryIcon, List, Search, SlidersHorizontal } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ContextMenu } from '../../../components/ui/ContextMenu'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetLibrary } from '../../../usecases/useGetLibrary'
import { SearchBar } from './components/SearchBar'

export const LibraryTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius, typography } = useTheme()
  const { data, loading, refetch } = useGetLibrary()

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('すべて')
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortMenuAnchorY, setSortMenuAnchorY] = useState<number | undefined>(undefined)
  const [sortOption, setSortOption] = useState('登録順')

  const typeFilters = ['すべて', '音声', '動画', 'お気に入り']
  const categoryFilters = ['すべて', '履歴', '英語', 'ビジネス', '自己肯定感', 'セールス練習']

  const sortMenuItems = [
    {
      label: '登録順',
      onPress: () => setSortOption('登録順'),
      isSelected: sortOption === '登録順',
    },
    {
      label: '再生数順',
      onPress: () => setSortOption('再生数順'),
      isSelected: sortOption === '再生数順',
    },
    {
      label: 'タイトル順',
      onPress: () => setSortOption('タイトル順'),
      isSelected: sortOption === 'タイトル順',
    },
  ]

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={<ThemedRefreshControl refreshing={data !== null && loading} onRefresh={refetch} />}
      >
        <PageTitle icon={LibraryIcon} title='ライブラリ'>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={colors.text} />
          </TouchableOpacity>
        </PageTitle>

        {/* Search Bar */}
        {showSearch && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <SearchBar value={searchQuery} onSearch={setSearchQuery} autoFocus />
          </View>
        )}

        {/* Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          {typeFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.full,
                backgroundColor: selectedType === filter ? colors.foreground : colors.card,
              }}
              onPress={() => setSelectedType(filter)}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.base,
                  color: selectedType === filter ? colors.background : colors.text,
                  fontWeight: selectedType === filter ? typography.fontWeight.semibold : typography.fontWeight.normal,
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            marginBottom: spacing['2xl'],
          }}
        >
          {categoryFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.lg,
                backgroundColor: selectedCategory === filter ? colors.foreground : colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => setSelectedCategory(filter)}
            >
              <Text
                style={{
                  fontSize: typography.fontSize.sm,
                  color: selectedCategory === filter ? colors.background : colors.text,
                  fontWeight:
                    selectedCategory === filter ? typography.fontWeight.semibold : typography.fontWeight.normal,
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Controls */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          {/* Left: View Mode Toggle */}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                backgroundColor: viewMode === 'grid' ? colors.foreground : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setViewMode('grid')}
            >
              <Grid3x3 size={20} color={viewMode === 'grid' ? colors.background : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                backgroundColor: viewMode === 'list' ? colors.foreground : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setViewMode('list')}
            >
              <List size={20} color={viewMode === 'list' ? colors.background : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Right: Filter and Sort */}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={(e) => {
                e.currentTarget.measure((_x, _y, _width, height, _pageX, pageY) => {
                  setSortMenuAnchorY(pageY + height)
                  setShowSortMenu(true)
                })
              }}
            >
              <SlidersHorizontal size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownUp size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Menu */}
        <ContextMenu
          visible={showSortMenu}
          onClose={() => setShowSortMenu(false)}
          items={sortMenuItems}
          position='right'
          anchorY={sortMenuAnchorY}
        />

        {/* Content placeholder */}
        {loading && data === null ? (
          <LoadingSpinner />
        ) : !data || data.length === 0 ? (
          <EmptyState icon='📚' title='ライブラリが空です' description='コンテンツを追加してみましょう' />
        ) : (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Text style={styles.textBody}>ライブラリの内容がここに表示されます</Text>
            <Text style={[styles.textCaption, { marginTop: spacing.md }]}>
              {data.length}件のアイテム（シリーズ: {data.filter((item) => item.itemType === 'series').length}
              件、エピソード: {data.filter((item) => item.itemType === 'episode').length}件）
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
