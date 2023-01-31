import { Trans } from '@lingui/macro'
import React, { ReactNode, useRef } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import { RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

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
  children,
  style,
}: {
  show?: boolean
  title?: string
  description?: string
  id?: string
  shareButton?: boolean
  fullscreenButton?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  return (
    <StyledSectionWrapper show={show} ref={ref} id={id} style={style}>
      <SectionTitle>
        <RowBetween>
          {title}
          <RowFit color={theme.subText} gap="12px">
            {shareButton && <ShareButton />}
            {fullscreenButton && <FullscreenButton element={ref.current} />}
          </RowFit>
        </RowBetween>
      </SectionTitle>
      <SectionDescription dangerouslySetInnerHTML={{ __html: description || '' }} />
      {children}
    </StyledSectionWrapper>
  )
}

const StyledRequireConnectWalletWrapper = styled.div<{ bgUrl?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  border-radius: 10px;
  ${({ bgUrl }) => `background: url(${bgUrl});`}
  background-size: 100% 100%;
  background-position: center;
`

export const RequireConnectWalletWrapper = ({ bgUrl, children }: { bgUrl: string; children: ReactNode }) => {
  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  if (!account)
    return (
      <StyledRequireConnectWalletWrapper bgUrl={bgUrl}>
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
