import axios from 'axios'
import html2canvas from 'html2canvas'
import { useCallback } from 'react'
import { SHARE_TYPE, useCreateShareLinkMutation, useUploadImageMutation } from 'services/social'
import { v4 as uuid } from 'uuid'

import { BUCKET_NAME } from 'constants/env'

// todo danh combine this file with kyber ai prevent duplicate
const useShareImage = () => {
  const [uploadImage] = useUploadImageMutation()
  const [createShareLink] = useCreateShareLinkMutation()
  return useCallback(
    (element: HTMLDivElement | null): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        if (!element) return reject('Not found element')
        const canvasData = await html2canvas(element, {
          allowTaint: true,
          useCORS: true,
        })
        canvasData.toBlob(async blob => {
          if (!blob) return reject('Not found blob')

          const fileName = `${uuid()}.png`
          const file = new File([blob], fileName, { type: 'image/png' })
          const res: any = await uploadImage({
            fileName,
          })

          if (res?.data?.code !== 0) return reject('Error occur')

          const url = res.data.data.signedURL
          await axios({ url, method: 'PUT', data: file })

          const imageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`
          const link = await createShareLink({
            metaImageUrl: imageUrl,
            redirectURL: window.location.href,
            type: SHARE_TYPE.MY_EARNINGS,
          }).unwrap()
          return link ? resolve(link) : reject()
        }, 'image/png')
      })
    },
    [createShareLink, uploadImage],
  )
}
export default useShareImage
