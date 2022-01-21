import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import React, { useContext } from 'react'
import { Flex, Text, Box } from 'rebass'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ThemeContext } from 'styled-components'
import { KNC } from '../../constants'
import { useWeb3React } from '@web3-react/core'
import { ChainId } from '@dynamic-amm/sdk'
import { ButtonPrimary } from 'components/Button'
import { shortenAddress } from 'utils'
import styled from 'styled-components'

const AddressWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px;
  padding: 12px;

  p {
    font-size: 24px;
    line-height: 28px;
    font-weight: 500;
    color: ${({ theme }) => theme.disableText};
  }
`
function ClaimRewardModal() {
  const { chainId, account } = useWeb3React()
  const open = useModalOpen(ApplicationModal.CLAIM_POPUP)
  const toggle = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const theme = useContext(ThemeContext)
  const KNCToken = KNC[(chainId as ChainId) || ChainId.MAINNET]
  const amountClaim = 0
  const isCantClaim = amountClaim === 0
  return (
    <Modal isOpen={open} onDismiss={toggle}>
      <Flex flexDirection={'column'} padding="26px 24px" style={{ gap: '25px' }}>
        <Text fontSize={20} fontWeight={500} color={theme.text}>
          <Trans>Claim your rewards</Trans>
        </Text>
        <AddressWrapper>
          <Text color={theme.subText} fontSize={12} marginBottom="12px">
            <Trans>Your wallet address</Trans>
          </Text>
          <p>{account && shortenAddress(account, 9)}</p>
        </AddressWrapper>
        <Text fontSize={16} lineHeight="24px" color={theme.text}>
          <Trans>If your wallet is eligible, you will be able to claim your reward below. You can claim:</Trans>
        </Text>
        <Text fontSize={32} lineHeight="38px" fontWeight={500}>
          <CurrencyLogo currency={KNCToken} /> {amountClaim} KNC
        </Text>
        <ButtonPrimary disabled={isCantClaim}>
          <Trans>Claim</Trans>
        </ButtonPrimary>
      </Flex>
    </Modal>
  )
}

export default ClaimRewardModal
