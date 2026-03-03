import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ThemeMode } from '../../../hooks/ThemeContext'
import { useTheme } from '../../../hooks/ThemeContext'

export const SettingsTabScreen = () => {
  const { themeMode, styles, setThemeMode } = useTheme()
  const navigation = useNavigation()
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.tabContentText}>テーマを選択</Text>
      <View style={localStyles.list}>
        {[
          { mode: 'light' as ThemeMode, label: 'ライトモード' },
          { mode: 'dark' as ThemeMode, label: 'ダークモード' },
          { mode: 'system' as ThemeMode, label: 'システムに合わせる' },
        ].map((opt) => {
          const isActive = themeMode === opt.mode
          return (
            <TouchableOpacity
              key={opt.mode}
              style={[localStyles.item, isActive && localStyles.itemActive]}
              onPress={() => setThemeMode(opt.mode)}
            >
              <Text style={[localStyles.itemLabel, isActive && localStyles.itemLabelActive]}>{opt.label}</Text>
              {isActive ? <Text style={localStyles.check}>✓</Text> : null}
            </TouchableOpacity>
          )
        })}
      </View>
      <TouchableOpacity
        style={[styles.button, { marginTop: 24 }]}
        onPress={() => navigation.navigate('SettingsChild' as never)}
      >
        <Text style={styles.buttonText}>child へ</Text>
      </TouchableOpacity>
    </View>
  )
}

const localStyles = StyleSheet.create({
  list: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#222831',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3a3f47',
  },
  itemActive: {
    backgroundColor: '#283649',
  },
  itemLabel: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  itemLabelActive: {
    fontWeight: '600',
    color: '#ffffff',
  },
  check: {
    fontSize: 16,
    color: '#4da3ff',
  },
})
