import { Heart } from 'lucide-react-native'
import type { ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native'

import { isFavoriteEpisode } from '../../usecases/useGetFavorites'
import { toggleFavorite } from '../../usecases/useUpdateFavorite'

export const FavoriteButton = ({
  seriesId,
  itemId,
  size = 20,
  buttonStyle,
}: {
  seriesId: number
  itemId: number
  size?: number
  buttonStyle?: ViewStyle
}) => {
  const isFavorited = isFavoriteEpisode(seriesId, itemId)
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={() => (itemId === 0 ? toggleFavorite(seriesId, 0) : toggleFavorite(0, itemId))}
    >
      <Heart size={size} color='#FFFFFF' fill={isFavorited ? '#FFFFFF' : 'transparent'} />
    </TouchableOpacity>
  )
}
