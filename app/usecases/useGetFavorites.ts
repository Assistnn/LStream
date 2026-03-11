import { useApiQueries } from '../hooks/api/useApiQueries'
import { apiRepository } from '../repositories/api'

export const useGetFavorites = () => {
  const { data, loading, refetch } = useApiQueries([
    () => apiRepository.getFavoriteSeries(),
    () => apiRepository.getFavoriteEpisodes(),
  ])
  return {
    series: data?.[0] ?? null,
    episodes: data?.[1] ?? null,
    loading,
    refetch,
  }
}
