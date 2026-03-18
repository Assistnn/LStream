import { API_METHOD_CONFIG } from './apiConfig'
import { ApiMockRepository } from './ApiMockRepository'
import { ApiRepository } from './ApiRepository'
import type { IApiRepository } from './IApiRepository'

class RepositoryFactory {
  private static realRepository = new ApiRepository()
  private static mockRepository = new ApiMockRepository()

  static getApiRepository(): IApiRepository {
    return new Proxy({} as IApiRepository, {
      get: (_, prop: keyof IApiRepository) => {
        const mode = API_METHOD_CONFIG[prop]
        const repo = mode === 'mock' ? this.mockRepository : this.realRepository
        return repo[prop].bind(repo)
      },
    })
  }
}

export const apiRepository = RepositoryFactory.getApiRepository()
