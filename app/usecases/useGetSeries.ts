import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetSeries = (seriesId: number) => useApiQuery(() => apiRepository.getSeries(seriesId))
