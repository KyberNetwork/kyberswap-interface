import { Trans } from '@lingui/macro'
import { Flex, Link, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'

const Wrapper = styled.div`
  width: 100%;
  align-self: flex-start;
  padding: 20px;
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

const TermsLink = styled(Link)`
  appearance: none;
  background: none;
  border: 0;
  cursor: pointer;
  font-size: inherit;
  font-weight: inherit;
  padding: 0;
  color: ${({ theme }) => theme.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity 0.2s ease, filter 0.2s ease;

  &:hover {
    opacity: 0.85;
    filter: brightness(1.1);
  }
`

type Props = {
  isOpen: boolean
  onDismiss?: () => void
  onConfirm?: () => void
  onViewTerms?: () => void
}

export const JoinCampaignModal = ({ isOpen, onDismiss, onConfirm, onViewTerms }: Props) => {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={400}>
      <Wrapper>
        <Text fontWeight={500} fontSize={16} marginBottom="0.5rem">
          <Trans>
            By joining this campaign, you agree to the campaign&apos;s{' '}
            <TermsLink as="button" type="button" onClick={onViewTerms}>
              Terms & Conditions
            </TermsLink>
            .
          </Trans>
        </Text>

        <ActionRow marginTop="24px">
          <ButtonOutlined flex={1} height="36px" onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary flex={1} height="36px" onClick={onConfirm}>
            <Trans>Agree & Join</Trans>
          </ButtonPrimary>
        </ActionRow>
      </Wrapper>
    </Modal>
  )
}

export default JoinCampaignModal
