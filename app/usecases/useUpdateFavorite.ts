import { apiRepository } from '../repositories/api'
import { refetchFavorites } from './useGetFavorites'

export const toggleFavorite = async (seriesId: number, itemId: number) => {
  try {
    await apiRepository.updateFavorite({ series_id: seriesId, item_id: itemId })
    await refetchFavorites()
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    throw error
  }
}
