import { useCallback, useEffect, useRef, useState } from 'react'

import { useApiError } from './ApiErrorContext'

export const useApiQuery = <T>(apiFunction: () => Promise<T>, deps: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useApiError()
  const apiFunctionRef = useRef(apiFunction)

  useEffect(() => {
    apiFunctionRef.current = apiFunction
  }, [apiFunction])

  const execute = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiFunctionRef.current()
      setData(result)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    void execute()
  }, [execute, ...deps])

  return { data, loading, refetch: execute }
}
