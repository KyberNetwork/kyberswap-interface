import axios from 'axios'
import { useCallback } from 'react'
import { useUploadImageMutation } from 'services/social'
import { v4 as uuid } from 'uuid'

import { BUCKET_NAME } from 'constants/env'

export const useUploadImageToCloud = () => {
  const [uploadImage] = useUploadImageMutation()

  return useCallback(
    async (blob: Blob) => {
      try {
        const fileName = `${uuid()}.png`
        const file = new File([blob], fileName, { type: 'image/png' })
        const res = await uploadImage({
          fileName,
        }).unwrap()

        const url = res?.data?.signedURL

        if (!url) throw new Error('Upload error')
        await axios({ url, method: 'PUT', data: file })
        return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
      } catch (error) {
        return
      }
    },
    [uploadImage],
  )
}
