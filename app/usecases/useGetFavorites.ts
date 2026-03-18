import { useCallback, useEffect, useState } from 'react'

import { useApiError } from '../hooks/api/ApiErrorContext'
import { apiRepository } from '../repositories/api'

export const useGetFavorites = () => {
  const [series, setSeries] = useState<Awaited<ReturnType<typeof apiRepository.getFavorites>>['series'] | null>(null)
  const [episodes, setEpisodes] = useState<Awaited<ReturnType<typeof apiRepository.getFavorites>>['episodes'] | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const { handleError } = useApiError()

  const execute = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiRepository.getFavorites()
      setSeries(result.series)
      setEpisodes(result.episodes)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    void execute()
  }, [])

  return { series, episodes, loading, refetch: execute }
}
