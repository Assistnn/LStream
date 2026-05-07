import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Clock, Heart, Home, Library, ListMusic, Settings } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, BackHandler, Easing, Image, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EpisodePlayer } from '../../components/player/EpisodePlayer'
import { FullscreenControls } from '../../components/player/FullscreenControls'
import { MiniPlayer } from '../../components/player/MiniPlayer'
import { PlayerVideo, usePlayer } from '../../hooks/PlayerContext'
import { useTheme } from '../../hooks/ThemeContext'
import { useInitFavorites } from '../../usecases/useGetFavorites'
import { refetchSettings, useInitSettings } from '../../usecases/useSettings'
import { SeriesDetailScreen } from '../common/series/detail'
import { FavoritesTabScreen } from './favorites'
import { HistoryTabScreen } from './history'
import { HomeTabScreen } from './home'
import { NewArrivalsScreen } from './home/new-arrivals'
import { LibraryTabScreen } from './library'
import { PlaylistTabScreen } from './playlist'
import { PlaylistDetailScreen } from './playlist/playlist-detail'
import { QueueScreen } from './playlist/queue'
import type { PlaylistStackParamList } from './playlist/types'
import { SettingsTabScreen } from './setting'

const Tab = createBottomTabNavigator<{
  Home: undefined
  Library: undefined
  Favorites: undefined
  Playlist: undefined
  History: undefined
  Settings: undefined
}>()

const HomeStack = createNativeStackNavigator<{
  HomeRoot: undefined
  NewArrivals: undefined
  SeriesDetail: { seriesId: number }
}>()
const LibraryStack = createNativeStackNavigator()
const FavoritesStack = createNativeStackNavigator()
const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>()
const HistoryStack = createNativeStackNavigator()
const SettingsStack = createNativeStackNavigator()

const HomeStackScreen = () => {
  const { colors } = useTheme()
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'default',
      }}
    >
      <HomeStack.Screen name='HomeRoot' component={HomeTabScreen} options={{ title: 'ホーム' }} />
      <HomeStack.Screen
        name='NewArrivals'
        component={NewArrivalsScreen}
        options={() => ({
          title: '新着',
          headerShown: true,
          presentation: 'card',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.navBar,
          },
          headerTintColor: colors.text,
        })}
      />
      <HomeStack.Screen
        name='SeriesDetail'
        component={SeriesDetailScreen}
        options={() => ({
          title: '',
          headerShown: true,
          presentation: 'card',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.navBar,
          },
          headerTintColor: colors.text,
        })}
      />
    </HomeStack.Navigator>
  )
}

const LibraryStackScreen = () => (
  <LibraryStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <LibraryStack.Screen name='LibraryRoot' component={LibraryTabScreen} options={{ title: 'ライブラリ' }} />
  </LibraryStack.Navigator>
)

const FavoritesStackScreen = () => (
  <FavoritesStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <FavoritesStack.Screen name='FavoritesRoot' component={FavoritesTabScreen} options={{ title: 'お気に入り' }} />
  </FavoritesStack.Navigator>
)

const PlaylistStackScreen = () => (
  <PlaylistStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <PlaylistStack.Screen name='PlaylistRoot' component={PlaylistTabScreen} options={{ title: 'プレイリスト' }} />
    <PlaylistStack.Screen
      name='PlaylistDetail'
      component={PlaylistDetailScreen}
      options={{ title: 'プレイリスト詳細' }}
    />
    <PlaylistStack.Screen name='Queue' component={QueueScreen} options={{ title: '再生キュー' }} />
  </PlaylistStack.Navigator>
)

const HistoryStackScreen = () => (
  <HistoryStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <HistoryStack.Screen name='HistoryRoot' component={HistoryTabScreen} options={{ title: '履歴' }} />
  </HistoryStack.Navigator>
)

const SettingsStackScreen = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <SettingsStack.Screen name='SettingsRoot' component={SettingsTabScreen} options={{ title: '設定' }} />
  </SettingsStack.Navigator>
)

