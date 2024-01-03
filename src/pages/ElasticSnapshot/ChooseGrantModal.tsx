import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'

const Option = styled.div<{ active: boolean }>`
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.border)};
  background: ${({ theme, active }) => (active ? rgba(theme.primary, 0.2) : theme.buttonGray)};
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
`
const Opt = styled.div<{ active: boolean }>`
  text-shadow: ${({ theme, active }) => (active ? `0px 0px 3px ${theme.primary}` : undefined)};
  color: ${({ theme, active }) => (!active ? theme.subText : theme.primary)};
  width: 40px;
  height: 40px;
  font-size: 24px;
  font-weight: 500;
  line-height: 40px;
  text-align: center;
`

export default function ChooseGrantModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const theme = useTheme()

  const options = {
    A: t`USD stablecoins equivalent of 60% of Reference Value of Affected Assets associated with such Affected Address, vested over 3 months*`,
    B: t`USD stablecoins equivalent of 100% of Reference Value of Affected Assets associated with such Affected Address, vested over 12 months*`,
    C: t`Opt out.`,
  }

  const [selectedOption, setSelectedOption] = useState('')

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="480px" width="100%">
      <Flex flexDirection="column" padding="20px" bg={theme.background} width="100%">
        <Text color={theme.text} fontSize="20px" fontWeight="500" textAlign="center">
          <Trans>Treasury Grant Options</Trans>
        </Text>

        <Text fontSize="12px" marginTop="24px" color={theme.subText} lineHeight="16px">
          <Trans>
            KyberSwap Elastic Exploit Treasury Grant Program (“Program”) will support Affected Users who have lost
            Affected Assets to the KyberSwap Elastic Exploit. Under the Program, an Affected User who fulfils
            Eligibility Requirements can choose from one of the following options for the Treasury Grants in respect of
            each Affected Address of such Affected User.
          </Trans>
        </Text>

        <Flex flexDirection="column" sx={{ gap: '12px' }} marginTop="24px">
          {Object.keys(options).map(opt => {
            return (
              <Option key={opt} onClick={() => setSelectedOption(opt)} active={selectedOption === opt} role="button">
                <Opt active={selectedOption === opt}>{opt}</Opt>
                <Text flex={1} fontSize="12px" lineHeight="16px">
                  {options[opt]}
                </Text>
              </Option>
            )
          })}
        </Flex>

        <Text marginTop="24px" fontSize="12px" color={theme.subText}>
          <Trans>*Paid in USD stablecoins vested linearly, starting on February 1, 2024.</Trans>
        </Text>

        <Flex marginTop="24px" sx={{ gap: '1rem' }}>
          <ButtonOutlined onClick={onDismiss}>
            <Trans>Rethink</Trans>
          </ButtonOutlined>
          <ButtonPrimary>
            <Trans>Sign with your wallet</Trans>
          </ButtonPrimary>
        </Flex>
      </Flex>
    </Modal>
  )
}
