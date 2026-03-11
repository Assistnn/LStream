import { useCallback, useEffect, useState } from 'react'

import { useApiError } from './ApiErrorContext'

export const useApiQuery = <T>(apiFunction: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useApiError()

  const execute = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiFunction()
      setData(result)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    void execute()
  }, [])

  return { data, loading, refetch: execute }
}