export const MainScreen = () => {
  const { styles, colors } = useTheme()
  const {
    currentContent,
    state: { playbackState },
    view: { compactSlot, expandedSlot, isBuffering, isPlayerExpanded, setPlayerExpanded },
    settings: { isFullscreen, setIsFullscreen },
  } = usePlayer()
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showEpisodeList, setShowEpisodeList] = useState(false)
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const slideAnim = useRef(new Animated.Value(screenHeight)).current

  useInitSettings()
  useInitFavorites()

  useEffect(() => {
    if (currentContent && isPlayerExpanded) {
      setShowPlayerModal(true)
    }
  }, [currentContent, isPlayerExpanded])

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showPlayerModal ? 0 : screenHeight,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [showPlayerModal, screenHeight, slideAnim])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullscreen) {
        setIsFullscreen(false)
        return true
      }
      if (showPlayerModal) {
        setShowPlayerModal(false)
        setShowEpisodeList(false)
        setPlayerExpanded(false)
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [showPlayerModal, isFullscreen, setIsFullscreen])

  // ラッパーのベースサイズは常に「expandedSlot の想定サイズ」= 画面幅 × 9/16 に固定する。
  // 実測値 expandedSlot と同じサイズになるので、測定後もサイズは変わらず、
  // iOS AVPlayerLayer が再初期化されない (→ 遷移中に動画描画が一瞬止まる問題を回避)。
  const baseWidth = screenWidth
  const baseHeight = (screenWidth * 9) / 16
  const effectiveExpanded = expandedSlot ?? { x: 0, y: 0, width: baseWidth, height: baseHeight }
  const effectiveCompact = compactSlot ?? {
    x: 0,
    y: screenHeight - 49 - insets.bottom - 56,
    width: 56 * (16 / 9),
    height: 56,
  }

  // transform ベース (useNativeDriver: true 対応): translate + scale で compactSlot へ補間
  const translateX = slideAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [effectiveExpanded.x, effectiveCompact.x],
    extrapolate: 'clamp',
  })
  const translateY = slideAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [effectiveExpanded.y, effectiveCompact.y],
    extrapolate: 'clamp',
  })
  const scaleX = slideAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, effectiveCompact.width / baseWidth],
    extrapolate: 'clamp',
  })
  const scaleY = slideAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, effectiveCompact.height / baseHeight],
    extrapolate: 'clamp',
  })

  const videoWrapperStyle = isFullscreen
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: screenWidth,
        height: screenHeight,
        zIndex: 60,
      }
    : {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: baseWidth,
        height: baseHeight,
        transformOrigin: '0% 0%' as const,
        transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
        zIndex: 60,
      }

  const thumbnail = currentContent?.thumbnail
  const showVideoWrapper = !!currentContent

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: {
            paddingBottom: currentContent ? 56 : 0,
          },
        }}
        screenListeners={{
          tabPress: refetchSettings,
        }}
      >
        <Tab.Screen
          name='Home'
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color }) => <Home color={color} size={20} />,
          }}
          component={HomeStackScreen}
        />
        <Tab.Screen
          name='Library'
          options={{
            title: 'ライブラリ',
            tabBarIcon: ({ color }) => <Library color={color} size={20} />,
          }}
          component={LibraryStackScreen}
        />
        <Tab.Screen
          name='Favorites'
          options={{
            title: 'お気に入り',
            tabBarIcon: ({ color }) => <Heart color={color} size={20} />,
          }}
          component={FavoritesStackScreen}
        />
        <Tab.Screen
          name='Playlist'
          options={{
            title: 'プレイリスト',
            tabBarIcon: ({ color }) => <ListMusic color={color} size={20} />,
          }}
          component={PlaylistStackScreen}
        />
        <Tab.Screen
          name='History'
          options={{
            title: '履歴',
            tabBarIcon: ({ color }) => <Clock color={color} size={20} />,
          }}
          component={HistoryStackScreen}
        />
        <Tab.Screen
          name='Settings'
          options={{
            title: '設定',
            tabBarIcon: ({ color }) => <Settings color={color} size={20} />,
          }}
          component={SettingsStackScreen}
        />
      </Tab.Navigator>

      {currentContent && (
        <View
          style={{
            position: 'absolute',
            bottom: 49 + insets.bottom,
            left: 0,
            right: 0,
          }}
        >
          <MiniPlayer
            onTap={() => {
              setShowPlayerModal(true)
              setShowEpisodeList(false)
            }}
            onListTap={() => {
              setShowPlayerModal(true)
              setShowEpisodeList(true)
            }}
          />
        </View>
      )}

      {currentContent && !isFullscreen && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY: slideAnim }],
          }}
          pointerEvents={showPlayerModal ? 'auto' : 'none'}
        >
          <EpisodePlayer
            visible={showPlayerModal}
            showEpisodeList={showEpisodeList}
            onClose={() => {
              setShowPlayerModal(false)
              setShowEpisodeList(false)
              setPlayerExpanded(false)
            }}
          />
        </Animated.View>
      )}

      {showVideoWrapper && (
        <Animated.View
          style={
            isFullscreen
              ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: screenWidth,
                  height: screenHeight,
                  zIndex: 60,
                  backgroundColor: '#000',
                  transformOrigin: '0% 0%' as const,
                  transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }],
                }
              : videoWrapperStyle
          }
          pointerEvents='none'
        >
          {currentContent.isVideo ? (
            <PlayerVideo style={{ width: '100%', height: '100%' }} />
          ) : (
            <>
              <PlayerVideo style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }} />
              {thumbnail && (
                <Image source={{ uri: thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode='cover' />
              )}
            </>
          )}
          {(playbackState === 'loading' || isBuffering) && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size='large' color='#FFFFFF' />
            </View>
          )}
        </Animated.View>
      )}

      <FullscreenControls />
    </View>
  )
}
