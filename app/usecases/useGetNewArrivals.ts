import { useState } from 'react'

import type { EpisodeSummary } from '../repositories/api/IApiRepository'

export const useGetNewArrivals = () => {
  const [data] = useState<EpisodeSummary[] | null>([])
  const [loading] = useState(false)
  const refetch = async () => {}

  return { data, loading, refetch }
}
