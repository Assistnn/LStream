import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import { Image, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg'

import { gradientByKey } from '../utils'

export const PlaylistCover = ({
  gradient,
  coverImage,
  size,
  borderRadius,
  children,
  style,
}: {
  gradient?: string
  coverImage?: string
  size?: number
  borderRadius?: number
  children?: ReactNode
  style?: ViewStyle
}) => {
  const g = gradientByKey(gradient)
  const id = `grad-${g.key}`
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: g.colors[1],
        },
        style,
      ]}
    >
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} resizeMode='cover' />
      ) : (
        <Svg width='100%' height='100%'>
          <Defs>
            <SvgLinearGradient id={id} x1='0' y1='0' x2='1' y2='1'>
              <Stop offset='0' stopColor={g.colors[0]} />
              <Stop offset='1' stopColor={g.colors[1]} />
            </SvgLinearGradient>
          </Defs>
          <Rect x='0' y='0' width='100%' height='100%' fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  )
}
