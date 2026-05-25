import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  NativeModules,
  ScrollView,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import serviceLogo from '../../../assets/logos/service-logo.png'
import { HistoryListItem } from '../../../components/listitem/HistoryListItem'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { useThemedRefreshControl } from '../../../components/ui/ThemedRefreshControl'
import { useTheme } from '../../../hooks/ThemeContext'
import { useGetHomeData } from '../../../usecases/useGetHomeData'
import { useSettings } from '../../../usecases/useSettings'
import { AccountModal } from './components/AccountModal'
import { AddTenantModal } from './components/AddTenantModal'
import { NewsCard } from './components/NewsCard'
import { RecentCard } from './components/RecentCard'
import { RecommendCard } from './components/RecommendCard'

const WebAuthSessionModule = (TurboModuleRegistry.get('WebAuthSessionModule') ??
  NativeModules.WebAuthSessionModule) as {
  openAuthSession: (url: string, host: string, path: string) => Promise<string>
}

const { width: screenWidth } = Dimensions.get('window')

export const HomeTabScreen = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<{
    HomeRoot: undefined
    NewArrivals: undefined
    SeriesDetail: { seriesId: number }
  }>
}) => {
  const insets = useSafeAreaInsets()
  const { styles, colors, spacing, isDark } = useTheme()
  const { data, loading, refetch } = useGetHomeData()
  const settings = useSettings()
  const headerImageUri = isDark ? settings?.header_dark : settings?.header_light
  const headerImageSource = settings ? (headerImageUri ? { uri: headerImageUri } : serviceLogo) : undefined
  const [logoWidth, setLogoWidth] = useState(160)
  const [showAccount, setShowAccount] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const refreshControl = useThemedRefreshControl(data !== null && loading, refetch)

  const handleAddTenant = useCallback(() => {
    setShowAccount(false)
    setTimeout(() => setShowAddTenant(true), 300)
  }, [])

  const handleTenantSubmit = useCallback(async (tenantCode: string) => {
    setShowAddTenant(false)
    await new Promise<void>((resolve) => setTimeout(resolve, 500))
    try {
      await WebAuthSessionModule.openAuthSession(`https://${tenantCode}.lseed.app`, 'login.lseed.app', '/app/lstream')
    } catch (e: unknown) {
      if (e instanceof Error && (e.message?.includes('cancelled') || e.message?.includes('USER_CANCELLED'))) return
      Alert.alert('エラー', '認証に失敗しました')
    }
  }, [])

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={refreshControl}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Image
              source={headerImageSource}
              style={{ width: logoWidth, height: 40 }}
              resizeMode='contain'
              onLoad={(e) => {
                const { width, height } = e.nativeEvent.source
                if (width && height) {
                  setLogoWidth(Math.min(160, (40 * width) / height))
                }
              }}
            />
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setShowAccount(true)}
            >
              <Text style={styles.textBold}>L</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bodyText}>
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>

        {/* Initial Loading */}
        {data === null && loading && (
          <View style={{ padding: spacing['4xl'], alignItems: 'center' }}>
            <LoadingSpinner size='large' />
          </View>
        )}

        {/* Contents */}
        {data && (
          <>
            {/* 今日のおすすめ */}
            {data.recommends.length > 0 && (
              <View style={{ flexDirection: 'column', gap: spacing.sm }}>
                <SectionHeader title='今日のおすすめ' />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft: spacing.lg,
                    paddingRight: spacing.lg,
                    gap: spacing.md,
                  }}
                  snapToInterval={screenWidth * 0.85 + spacing.md}
                  decelerationRate='fast'
                  snapToOffsets={[
                    0,
                    ...data.recommends
                      .slice(1)
                      .map(
                        (_, index) =>
                          spacing.lg + (screenWidth * 0.85 + spacing.md) * (index + 1) - screenWidth * 0.075,
                      ),
                  ]}
                >
                  {data.recommends.map((series, index) => (
                    <RecommendCard
                      key={index}
                      series={series}
                      onPress={() => navigation.navigate('SeriesDetail', { seriesId: series.series_id })}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {/* 前回の続き */}
            {data.recents.length > 0 && (
              <View style={{ flexDirection: 'column', gap: spacing.sm }}>
                <SectionHeader title='前回の続き' />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: spacing.lg,
                    gap: spacing.md,
                  }}
                >
                  {data.recents.map((item, index) => (
                    <RecentCard
                      key={index}
                      item={item}
                      onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.series_id })}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 新着 */}
            {data.news.length > 0 && (
              <View style={{ flexDirection: 'column', gap: spacing.sm }}>
                <SectionHeader
                  title='新着'
                  action='すべてを表示 ＞'
                  onActionPress={() => navigation.navigate('NewArrivals')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: spacing.lg,
                    gap: spacing.md,
                  }}
                >
                  {data.news.map((item, index) => (
                    <NewsCard
                      key={index}
                      news={item}
                      onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.series_id })}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 最新の再生履歴 */}
            {data.histories.length > 0 &&
              (() => {
                const today = new Date(new Date().setHours(0, 0, 0, 0))
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
                const groupedHistory = data.histories.slice(0, 10).reduce(
                  (acc, item) => {
                    const playedDate = new Date(new Date(item.date).setHours(0, 0, 0, 0))
                    let label: string
                    if (playedDate.getTime() === today.getTime()) {
                      label = '今日'
                    } else if (playedDate.getTime() === yesterday.getTime()) {
                      label = '昨日'
                    } else {
                      label = `${playedDate.getMonth() + 1}/${playedDate.getDate()}`
                    }
                    if (!acc[label]) {
                      acc[label] = []
                    }
                    acc[label].push(item)
                    return acc
                  },
                  {} as Record<string, typeof data.histories>,
                )
                return (
                  <View style={{ flexDirection: 'column', gap: spacing.sm }}>
                    <SectionHeader
                      title='最新の再生履歴'
                      action='すべてを表示 ＞'
                      onActionPress={() => navigation.getParent()?.navigate('History' as never)}
                    />
                    <View style={{ paddingBottom: spacing.lg }}>
                      {Object.entries(groupedHistory).map(([dateLabel, items], groupIndex) => (
                        <View key={dateLabel}>
                          <View
                            style={{
                              marginTop: groupIndex === 0 ? -1 * spacing.md : spacing.sm,
                              padding: spacing.lg,
                            }}
                          >
                            <Text style={styles.titleLarge}>{dateLabel}</Text>
                          </View>
                          {items.map((item, index) => (
                            <HistoryListItem key={index} item={item} isTop={index === 0} />
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                )
              })()}
          </>
        )}
      </ScrollView>
      <AccountModal visible={showAccount} onClose={() => setShowAccount(false)} onAddTenant={handleAddTenant} />
      <AddTenantModal
        visible={showAddTenant}
        onClose={() => setShowAddTenant(false)}
        onSubmit={(code) => void handleTenantSubmit(code)}
      />
    </View>
  )
}
