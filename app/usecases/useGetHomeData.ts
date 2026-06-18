import { useAuth } from '../hooks/AuthContext'
import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'

export const useGetHomeData = () => {
  const { activeTenant } = useAuth()
  return useApiQuery(() => apiRepository.getHome(), [activeTenant?.account, activeTenant?.server_id])
}
