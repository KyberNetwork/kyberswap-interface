import { useMemo } from 'react'

import { EMPTY_ARRAY } from 'constants/index'
import uriToHttp from 'utils/uriToHttp'

export default function useHttpLocations(uri: string | undefined): string[] {
  return useMemo(() => {
    return uri ? uriToHttp(uri) : EMPTY_ARRAY
  }, [uri])
}
