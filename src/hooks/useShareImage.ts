import html2canvas from 'html2canvas'
import { useCallback } from 'react'
import { SHARE_TYPE, useCreateShareLinkMutation } from 'services/social'

import { useUploadImageToCloud } from 'hooks/social'

const useShareImage = () => {
  const uploadImage = useUploadImageToCloud()
  const [createShareLink] = useCreateShareLinkMutation()
  return useCallback(
    (element: HTMLDivElement | null, type: SHARE_TYPE): Promise<{ shareUrl: string; imageUrl: string; blob: Blob }> => {
      return new Promise(async (resolve, reject) => {
        console.log('🚀 ~ file: useShareImage.ts:32 ~ returnnewPromise ~ element:', element)

        if (!element) return reject('Not found element')
        const canvasData = await html2canvas(element, {
          allowTaint: true,
          useCORS: true,
        })
        canvasData.toBlob(async blob => {
          if (!blob) return reject('Not found blob')

          const imageUrl = await uploadImage(blob)
          if (!imageUrl) return reject('Upload img error')

          const shareUrl = await createShareLink({
            metaImageUrl: imageUrl,
            redirectURL: window.location.href,
            type,
          }).unwrap()
          return shareUrl ? resolve({ shareUrl, imageUrl, blob }) : reject()
        }, 'image/png')
      })
    },
    [createShareLink, uploadImage],
  )
}
export default useShareImage
