import { apiRepository } from '../repositories/api'
import { clearFavoritesCache, isFavoriteEpisode, isFavoriteSeries, refetchFavorites } from './useGetFavorites'

export const toggleFavorite = async (seriesId: number, itemId: number) => {
  try {
    const isFavorited = itemId === 0 ? isFavoriteSeries(seriesId) : isFavoriteEpisode(itemId)
    await apiRepository.updateFavorite({
      series_id: seriesId,
      item_id: itemId === 0 ? seriesId : itemId,
      enabled: isFavorited ? 0 : 1,
    })
    clearFavoritesCache()
    await refetchFavorites()
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    throw error
  }
}
