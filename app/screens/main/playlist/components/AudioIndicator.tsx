import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

export const AudioIndicator = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) => {
  const bars = useRef([new Animated.Value(0.3), new Animated.Value(0.6), new Animated.Value(0.3)]).current

  useEffect(() => {
    const loops = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 400 + i * 120,
            delay: i * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.3,
            duration: 400 + i * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [bars])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: size }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: size,
            backgroundColor: color,
            borderRadius: 1,
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  )
}
