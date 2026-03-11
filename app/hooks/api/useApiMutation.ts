import { useCallback, useState } from 'react'

import { useApiError } from './ApiErrorContext'

export const useApiMutation = <TArgs extends unknown[], TResult>(apiFunction: (...args: TArgs) => Promise<TResult>) => {
  const [loading, setLoading] = useState(false)
  const { handleError } = useApiError()
  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true)
      try {
        const result = await apiFunction(...args)
        return result
      } catch (error) {
        handleError(error)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, handleError],
  )

  return { execute, loading }
}
