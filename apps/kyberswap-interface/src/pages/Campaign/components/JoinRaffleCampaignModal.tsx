import { Trans } from '@lingui/macro'
import { Flex, Link, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import { renderRaffleTerms } from './Information/campaignInfos/raffle'

const Wrapper = styled.div`
  padding: 24px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  line-height: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px;
  `}
`

const ActionRow = styled(Flex)`
  gap: 12px;
`

type Props = {
  isOpen: boolean
  onDismiss: () => void
  onConfirm: () => void
}

export const JoinRaffleCampaignModal = ({ isOpen, onDismiss, onConfirm }: Props) => {
  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={560}>
      <Wrapper>
        <Text fontWeight={500} fontSize={16} marginBottom="0.5rem">
          By clicking <Link>Join Campaign</Link> you agree to the campaign&apos;s terms and conditions
        </Text>
        <Text color={theme.subText} paddingLeft="14px">
          <li>
            <Trans>
              These Terms and Conditions{' '}
              <ExternalLink href="https://kyberswap.com/files/Kyber%20-%20Terms%20of%20Use%20-%2020%20November%202023.pdf">
                ({'"Terms"'})
              </ExternalLink>{' '}
              should be read in conjunction with the KyberSwap Terms of Use, which lay out the terms and conditions that
              apply to all KyberSwap promotional activities ({'"Campaign"'}).
            </Trans>
          </li>
          {renderRaffleTerms()}
        </Text>

        <ActionRow marginTop="24px">
          <ButtonOutlined flex={1} height="36px" onClick={onDismiss}>
            <Trans>Close</Trans>
          </ButtonOutlined>
          <ButtonPrimary flex={1} height="36px" onClick={onConfirm}>
            <Trans>Join Campaign</Trans>
          </ButtonPrimary>
        </ActionRow>
      </Wrapper>
    </Modal>
  )
}

export default JoinRaffleCampaignModal
