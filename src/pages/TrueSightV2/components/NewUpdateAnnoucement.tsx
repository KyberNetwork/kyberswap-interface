import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import banner from 'assets/images/truesight-v2/new-updates-banner.png'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(95vw, 808px);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-height: 70vh;
  `}
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 16px;
  }

  strong {
    color: ${({ theme }) => theme.text};
  }
`

// Change this value whenever want to show this Modal again
const CURRENT_VERSION = 2

export default function NewUpdateAnnoucement() {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_NEW_UPDATE)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_NEW_UPDATE)

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useEffect(() => {
    if (localStorage.getItem('showedKyberAIUpdateAnnoucement') !== CURRENT_VERSION.toString()) {
      toggle()
      localStorage.setItem('showedKyberAIUpdateAnnoucement', CURRENT_VERSION.toString())
    }
  }, [toggle])

  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="fit-content" onDismiss={toggle}>
      <Wrapper>
        <RowBetween>
          <Row fontSize={above768 ? '20px' : '16px'} lineHeight="24px" color={theme.text} gap="6px">
            <Trans>New Updates to KyberAI</Trans>
          </Row>
          <div onClick={toggle} style={{ cursor: 'pointer' }}>
            <X />
          </div>
        </RowBetween>
        <div
          style={{
            overflow: 'hidden',
            borderRadius: above768 ? '16px' : '6px',
            boxShadow: '0 0 6px 0px #00000060',
            height: above768 ? '128px' : '60px',
            backgroundImage: `url(${banner})`,
            backgroundColor: theme.buttonBlack,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        />
        <Text fontSize="14px" lineHeight="20px" color={theme.subText} flex="1">
          <Trans>
            <ul>
              <li>
                We have created a new rankings list called <strong>KyberScore Delta</strong> for tokens that have a
                significant change in the KyberScore. Now you can spot tokens that go from bearish to bullish and
                vice-versa immediately!
              </li>
              <li>
                Create multiple <strong>custom watchlists</strong> and organize your favorite tokens more easily. Hit
                the subscribe button to receive daily market updates on tokens in your watchlist!
              </li>
              <li>
                We have created a new rankings list called <strong>Funding Rates</strong> for tokens based on funding
                rates from centralized exchanges. Now you can get an overview of tokens that are being longed or shorted
                in real-time
              </li>
              <li>
                <strong>Filter tokens</strong> in the rankings by chain, market cap, number of holders and more. You can
                also sort the tokens in the rankings.
              </li>
            </ul>{' '}
            <p>We have many more upgrades coming up so keep an eye out!</p>
          </Trans>
        </Text>
        <Row justify="center">
          <ButtonPrimary style={{ padding: '8px 16px', width: 'fit-content' }} onClick={toggle}>
            <Text fontSize={above768 ? '14px' : '12px'} lineHeight={above768 ? '20px' : '14px'}>
              <Trans>Let&apos;s get started</Trans>
            </Text>
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
