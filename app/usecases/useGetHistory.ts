import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetHistory = () =>
  useApiQuery(() => apiRepository.getHistories().then((response) => response.histories))
