import { motion } from 'framer-motion'
import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'react-feather'
import { Flex } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import {
  NotificationType,
  PopupContentAnnouncement,
  PopupContentSimple,
  PopupContentTxn,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'
import { useRemovePopup } from 'state/application/hooks'

import getPopupTopRightDescriptionByType from './PopupTopRightDescriptions'
import SimplePopup from './SimplePopup'
import TransactionPopup from './TransactionPopup'

const StyledClose = styled(X)`
  margin-left: 10px;
  min-width: 24px;
  :hover {
    cursor: pointer;
  }
`
const delta = window.innerWidth + 'px'

const rtl = keyframes`
  from {
    opacity: 0;
    transform: translateX(${delta});
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const ltr = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(${delta});
  }
`

const getBackgroundColor = (theme: DefaultTheme, type: NotificationType = NotificationType.ERROR) => {
  const mapColor = {
    [NotificationType.SUCCESS]: theme.bgSuccess,
    [NotificationType.ERROR]: theme.bgError,
    [NotificationType.WARNING]: theme.bgWarning,
  }
  return mapColor[type]
}

const Popup = styled.div<{ type?: NotificationType }>`
  display: inline-block;
  width: 100%;
  background: ${({ theme, type }) => getBackgroundColor(theme, type)};
  position: relative;
  padding: 20px;
  padding-right: 12px;
`

const Fader = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: ${({ theme }) => theme.subText};
`

const AnimatedFader = motion(Fader)

const PopupWrapper = styled.div<{ removeAfterMs?: number | null }>`
  position: relative;
  isolation: isolate;
  border-radius: 10px;
  overflow: hidden;
  width: min(calc(100vw - 32px), 425px);
  animation: ${rtl} 0.7s ease-in-out,
    ${ltr} 0.5s ease-in-out ${({ removeAfterMs }) => (removeAfterMs || 15000) / 1000 - 0.2}s; // animation out auto play after removeAfterMs - 0.2 seconds
  &:not(:first-of-type) {
    margin-top: 15px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: auto;
  `}
`

const SolidBackgroundLayer = styled.div`
  background: ${({ theme }) => theme.bg2};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const WrappedAnimatedFader = ({ removeAfterMs }: { removeAfterMs: number | null }) => {
  return (
    <AnimatedFader
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: removeAfterMs ?? undefined }}
    />
  )
}

const Overlay = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) =>
    `linear-gradient(180deg, ${rgba(theme.black, 0)} 40.1%, ${rgba(theme.black, 0.8)} 100%)`};
`

export default function PopupItem({ popup, hasOverlay }: { popup: PopupItemType; hasOverlay: boolean }) {
  const { removeAfterMs, popupType, content } = popup

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
  let popupContent
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
  return isRestartAnimation ? (
    <div />
  ) : (
    <PopupWrapper removeAfterMs={removeAfterMs}>
      <SolidBackgroundLayer />
      <Popup type={notiType}>
        <Flex justifyContent={'space-between'}>
          {popupContent}
          <StyledClose color={theme.text2} onClick={removeThisPopup} />
        </Flex>
        {removeAfterMs && <WrappedAnimatedFader removeAfterMs={removeAfterMs} />}
      </Popup>
      {hasOverlay && <Overlay />}
    </PopupWrapper>
  )
}
