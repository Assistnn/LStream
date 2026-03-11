import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Clock, Heart, Home, Library, ListMusic, Settings } from 'lucide-react-native'

import { useTheme } from '../../hooks/ThemeContext'
import { FavoritesTabScreen } from './favorites'
import { HistoryTabScreen } from './history'
import { HomeTabScreen } from './home'
import { NewArrivalsScreen } from './home/new-arrivals'
import { LibraryTabScreen } from './library'
import { PlaylistTabScreen } from './playlist'
import { PlaylistChildScreen } from './playlist/child'
import { SettingsTabScreen } from './setting'
import { SettingsChildScreen } from './setting/child'
import { DebugUIScreen } from './setting/debug/ui-components'

const Tab = createBottomTabNavigator<{
  Home: undefined
  Library: undefined
  Favorites: undefined
  Playlist: undefined
  History: undefined
  Settings: undefined
}>()

const HomeStack = createNativeStackNavigator()
const LibraryStack = createNativeStackNavigator()
const FavoritesStack = createNativeStackNavigator()
const PlaylistStack = createNativeStackNavigator()
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
            backgroundColor: colors.background,
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
      name='PlaylistChild'
      component={PlaylistChildScreen}
      options={{ title: 'プレイリスト child' }}
    />
  </PlaylistStack.Navigator>
)

const HistoryStackScreen = () => (
  <HistoryStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
    <HistoryStack.Screen name='HistoryRoot' component={HistoryTabScreen} options={{ title: '履歴' }} />
  </HistoryStack.Navigator>
)

const SettingsStackScreen = () => {
  const { colors } = useTheme()
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'default' }}>
      <SettingsStack.Screen name='SettingsRoot' component={SettingsTabScreen} options={{ title: '設定' }} />
      <SettingsStack.Screen name='SettingsChild' component={SettingsChildScreen} options={{ title: '設定 child' }} />
      <SettingsStack.Screen
        name='DebugUI'
        component={DebugUIScreen}
        options={() => ({
          title: 'UI Components',
          headerShown: true,
          presentation: 'card',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        })}
      />
    </SettingsStack.Navigator>
  )
}

export const MainScreen = () => {
  const { styles, colors } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
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
  )
}
