import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { ChartTab } from '../types'

export const StyledSectionWrapper = styled.div<{ show?: boolean }>`
  display: ${({ show }) => (show ?? 'auto' ? 'auto' : 'none !important')};
  content-visibility: auto;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  /* ${({ theme }) => `background-color: ${theme.background};`} */
  background: ${({ theme }) =>
    theme.darkMode
      ? `linear-gradient(332deg, rgb(32 32 32) 0%, rgba(15, 15, 15, 1) 80%)`
      : `linear-gradient(34.68deg, rgba(193, 193, 193, 0.1) 9.77%, rgba(255, 255, 255, 0) 108.92%);`};
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 580px;
`

export const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  margin: 0px -16px;
  padding: 0px 16px 16px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border + '80'};
  color: ${({ theme }) => theme.text};
`
export const SectionDescription = styled.div<{ show?: boolean }>`
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
  color: ${({ theme }) => theme.subText};
  ${({ show }) =>
    show &&
    css`
      white-space: initial;
    `}
`
export const ContentWrapper = styled.div`
  content-visibility: auto;
  contain-intrinsic-height: auto;
`

const ButtonWrapper = styled.div`
  color: ${({ theme }) => theme.subText};
  height: 24px;
  width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => theme.border + '33'};
  }
`
export const FullscreenButton = React.memo(function FCButton({ element }: { element?: HTMLDivElement | null }) {
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      element?.requestFullscreen()
    }
  }

  return (
    <ButtonWrapper onClick={toggleFullscreen}>
      <Icon id="fullscreen" size={16} />
    </ButtonWrapper>
  )
})

export const ShareButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <ButtonWrapper onClick={onClick}>
      <Icon id="share" size={16} />
    </ButtonWrapper>
  )
}

export const SectionWrapper = ({
  show,
  title,
  subTitle,
  description,
  id,
  shareButton,
  fullscreenButton,
  onShareClick,
  tabs,
  activeTab,
  onTabClick,
  children,
  style,
}: {
  show?: boolean
  title?: string | ReactNode
  subTitle?: string | ReactNode
  description?: ReactNode
  id?: string
  shareButton?: boolean
  fullscreenButton?: boolean
  onShareClick?: (tag?: string) => void
  tabs?: string[]
  activeTab?: ChartTab
  onTabClick?: (tab: ChartTab) => void
  children?: React.ReactNode
  style?: React.CSSProperties
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const [showText, setShowText] = useState(true)

  const descriptionRef = useRef<HTMLDivElement>(null)

  const isTextExceeded =
    description && descriptionRef.current && descriptionRef.current?.clientWidth <= descriptionRef.current?.scrollWidth

  return (
    <StyledSectionWrapper show={show} ref={ref} id={id} style={style}>
      {above768 ? (
        <>
          {/* DESKTOP */}
          <SectionTitle>
            <RowBetween style={{ height: '16px' }}>
              <RowFit
                style={{
                  margin: '-16px',
                }}
              >
                {tabs ? (
                  tabs.map((item, index) => {
                    return (
                      <TabButton
                        key={item}
                        text={item}
                        active={activeTab === index}
                        onClick={() => onTabClick?.(index)}
                        style={{ padding: '16px', fontSize: '16px', lineHeight: '16px', height: '48px' }}
                      />
                    )
                  })
                ) : (
                  <Text marginLeft="16px">{title}</Text>
                )}
              </RowFit>
              <RowFit color={theme.subText} gap="12px">
                {subTitle && (
                  <Text fontStyle="italic" fontSize="12px" lineHeight="16px" color={theme.subText}>
                    {subTitle}
                  </Text>
                )}
                {shareButton && <ShareButton onClick={() => onShareClick?.(id)} />}
                {fullscreenButton && <FullscreenButton element={ref.current} />}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          {tabs && activeTab !== undefined && title && (
            <Row>
              <Text fontSize="16px" lineHeight="20px" color={theme.text} fontWeight={500}>
                {tabs[activeTab] + ' ' + title}
              </Text>
            </Row>
          )}
          <Row gap="4px">
            <SectionDescription show={showText} ref={descriptionRef}>
              {description}
              {showText && isTextExceeded && (
                <Text
                  as="span"
                  fontSize="14px"
                  color={theme.primary}
                  width="fit-content"
                  style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
                  onClick={() => setShowText(prev => !prev)}
                >
                  {' '}
                  {'Hide'}
                </Text>
              )}
            </SectionDescription>
            {!showText && isTextExceeded && (
              <Text
                as="span"
                fontSize="14px"
                color={theme.primary}
                width="fit-content"
                style={{ cursor: 'pointer', flexBasis: 'fit-content', whiteSpace: 'nowrap' }}
                onClick={() => setShowText(prev => !prev)}
              >
                {'Read more'}
              </Text>
            )}
          </Row>
          {children || <></>}
        </>
      ) : (
        <>
          {/* MOBILE */}
          <SectionTitle>
            <Row
              style={{
                width: 'calc(100% + 32px)',
                margin: '-16px -16px 16px -16px',
              }}
            >
              {tabs &&
                tabs.map((item, index) => {
                  return (
                    <TabButton
                      key={item}
                      text={item}
                      active={activeTab === index}
                      onClick={() => onTabClick?.(index)}
                      style={{ flex: 1 }}
                    />
                  )
                })}
            </Row>
            <RowBetween>
              <MouseoverTooltip text={description}>
                <Text
                  style={{
                    fontSize: '14px',
                    textDecoration: `underline dotted ${theme.subText}`,
                    textUnderlineOffset: '6px',
                  }}
                >
                  {(tabs ? tabs[activeTab || 0] + ' ' : '') + title}
                </Text>
              </MouseoverTooltip>
              <RowFit color={theme.subText} gap="12px">
                {shareButton && <ShareButton onClick={() => onShareClick?.(id)} />}
                {fullscreenButton && <FullscreenButton element={ref.current} />}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          {children || <></>}
        </>
      )}
    </StyledSectionWrapper>
  )
}

const StyledRequireConnectWalletWrapper = styled.div<{ bgUrl?: string; height?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: ${({ height }) => height || '100%'};
  border-radius: 10px;
  ${({ bgUrl }) => `background: url(${bgUrl});`}
  background-size: 100% 100%;
  background-position: center;
`

