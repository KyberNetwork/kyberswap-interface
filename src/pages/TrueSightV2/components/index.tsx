import { Trans } from '@lingui/macro'
import React, { CSSProperties, ReactNode, useRef } from 'react'
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
  content-visibility: ${({ show }) => (show ?? 'auto' ? 'auto' : 'hidden')};
  padding: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => `background-color: ${theme.background};`}
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 500px;
`

export const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`
export const SectionDescription = styled.div`
  font-size: 12px;
  line-height: 16px;
  font-style: italic;
  color: ${({ theme }) => theme.subText};
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
  description?: string
  id?: string
  shareButton?: boolean
  fullscreenButton?: boolean
  onShareClick?: (tag?: string) => void
  tabs?: string[]
  activeTab?: ChartTab
  onTabClick?: (tab: ChartTab) => void
  children: React.ReactNode
  style?: React.CSSProperties
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <StyledSectionWrapper show={show} ref={ref} id={id} style={style}>
      {above768 ? (
        <>
          {/* DESKTOP */}
          <SectionTitle>
            <RowBetween>
              <RowFit gap="12px">
                {tabs &&
                  tabs.map((item, index) => {
                    return (
                      <TabButton
                        key={item}
                        text={item}
                        active={activeTab === index}
                        onClick={() => onTabClick?.(index)}
                      />
                    )
                  })}
                <Text>{title}</Text>
              </RowFit>
              <RowFit color={theme.subText} gap="12px">
                {shareButton && <ShareButton onClick={() => onShareClick?.(id)} />}
                {fullscreenButton && <FullscreenButton element={ref.current} />}
              </RowFit>
            </RowBetween>
          </SectionTitle>
          <SectionDescription dangerouslySetInnerHTML={{ __html: description || '' }} />
          {children}
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
          {children}
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

const StyledTabButton = styled.div<{ active?: boolean }>`
  padding: 8px 12px;
  font-size: 16px;
  line-height: 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${theme.primary + '30'};
          :active {
            box-shadow: 0 0 0 1px ${theme.primary + '30'};
          }
        `
      : css`
          color: ${theme.subText};
          border: 1px solid ${theme.subText};
          :active {
            box-shadow: 0 0 0 1px ${theme.subText};
          }
        `}
`

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
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${theme.primary + '40'};
          box-shadow: inset 0 -2px 0 0 ${theme.primary};
        `
      : css`
          color: ${theme.subText};
          box-shadow: inset 0 -1px 0 0 ${theme.border};
        `}
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
        <StyledTabButton active={active} onClick={onClick} style={style}>
          {text}
        </StyledTabButton>
      ) : (
        <StyledMobileTabButton active={active} onClick={onClick} style={style}>
          {text}
        </StyledMobileTabButton>
      )}
    </>
  )
}
