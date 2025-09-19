import { useCallback } from 'react'
import announcementApi from 'services/announcement'
import limitOrderApi from 'services/limitOrder'

import { useAppDispatch } from 'state/hooks'

const useInvalidateTags = (api: any) => {
  const dispatch = useAppDispatch()
  return useCallback(
    (tag: string | string[]) => {
      dispatch(api.util.invalidateTags(Array.isArray(tag) ? tag : [tag]))
    },
    [dispatch, api],
  )
}

export const useInvalidateTagAnnouncement = () => {
  return useInvalidateTags(announcementApi)
}

export const useInvalidateTagLimitOrder = () => {
  return useInvalidateTags(limitOrderApi)
}
