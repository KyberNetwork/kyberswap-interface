import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { MEDIA_WIDTHS } from 'theme'

const ContentWrapper = styled(Flex)`
  flex-direction: column;
  gap: 12px;
  padding: 28px;
  width: 100%;
  background-color: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 10px;
    padding: 20px 20px 24px;
  `}
`

const Title = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text};
  line-height: 24px;
  text-align: center;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
    line-height: 22px;
  `}
`

const SectionRow = styled(Flex)`
  align-items: center;
  gap: 16px;
  margin-top: 4px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    gap: 12px;
  `}
`

const Badge = styled(Flex)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.text};
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex: 0 0 36px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    font-size: 14px;
  `}
`

const SectionText = styled(Text)`
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.text};
  margin-top: 2px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    line-height: 22px;
    margin-top: 0;
  `}
`

const Bullets = styled.ul`
  list-style: disc;
  list-style-position: outside;
  margin: -8px 0 0 60px;
  padding-left: 20px;
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  line-height: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 8px 0 0 44px; /* 32 (badge) + 12 (gap) */
    padding-left: 18px;
    font-size: 14px;
    line-height: 22px;
  `}
`

const BulletItem = styled.li`
  margin: 0 0 6px 0;
`

const StyledButton = styled(ButtonPrimary)`
  width: auto;
  align-self: center;
  padding: 12px 42px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px 28px;
  `}
`

const STORAGE_KEY = 'singapore_warning_acknowledged'

export default function SingaporeWarningPopup() {
  const [, setSearchParams] = useSearchParams()
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const location = useLocation()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useEffect(() => {
    // Parse from location.search to catch redirects that preserve query string
    const params = new URLSearchParams(location.search)
    const countryParam = params.get('country')
    if (!countryParam) return

    const isSingaporeParam = countryParam.toLowerCase() === 'singapore'

    // Always remove the country parameter immediately (preserve others)
    const nextParams = new URLSearchParams(params)
    nextParams.delete('country')
    setSearchParams(nextParams, { replace: true })

    if (!isSingaporeParam) return

    let acknowledged = false
    try {
      acknowledged = localStorage.getItem(STORAGE_KEY) === 'true'
    } catch (error) {
      console.error('Error reading Singapore warning acknowledgment:', error)
    }

    if (!acknowledged) setShouldShowPopup(true)
  }, [location.search, setSearchParams])

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch (error) {
      console.error('Error saving Singapore warning acknowledgment:', error)
    }
    setShouldShowPopup(false)
  }

  return (
    <Modal
      isOpen={shouldShowPopup}
      onDismiss={() => {}}
      width={upToSmall ? undefined : '700px'}
      maxWidth={700}
      zindex={1000}
    >
      <ContentWrapper>
        <Title>IMPORTANT NOTICE</Title>
        <SectionRow>
          <Badge>A</Badge>
          <SectionText>
            <Trans>
              This Website and its contents have not been reviewed by the Monetary Authority of Singapore
              (&quot;MAS&quot;).
            </Trans>
          </SectionText>
        </SectionRow>

        <SectionRow>
          <Badge>B</Badge>
          <SectionText>
            <Trans>Neither Kyber Network nor any entity affiliated therewith</Trans>:
          </SectionText>
        </SectionRow>

        <Bullets>
          <BulletItem>
            <Trans>(i) is regulated by MAS; or</Trans>
          </BulletItem>
          <BulletItem>
            <Trans>
              (ii) holds a licence issued by MAS for the provision of, or is authorised by MAS to provide, any service
              relating to tokens (whether digital payment tokens under the Payment Services Act of Singapore or digital
              tokens under the Financial Markets Services Act of Singapore).
            </Trans>
          </BulletItem>
        </Bullets>
        <StyledButton onClick={handleAcknowledge}>
          <Trans>Acknowledge</Trans>
        </StyledButton>
      </ContentWrapper>
    </Modal>
  )
}
