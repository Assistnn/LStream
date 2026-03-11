import { ApiMockRepository } from './ApiMockRepository'
import { ApiRepository } from './ApiRepository'
import type { IApiRepository } from './IApiRepository'

class RepositoryFactory {
  private static apiRepository: IApiRepository

  static getApiRepository() {
    if (!this.apiRepository) {
      this.apiRepository = __DEV__ ? new ApiMockRepository() : new ApiRepository()
    }
    return this.apiRepository
  }
}

export const apiRepository = RepositoryFactory.getApiRepository()
