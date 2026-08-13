import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import CenterPopup from 'components/Announcement/Popups/CenterPopup'
import SnippetPopup from 'components/Announcement/Popups/SnippetPopup'
import TopRightPopup, { TOP_RIGHT_POPUP_EXIT_MS } from 'components/Announcement/Popups/TopRightPopup'
import { PopupType, PrivateAnnouncementType } from 'components/Announcement/type'
import { ButtonEmpty } from 'components/Button'
import { useNotificationLimitOrder } from 'components/LimitOrder/hooks/useNotificationLimitOrder'
import { TIMES_IN_SECS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useActivePopups, useAddPopup, useRemoveAllPopupByType, useRemovePopup } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { cn } from 'utils/cn'
import {
  subscribeAnnouncement,
  subscribePrivateAnnouncement,
  subscribePrivateAnnouncementProfile,
} from 'utils/firebase'

const MAX_NOTIFICATION = 4

const ClearAllIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none">
    <line x1="4" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="2.5" y1="8" x2="12.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export default function Popups() {
  const { topRightPopups, centerPopups, snippetPopups, topPopups } = useActivePopups()
  const { account, chainId } = useActiveWeb3React()
  const { userInfo } = useSessionInfo()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()

  const addPopup = useAddPopup()

  const removeAllPopupByType = useRemoveAllPopupByType()
  const removePopup = useRemovePopup()

  const [clearAllTopRightSignal, setClearAllTopRightSignal] = useState(0)
  const clearAllTopRightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInit = useRef(false)

  const clearAllTopRightPopups = () => {
    if (clearAllTopRightTimeoutRef.current) clearTimeout(clearAllTopRightTimeoutRef.current)

    const popupsToRemove = topRightPopups
    setClearAllTopRightSignal(value => value + 1)
    clearAllTopRightTimeoutRef.current = setTimeout(() => {
      popupsToRemove.forEach(removePopup)
      clearAllTopRightTimeoutRef.current = null
    }, TOP_RIGHT_POPUP_EXIT_MS)
  }
  const clearAllSnippetPopup = () => removeAllPopupByType(PopupType.SNIPPET)
  const clearAllCenterPopup = () => removeAllPopupByType(PopupType.CENTER)

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

  useEffect(() => {
    return () => {
      if (clearAllTopRightTimeoutRef.current) clearTimeout(clearAllTopRightTimeoutRef.current)
    }
  }, [])

  useNotificationLimitOrder()

  const centerPopup = centerPopups[centerPopups.length - 1]
  const visibleTopRightPopups = topRightPopups.slice(0, MAX_NOTIFICATION)
  const hasTopbarPopup = topPopups.length !== 0
  const showClearAllTopRightPopup = topRightPopups.length > 1

  return (
    <>
      {topRightPopups.length > 0 && (
        <div
          className={cn(
            'fixed right-4 z-[9999] flex flex-col items-end gap-4',
            'max-md:inset-x-0 max-md:items-center',
            {
              'top-[148px] max-md:top-[162px] max-sm:top-[162px]': hasTopbarPopup,
              'top-[100px] max-md:top-[102px] max-sm:top-[62px]': !hasTopbarPopup,
            },
          )}
        >
          {showClearAllTopRightPopup && (
            <div className="absolute -top-8 right-0 flex justify-end max-md:right-4">
              <ButtonEmpty
                aria-label="Clear all notifications"
                title="Clear all notifications"
                onClick={clearAllTopRightPopups}
                className="flex h-6 w-fit items-center gap-1 rounded-full bg-buttonGray px-2 py-0 text-xs text-subText hover:text-text-60"
              >
                <ClearAllIcon />
                <span>Clear All</span>
              </ButtonEmpty>
            </div>
          )}

          {visibleTopRightPopups.map((item, i) => (
            <motion.div
              key={item.key}
              layout
              className="w-[min(calc(100vw-32px),425px)] max-md:m-auto"
              transition={{ layout: { duration: 0.16, ease: 'easeInOut' } }}
            >
              <TopRightPopup
                popup={item}
                hasOverlay={i === MAX_NOTIFICATION - 1}
                closeSignal={clearAllTopRightSignal}
              />
            </motion.div>
          ))}
        </div>
      )}
      {snippetPopups.length > 0 && <SnippetPopup data={snippetPopups} clearAll={clearAllSnippetPopup} />}
      {centerPopup && <CenterPopup data={centerPopup} onDismiss={clearAllCenterPopup} />}
    </>
  )
}
