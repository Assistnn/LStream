import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetMe = () => useApiQuery(() => apiRepository.getMe())
