import {
  ArrowDown,
  ArrowUp,
  Grid3x3,
  Library as LibraryIcon,
  List,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ContextMenu } from '../../../components/ui/ContextMenu'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { PageTitle } from '../../../components/ui/PageTitle'
import { ThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetLibrary } from '../../../usecases/useGetLibrary'
import { useSettings } from '../../../usecases/useSettings'
import { LibraryCard } from './components/LibraryCard'
import { LibraryListItem } from './components/LibraryListItem'
import { SearchBar } from './components/SearchBar'

const TYPE_MAP = {
  すべて: 1,
  音声: 2,
  動画: 3,
  お気に入り: 4,
} as const

const SORT_MAP = {
  登録順: 1,
  再生数順: 2,
  タイトル順: 3,
} as const

export const LibraryTabScreen = () => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, borderRadius, typography } = useTheme()
  const settings = useSettings()

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('すべて')
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [sortMenuAnchorY, setSortMenuAnchorY] = useState<number | undefined>(undefined)
  const [sortOption, setSortOption] = useState('登録順')
  const [sortAsc, setSortAsc] = useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const categoryMap = useMemo(
    () =>
      (settings?.categories ?? []).reduce<Record<string, number>>((acc, category) => {
        acc[category.name] = category.category_id
        return acc
      }, {}),
    [settings],
  )

  const categoryFilters = useMemo(
    () => ['すべて', ...(settings?.categories ?? []).map((category) => category.name)],
    [settings],
  )

  useEffect(() => {
    if (!categoryFilters.includes(selectedCategory)) {
      setSelectedCategory('すべて')
    }
  }, [categoryFilters, selectedCategory])

  const params = useMemo(
    () => ({
      type: TYPE_MAP[selectedType as keyof typeof TYPE_MAP],
      order: SORT_MAP[sortOption as keyof typeof SORT_MAP],
      asc: sortAsc ? 1 : 0,
      category: selectedCategory === 'すべて' ? undefined : categoryMap[selectedCategory],
      keyword: searchQuery || undefined,
    }),
    [selectedType, selectedCategory, sortOption, sortAsc, searchQuery, categoryMap],
  )

  const { data, loading, refetch } = useGetLibrary(params)

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    await refetch()
    setIsManualRefreshing(false)
  }

  const typeFilters = ['すべて', '音声', '動画', 'お気に入り']
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
        refreshControl={
          <ThemedRefreshControl refreshing={isManualRefreshing && loading} onRefresh={handleManualRefresh} />
        }
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
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
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
            marginBottom: spacing.xs,
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
                style={[
                  styles.textBold,
                  {
                    color: selectedType === filter ? colors.background : colors.text,
                    fontWeight: selectedType === filter ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  },
                ]}
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
            marginBottom: spacing.xs,
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
                style={[
                  styles.bodySmall,
                  {
                    color: selectedCategory === filter ? colors.background : colors.text,
                    fontWeight:
                      selectedCategory === filter ? typography.fontWeight.semibold : typography.fontWeight.normal,
                  },
                ]}
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
            marginBottom: spacing.xs,
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
              onPress={() => setSortAsc(!sortAsc)}
            >
              {sortAsc ? (
                <ArrowUp size={20} color={colors.textSecondary} />
              ) : (
                <ArrowDown size={20} color={colors.textSecondary} />
              )}
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

        {/* Content */}
        {loading && data === null ? (
          <LoadingSpinner />
        ) : !data || data.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 3 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xl,
              }}
            >
              <Search size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.titleLarge, { color: colors.text, marginBottom: spacing.xs }]}>
              コンテンツが見つかりません
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>別の検索条件をお試しください</Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View
            style={{
              paddingHorizontal: spacing.lg,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {data.map((item) => (
              <View
                key={item.series_id}
                style={{
                  width: '48%',
                  marginBottom: spacing.md,
                }}
              >
                <LibraryCard item={item} onPress={() => {}} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: spacing.md, paddingHorizontal: spacing.lg }}>
            {data.map((item) => (
              <LibraryListItem key={item.series_id} item={item} onPress={() => {}} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
