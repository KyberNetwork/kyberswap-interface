import html2canvas from 'html2canvas'
import { useCallback } from 'react'
import { SHARE_TYPE, useCreateShareLinkMutation, usePatchShareLinkMutation } from 'services/social'

import { useUploadImageToCloud } from 'hooks/social'

const useShareImage = () => {
  const uploadImage = useUploadImageToCloud()
  const [patchShareLink] = usePatchShareLinkMutation()
  const [createShareLink] = useCreateShareLinkMutation()
  return useCallback(
    (
      element: HTMLDivElement | null,
      type: SHARE_TYPE,
      shareLinkId?: string,
    ): Promise<{ shareUrl?: string; imageUrl: string; blob: Blob }> => {
      return new Promise(async (resolve, reject) => {
        if (!element) return reject('Not found element')
        const canvasData = await html2canvas(element, {
          allowTaint: true,
          useCORS: true,
        })
        canvasData.toBlob(async blob => {
          if (!blob) return reject('Not found blob')

          const imageUrl = await uploadImage(blob)
          if (!imageUrl) return reject('Upload img error')
          if (shareLinkId) {
            await patchShareLink({
              id: shareLinkId,
              metaImageURL: imageUrl,
            }).unwrap()
            return resolve({ imageUrl, blob })
          }
          const shareUrl = await createShareLink({
            metaImageURL: imageUrl,
            redirectURL: window.location.href,
            type,
          }).unwrap()
          return shareUrl ? resolve({ shareUrl, imageUrl, blob }) : reject()
        }, 'image/png')
      })
    },
    [patchShareLink, uploadImage, createShareLink],
  )
}
export default useShareImage
