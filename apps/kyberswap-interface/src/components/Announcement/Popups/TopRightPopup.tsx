import { motion } from 'framer-motion'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'

import getPopupTopRightDescriptionByType from 'components/Announcement/Popups/PopupTopRightDescriptions'
import SimplePopup from 'components/Announcement/Popups/SimplePopup'
import TransactionPopup from 'components/Announcement/Popups/TransactionPopup'
import {
  NotificationType,
  PopupContentAnnouncement,
  PopupContentSimple,
  PopupContentTxn,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { useSuccessSound } from 'hooks/useSuccessSound'
import useTheme from 'hooks/useTheme'
import { useRemovePopup } from 'state/application/hooks'

const delta = window.innerWidth + 'px'

const getBackgroundColor = (theme: ReturnType<typeof useTheme>, type: NotificationType = NotificationType.ERROR) => {
  const mapColor = {
    [NotificationType.SUCCESS]: theme.bgSuccess,
    [NotificationType.ERROR]: theme.bgError,
    [NotificationType.WARNING]: theme.bgWarning,
  }
  return mapColor[type]
}

const WrappedAnimatedFader = ({ removeAfterMs }: { removeAfterMs: number | null }) => {
  return (
    <motion.div
      className="absolute bottom-0 left-0 h-0.5 w-full bg-subText"
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: removeAfterMs ?? undefined }}
    />
  )
}

export default function PopupItem({ popup, hasOverlay }: { popup: PopupItemType; hasOverlay: boolean }) {
  const { removeAfterMs, popupType, content } = popup
  const playSuccessSound = useSuccessSound()

  const [isRestartAnimation, setRestartAnimation] = useState(false)
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popup), [popup, removePopup])

  useEffect(() => {
    if (removeAfterMs === null) return
    const timeout = setTimeout(() => {
      removeThisPopup()
    }, removeAfterMs)
    requestAnimationFrame(() => setRestartAnimation(false))

    return () => {
      clearTimeout(timeout)
      setRestartAnimation(true)
    }
  }, [removeAfterMs, removeThisPopup, content])

  const theme = useTheme()

  let notiType = NotificationType.SUCCESS
  let popupContent: React.ReactNode | null = null

  useEffect(() => {
    if (popupType === PopupType.TRANSACTION && (content as PopupContentTxn).type === NotificationType.SUCCESS) {
      playSuccessSound()
    }
  }, [content, popupType, playSuccessSound, notiType])

  switch (popupType) {
    case PopupType.SIMPLE: {
      const { type = NotificationType.ERROR } = content as PopupContentSimple
      notiType = type
      popupContent = <SimplePopup {...(content as PopupContentSimple)} type={type} />
      break
    }
    case PopupType.TRANSACTION: {
      const { hash, type = NotificationType.ERROR } = content as PopupContentTxn
      notiType = type
      popupContent = <TransactionPopup hash={hash} notiType={notiType} />
      break
    }
    case PopupType.TOP_RIGHT: {
      const data = getPopupTopRightDescriptionByType(content as PopupContentAnnouncement)
      if (!data) return null
      notiType = data.type
      popupContent = <SimplePopup {...data} onRemove={removeThisPopup} />
      break
    }
  }

  if (!popupContent) return null

  const ltrDelay = (removeAfterMs || 15000) / 1000 - 0.2
  const wrapperStyle: CSSProperties & Record<'--ks-popup-delta', string> = {
    '--ks-popup-delta': delta,
    animation: `ks-popup-rtl 0.7s ease-in-out, ks-popup-ltr 0.5s ease-in-out ${ltrDelay}s`,
  }

  return isRestartAnimation ? (
    <div />
  ) : (
    <div
      className="relative w-[min(calc(100vw-32px),425px)] overflow-hidden rounded-[10px] [isolation:isolate] max-md:m-auto [&:not(:first-of-type)]:mt-[15px]"
      style={wrapperStyle}
    >
      <div className="absolute left-0 top-0 size-full bg-bg2" />
      <div
        className="relative inline-block w-full py-5 pl-5 pr-3"
        style={{ background: getBackgroundColor(theme, notiType) }}
      >
        <div className="flex justify-between">
          {popupContent}
          <X color={theme.text2} onClick={removeThisPopup} className="ml-[10px] min-w-[24px] hover:cursor-pointer" />
        </div>
        {removeAfterMs && <WrappedAnimatedFader removeAfterMs={removeAfterMs} />}
      </div>
      {hasOverlay && (
        <div
          className="absolute left-0 top-0 flex size-full"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40.1%, rgba(0,0,0,0.8) 100%)' }}
        />
      )}
    </div>
  )
}
