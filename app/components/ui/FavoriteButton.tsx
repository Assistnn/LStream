import { Heart } from 'lucide-react-native'
import type { ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native'

import { isFavoriteEpisode } from '../../usecases/useGetFavorites'
import { toggleFavorite } from '../../usecases/useUpdateFavorite'

export const FavoriteButton = ({
  seriesId = 0,
  itemId = 0,
  size = 20,
  buttonStyle,
}: {
  seriesId?: number
  itemId?: number
  size?: number
  buttonStyle?: ViewStyle
}) => {
  const isFavorited = isFavoriteEpisode(seriesId, itemId)
  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={() => toggleFavorite(seriesId, itemId)}
    >
      <Heart size={size} color='#FFFFFF' fill={isFavorited ? '#FFFFFF' : 'transparent'} />
    </TouchableOpacity>
  )
}
