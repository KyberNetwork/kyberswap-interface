import axios from 'axios'
import { useCallback } from 'react'
import { useUploadImageMutation } from 'services/social'
import { v4 as uuid } from 'uuid'

import { BUCKET_NAME } from 'constants/env'

export const IMAGE_ALLOW_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']

export const useUploadImageToCloud = () => {
  const [uploadImage] = useUploadImageMutation()

  return useCallback(
    async (fileObject: Blob | File) => {
      try {
        const file = fileObject as File
        const ext = file.name?.split('.')?.pop() ?? ''
        if (ext && !IMAGE_ALLOW_EXTENSIONS.includes(ext.toLowerCase())) throw new Error('File is not support')
        const fileName = `${uuid() + Date.now()}.${ext || 'png'}`
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
    [uploadImage],
  )
}
