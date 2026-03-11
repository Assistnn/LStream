import { useCallback, useEffect, useState } from 'react'

import { useApiError } from './ApiErrorContext'

type PromiseValue<T> = T extends Promise<infer U> ? U : never

type ApiQueryResults<T extends readonly (() => Promise<unknown>)[]> = {
  [K in keyof T]: PromiseValue<ReturnType<T[K]>>
}

export const useApiQueries = <const T extends readonly (() => Promise<unknown>)[]>(apiFunctions: T) => {
  type Results = ApiQueryResults<T>

  const [data, setData] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const { handleError } = useApiError()

  const execute = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all(apiFunctions.map((fn) => fn()))
      setData(results as Results)
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
