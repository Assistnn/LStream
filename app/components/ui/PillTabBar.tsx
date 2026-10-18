import { BlurView } from '@react-native-community/blur'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Platform, Pressable, Text, View } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'
import { useTabBarInset } from '../../hooks/useTabBarInset'

export const PillTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { styles, colors, isDark } = useTheme()
  const tabBarInset = useTabBarInset()

  return (
    <View pointerEvents='box-none' style={{ height: tabBarInset, paddingHorizontal: 10, paddingVertical: 4 }}>
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          gap: 2,
          padding: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          // Android のぼかしは端末によって重く見た目も安定しないため、不透明に近い単色にする。
          backgroundColor:
            Platform.OS === 'ios'
              ? isDark
                ? 'rgba(31, 41, 55, 0.55)'
                : 'rgba(255, 255, 255, 0.55)'
              : isDark
                ? 'rgba(31, 41, 55, 0.94)'
                : 'rgba(255, 255, 255, 0.94)',
        }}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={18}
            reducedTransparencyFallbackColor={colors.card}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          return (
            <Pressable
              key={route.key}
              accessibilityRole='button'
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params)
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={{
                flex: 1,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              }}
            >
              {options.tabBarIcon?.({
                focused,
                color: focused ? colors.tabBarActive : colors.tabBarInactive,
                size: 20,
              })}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.tabLabel,
                  { fontSize: 10, letterSpacing: 0.4 },
                  focused ? styles.tabLabelActive : { color: colors.tabBarInactive },
                ]}
              >
                {options.title}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
