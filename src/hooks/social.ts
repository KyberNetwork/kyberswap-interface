import axios from 'axios'
import { useCallback } from 'react'
import { useUploadImageMutation } from 'services/social'
import { v4 as uuid } from 'uuid'

import { BUCKET_NAME } from 'constants/env'
import { useSessionInfo } from 'state/authen/hooks'

export const IMAGE_ALLOW_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']

export const useUploadImageToCloud = () => {
  const [uploadImage] = useUploadImageMutation()
  const { userInfo } = useSessionInfo()

  return useCallback(
    async (fileObject: Blob | File) => {
      try {
        if (!userInfo?.identityId) throw new Error('invalid operation')
        const file = fileObject as File
        const ext = file.name?.split('.')?.pop() ?? ''
        if (ext && !IMAGE_ALLOW_EXTENSIONS.includes(ext.toLowerCase())) throw new Error('File is not support')
        const fileName = `${userInfo?.identityId}_${uuid()}_${Date.now()}.${ext || 'png'}`
        const res = await uploadImage({
          fileName,
        }).unwrap()

        const url = res?.data?.signedURL

        if (!url) throw new Error('Upload error')
        await axios({
          url,
          method: 'PUT',
          data: file,
          headers: {
            'Content-Type': file.type,
          },
        })
        return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
      } catch (error) {
        return
      }
    },
    [uploadImage, userInfo?.identityId],
  )
}
