import { motion } from 'framer-motion'
import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import getPopupTopRightDescriptionByType from 'components/Announcement/Popups/PopupTopRightDescriptions'
import SimplePopup from 'components/Announcement/Popups/SimplePopup'
import TransactionPopup from 'components/Announcement/Popups/TransactionPopup'
import {
  NotificationType,
  PopupContent,
  PopupContentAnnouncement,
  PopupContentSimple,
  PopupContentTxn,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { useSuccessSound } from 'hooks/useSuccessSound'
import useTheme from 'hooks/useTheme'
import { useRemovePopup } from 'state/application/hooks'
import { CloseIcon } from 'theme'

export const TOP_RIGHT_POPUP_EXIT_MS = 500

type PopupItemProps = {
  popup: PopupItemType
  hasOverlay: boolean
  closeSignal?: number
}

type PopupDisplayContent = {
  notiType: NotificationType
  popupContent: ReactNode
}

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
      transition={{ duration: removeAfterMs ? removeAfterMs / 1000 : undefined }}
    />
  )
}

const getPopupDisplayContent = (
  popupType: PopupType,
  content: PopupContent,
  removeThisPopup: () => void,
): PopupDisplayContent | null => {
  switch (popupType) {
    case PopupType.SIMPLE: {
      const { type = NotificationType.ERROR } = content as PopupContentSimple

      return {
        notiType: type,
        popupContent: <SimplePopup {...(content as PopupContentSimple)} type={type} />,
      }
    }
    case PopupType.TRANSACTION: {
      const { hash, type = NotificationType.ERROR } = content as PopupContentTxn

      return {
        notiType: type,
        popupContent: <TransactionPopup hash={hash} notiType={type} />,
      }
    }
    case PopupType.TOP_RIGHT: {
      const data = getPopupTopRightDescriptionByType(content as PopupContentAnnouncement)
      if (!data) return null

      return {
        notiType: data.type,
        popupContent: <SimplePopup {...data} onRemove={removeThisPopup} />,
      }
    }
    default:
      return null
  }
}

export default function PopupItem({ popup, hasOverlay, closeSignal = 0 }: PopupItemProps) {
  const { removeAfterMs, popupType, content } = popup
  const theme = useTheme()
  const playSuccessSound = useSuccessSound()
  const removePopup = useRemovePopup()

  const [isClosing, setIsClosing] = useState(false)
  const handledCloseSignalRef = useRef(closeSignal)
  const removePopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isClosingRef = useRef(false)

  const removeThisPopup = useCallback(() => {
    if (isClosingRef.current) return

    isClosingRef.current = true
    setIsClosing(true)
    removePopupTimeoutRef.current = setTimeout(() => removePopup(popup), TOP_RIGHT_POPUP_EXIT_MS)
  }, [popup, removePopup])

  useEffect(() => {
    return () => {
      if (removePopupTimeoutRef.current) clearTimeout(removePopupTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (closeSignal === handledCloseSignalRef.current) return
    handledCloseSignalRef.current = closeSignal
    if (closeSignal) removeThisPopup()
  }, [closeSignal, removeThisPopup])

  useEffect(() => {
    if (removeAfterMs === null) return
    const timeout = setTimeout(() => {
      removeThisPopup()
    }, Math.max(removeAfterMs - TOP_RIGHT_POPUP_EXIT_MS, 0))

    return () => {
      clearTimeout(timeout)
    }
  }, [removeAfterMs, removeThisPopup, content])

  useEffect(() => {
    if (popupType === PopupType.TRANSACTION && (content as PopupContentTxn).type === NotificationType.SUCCESS) {
      playSuccessSound()
    }
  }, [content, popupType, playSuccessSound])

  const displayContent = getPopupDisplayContent(popupType, content, removeThisPopup)
  if (!displayContent) return null

  const { notiType, popupContent } = displayContent

  const wrapperStyle: CSSProperties & Record<'--ks-popup-delta', string> = {
    '--ks-popup-delta': '100vw',
    animation: isClosing
      ? `ks-popup-ltr ${TOP_RIGHT_POPUP_EXIT_MS}ms ease-in-out forwards`
      : 'ks-popup-rtl 0.7s ease-in-out',
  }

  return (
    <div
      className="relative w-[min(calc(100vw-32px),425px)] overflow-hidden rounded-[10px] [isolation:isolate] max-md:m-auto"
      style={wrapperStyle}
    >
      <div className="absolute left-0 top-0 size-full bg-bg2" />
      <div
        className="relative inline-block w-full p-4 pr-3"
        style={{ background: getBackgroundColor(theme, notiType) }}
      >
        <div className="flex justify-between gap-2">
          {popupContent}
          <CloseIcon onClick={removeThisPopup} />
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
