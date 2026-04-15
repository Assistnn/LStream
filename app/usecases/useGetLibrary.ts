import { useApiQuery } from '../hooks/api/useApiQuery'
import { apiRepository } from '../repositories/api'
import type { LibrariesParams } from '../repositories/api/IApiRepository'

export const useGetLibrary = (params: LibrariesParams) =>
  useApiQuery(
    () => apiRepository.getLibraries(params).then((response) => response.libraries),
    [params.type, params.order, params.asc, params.category, params.keyword],
  )
