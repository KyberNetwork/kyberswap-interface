import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import copyTradingApi from 'services/copyTrading'

import { useAppDispatch } from 'state/hooks'

const useRefreshCopyTrading = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return useCallback(() => {
    dispatch(copyTradingApi.util.invalidateTags(['CopyTrading']))
    void queryClient.invalidateQueries({ queryKey: ['copy-trading'] })
  }, [dispatch, queryClient])
}

export default useRefreshCopyTrading
