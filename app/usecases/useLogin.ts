import { useApiMutation } from '../hooks/api/useApiMutation'
import { apiRepository } from '../repositories/api'

export const useLogin = () =>
  useApiMutation((credentials: Parameters<typeof apiRepository.login>[0]) => apiRepository.login(credentials))
