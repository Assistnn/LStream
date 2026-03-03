import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useTheme } from '../../hooks/ThemeContext'
import { FavoritesTabScreen } from './favorites'
import { FavoritesChildScreen } from './favorites/child'
import { HistoryTabScreen } from './history'
import { HistoryChildScreen } from './history/child'
import { HomeTabScreen } from './home'
import { HomeChildScreen } from './home/child'
import { LibraryTabScreen } from './library'
import { LibraryChildScreen } from './library/child'
import { PlaylistTabScreen } from './playlist'
import { PlaylistChildScreen } from './playlist/child'
import { SettingsTabScreen } from './setting'
import { SettingsChildScreen } from './setting/child'

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

const HomeStackScreen = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name='HomeRoot' component={HomeTabScreen} options={{ title: 'ホーム' }} />
    <HomeStack.Screen name='HomeChild' component={HomeChildScreen} options={{ title: 'ホーム child' }} />
  </HomeStack.Navigator>
)

const LibraryStackScreen = () => (
  <LibraryStack.Navigator>
    <LibraryStack.Screen name='LibraryRoot' component={LibraryTabScreen} options={{ title: 'ライブラリ' }} />
    <LibraryStack.Screen name='LibraryChild' component={LibraryChildScreen} options={{ title: 'ライブラリ child' }} />
  </LibraryStack.Navigator>
)

const FavoritesStackScreen = () => (
  <FavoritesStack.Navigator>
    <FavoritesStack.Screen name='FavoritesRoot' component={FavoritesTabScreen} options={{ title: 'お気に入り' }} />
    <FavoritesStack.Screen
      name='FavoritesChild'
      component={FavoritesChildScreen}
      options={{ title: 'お気に入り child' }}
    />
  </FavoritesStack.Navigator>
)

const PlaylistStackScreen = () => (
  <PlaylistStack.Navigator>
    <PlaylistStack.Screen name='PlaylistRoot' component={PlaylistTabScreen} options={{ title: 'プレイリスト' }} />
    <PlaylistStack.Screen
      name='PlaylistChild'
      component={PlaylistChildScreen}
      options={{ title: 'プレイリスト child' }}
    />
  </PlaylistStack.Navigator>
)

const HistoryStackScreen = () => (
  <HistoryStack.Navigator>
    <HistoryStack.Screen name='HistoryRoot' component={HistoryTabScreen} options={{ title: '履歴' }} />
    <HistoryStack.Screen name='HistoryChild' component={HistoryChildScreen} options={{ title: '履歴 child' }} />
  </HistoryStack.Navigator>
)

const SettingsStackScreen = () => (
  <SettingsStack.Navigator>
    <SettingsStack.Screen name='SettingsRoot' component={SettingsTabScreen} options={{ title: '設定' }} />
    <SettingsStack.Screen name='SettingsChild' component={SettingsChildScreen} options={{ title: '設定 child' }} />
  </SettingsStack.Navigator>
)

export const MainScreen = () => {
  const { styles, tabBarActiveTintColor, tabBarInactiveTintColor } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarInactiveTintColor,
        tabBarActiveTintColor,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen name='Home' options={{ title: 'ホーム' }} component={HomeStackScreen} />
      <Tab.Screen name='Library' options={{ title: 'ライブラリ' }} component={LibraryStackScreen} />
      <Tab.Screen name='Favorites' options={{ title: 'お気に入り' }} component={FavoritesStackScreen} />
      <Tab.Screen name='Playlist' options={{ title: 'プレイリスト' }} component={PlaylistStackScreen} />
      <Tab.Screen name='History' options={{ title: '履歴' }} component={HistoryStackScreen} />
      <Tab.Screen name='Settings' options={{ title: '設定' }} component={SettingsStackScreen} />
    </Tab.Navigator>
  )
}