export const RequireConnectWalletWrapper = ({
  bgUrl,
  height,
  children,
}: {
  bgUrl: string
  height?: string
  children: ReactNode
}) => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  if (!account)
    return (
      <StyledRequireConnectWalletWrapper bgUrl={bgUrl} height={height}>
        <Text color={theme.text}>
          <Trans>Connect your wallet to view this insight</Trans>
        </Text>
        <ButtonPrimary
          onClick={toggleWalletModal}
          width="138px"
          height="36px"
          style={{ boxShadow: '0 2px 4px 2px #00000030' }}
        >
          <Trans>Connect Wallet</Trans>
        </ButtonPrimary>
      </StyledRequireConnectWalletWrapper>
    )
  return <>{children}</>
}

// const StyledTabButton = styled.div<{ active?: boolean }>`
//   padding: 8px 12px;
//   font-size: 16px;
//   line-height: 20px;
//   border-radius: 20px;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   border: 1px solid transparent;
//   :hover {
//     filter: brightness(0.9);
//   }
//   :active {
//     filter: brightness(1.2);
//   }
//   ${({ theme, active }) =>
//     active
//       ? css`
//           color: ${theme.primary};
//           background-color: ${theme.primary + '30'};
//           :active {
//             box-shadow: 0 0 0 1px ${theme.primary + '30'};
//           }
//         `
//       : css`
//           color: ${theme.subText};
//           border: 1px solid ${theme.subText};
//           :active {
//             box-shadow: 0 0 0 1px ${theme.subText};
//           }
//         `}
// `

const StyledMobileTabButton = styled.div<{ active?: boolean }>`
  font-size: 12px;
  line-height: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  flex: 1;
  box-sizing: border-box;
  cursor: pointer;
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${theme.primary + '40'};
          box-shadow: inset 0 -2px 0 0 ${theme.primary};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.background};
        `}

  :hover {
    filter: brightness(1.2);
  }
`

export const TabButton = ({
  text,
  active,
  onClick,
  style,
}: {
  text?: string
  active?: boolean
  onClick?: () => void
  style?: CSSProperties
}) => {
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <>
      {above768 ? (
        <StyledMobileTabButton active={active} onClick={onClick} style={style}>
          {text}
        </StyledMobileTabButton>
      ) : (
        <StyledMobileTabButton active={active} onClick={onClick} style={style}>
          {text}
        </StyledMobileTabButton>
      )}
    </>
  )
}
