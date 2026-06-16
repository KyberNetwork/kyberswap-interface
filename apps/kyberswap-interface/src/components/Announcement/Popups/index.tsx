import { Trans } from '@lingui/macro'
import { useEffect, useRef } from 'react'

import CenterPopup from 'components/Announcement/Popups/CenterPopup'
import SnippetPopup from 'components/Announcement/Popups/SnippetPopup'
import TopRightPopup from 'components/Announcement/Popups/TopRightPopup'
import { PopupType, PrivateAnnouncementType } from 'components/Announcement/type'
import { ButtonEmpty } from 'components/Button'
import useNotificationLimitOrder from 'components/swapv2/LimitOrder/hooks/useNotificationLimitOrder'
import { TIMES_IN_SECS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import {
  useActivePopups,
  useAddPopup,
  useRemoveAllPopupByType,
  useToggleNotificationCenter,
} from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { cn } from 'utils/cn'
import {
  subscribeAnnouncement,
  subscribePrivateAnnouncement,
  subscribePrivateAnnouncementProfile,
} from 'utils/firebase'

const MAX_NOTIFICATION = 4

export default function Popups() {
  const { topRightPopups, centerPopups, snippetPopups, topPopups } = useActivePopups()
  const centerPopup = centerPopups[centerPopups.length - 1]
  const { account, chainId } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()

  const toggleNotificationCenter = useToggleNotificationCenter()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const addPopup = useAddPopup()

  const removeAllPopupByType = useRemoveAllPopupByType()

  const clearAllTopRightPopup = () => removeAllPopupByType(PopupType.TOP_RIGHT)
  const clearAllSnippetPopup = () => removeAllPopupByType(PopupType.SNIPPET)
  const clearAllCenterPopup = () => removeAllPopupByType(PopupType.CENTER)

  const isInit = useRef(false)

  useEffect(() => {
    if (isShowTutorial) return
    const unsubscribe = subscribeAnnouncement(data => {
      data.forEach(item => {
        const { popupType } = item.templateBody
        if ((!isInit.current && popupType === PopupType.CENTER) || popupType !== PopupType.CENTER) {
          addPopup({
            content: item,
            popupType,
            key: item.metaMessageId,
            removeAfterMs: null,
          })
        }
      })
      isInit.current = true
    })

    const unsubscribePrivate = subscribePrivateAnnouncement(account, data => {
      data.forEach(item => {
        switch (item.templateType) {
          case PrivateAnnouncementType.DIRECT_MESSAGE: {
            const { templateBody, metaMessageId } = item
            addPopup({
              content: item,
              popupType: templateBody.popupType,
              key: metaMessageId,
              account,
            })
            break
          }
        }
      })
    })
    const unsubscribePrivateProfile = subscribePrivateAnnouncementProfile(userInfo?.identityId, data => {
      data.forEach(item => {
        switch (item.templateType) {
          case PrivateAnnouncementType.PRICE_ALERT:
            const mins = (Date.now() / 1000 - item.createdAt) / TIMES_IN_SECS.ONE_MIN
            if (mins <= 5)
              addPopup({
                content: item,
                popupType: PopupType.TOP_RIGHT,
                key: item.metaMessageId,
                removeAfterMs: 15_000,
              })
            break
        }
      })
    })
    return () => {
      unsubscribe?.()
      unsubscribePrivate?.()
      unsubscribePrivateProfile?.()
    }
  }, [account, isShowTutorial, addPopup, chainId, userInfo?.identityId])

  useNotificationLimitOrder()
  const totalTopRightPopup = topRightPopups.length
  const hasTopbarPopup = topPopups.length !== 0

  return (
    <>
      {topRightPopups.length > 0 && (
        <div
          className={cn(
            'fixed right-4 z-[9999] flex flex-col items-end',
            hasTopbarPopup ? 'top-[156px]' : 'top-[108px]',
            'max-md:inset-x-0 max-md:items-center',
            hasTopbarPopup ? 'max-md:top-[170px]' : 'max-md:top-[110px]',
            hasTopbarPopup ? 'max-sm:top-[170px]' : 'max-sm:top-[70px]',
          )}
        >
          <div className="flex w-full justify-end gap-2.5 max-md:pr-4">
            {totalTopRightPopup >= MAX_NOTIFICATION && (
              <ButtonEmpty
                onClick={toggleNotificationCenter}
                className="w-fit rounded-[30px] bg-border px-2.5 py-1 text-[10px] text-text"
              >
                <Trans>See All</Trans>
              </ButtonEmpty>
            )}
            {totalTopRightPopup > 1 && (
              <ButtonEmpty
                onClick={clearAllTopRightPopup}
                className="w-fit rounded-[30px] bg-border px-2.5 py-1 text-[10px] text-text"
              >
                <Trans>Clear All</Trans>
              </ButtonEmpty>
            )}
          </div>

          {topRightPopups.slice(0, MAX_NOTIFICATION).map((item, i) => (
            <TopRightPopup key={item.key} popup={item} hasOverlay={i === MAX_NOTIFICATION - 1} />
          ))}
        </div>
      )}
      {snippetPopups.length > 0 && <SnippetPopup data={snippetPopups} clearAll={clearAllSnippetPopup} />}
      {centerPopup && <CenterPopup data={centerPopup} onDismiss={clearAllCenterPopup} />}
    </>
  )
}
