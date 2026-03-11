import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetHomeData = () => useApiQuery(() => apiRepository.getHomeData())
