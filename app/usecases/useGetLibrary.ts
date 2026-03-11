import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetLibrary = () => useApiQuery(() => apiRepository.getLibrary())
