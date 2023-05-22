import axios from 'axios'
import { useUploadImageMutation } from 'services/social'
import { v4 as uuid } from 'uuid'

import { BUCKET_NAME } from 'constants/env'

export const useUploadImageToCloud = async (blob: Blob) => {
  const [uploadImage] = useUploadImageMutation()

  const fileName = `${uuid()}.png`
  const file = new File([blob], fileName, { type: 'image/png' })
  const res = await uploadImage({
    fileName,
  }).unwrap()

  const url = res?.data?.data?.signedURL
  if (!url) throw new Error('Upload error')
  await axios({ url, method: 'PUT', data: file })

  const imageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`

  return imageUrl
}
