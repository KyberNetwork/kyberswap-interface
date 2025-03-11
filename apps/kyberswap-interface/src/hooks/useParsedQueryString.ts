import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { queryStringToObject } from 'utils/string'

export default function useParsedQueryString<T extends { [key: string]: string }>(): Partial<T> {
  const { search } = useLocation()
  return useMemo(() => (search && search.length > 1 ? queryStringToObject(search) : {}) as Partial<T>, [search])
}
