import { Trans } from '@lingui/macro'
import React, { useContext } from 'react'
import { Flex, Text } from 'rebass'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ThemeContext } from 'styled-components'
import { ButtonPrimary } from 'components/Button'
import { shortenAddress } from 'utils'
import styled from 'styled-components'
import { CloseIcon } from 'theme'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import BTT from '../../assets/networks/bttc.png'
import Modal from 'components/Modal'
import { BTTC_TOKEN_LISTS } from 'constants/lists'
const AddressWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px;
  padding: 12px;
  overflow: hidden;
  p {
    margin: 12px 0 0 0;
    font-size: 24px;
    line-height: 28px;
    font-weight: 500;
    color: ${({ theme }) => theme.disableText};
  }
`
function FaucetModal() {
  const { chainId, account } = useActiveWeb3React()
  const open = useModalOpen(ApplicationModal.FAUCET_POPUP)
  const toggle = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const theme = useContext(ThemeContext)
  // const {
  //   isUserHasReward,
  //   rewardAmounts,
  //   claimRewardsCallback,
  //   attemptingTxn,
  //   txHash,
  //   pendingTx,
  //   error: claimRewardError,
  //   resetTxn,
  // } = useClaimReward()
  //const KNCToken = KNC[(chainId as ChainId) || ChainId.MAINNET]
  //const isCanClaim = isUserHasReward && rewardAmounts !== '0' && !pendingTx

  const modalContent = () => (
    // claimRewardError ? (
    //   <TransactionErrorContent
    //     onDismiss={() => {
    //       toggle()
    //       setTimeout(() => resetTxn(), 1000)
    //     }}
    //     message={claimRewardError}
    //   />
    // ) : (
    <Flex flexDirection={'column'} padding="26px 24px" style={{ gap: '25px' }}>
      <RowBetween>
        <Text fontSize={20} fontWeight={500} color={theme.text}>
          <Trans>Faucet</Trans>
        </Text>
        <CloseIcon onClick={toggle} />
      </RowBetween>

      <AddressWrapper>
        <Text color={theme.subText} fontSize={12}>
          <Trans>Your wallet address</Trans>
        </Text>
        <p>{account && shortenAddress(account, 9)}</p>
      </AddressWrapper>
      <Text fontSize={16} lineHeight="24px" color={theme.text}>
        <Trans>If your wallet is eligible, you will be able to claim your reward below. You can claim:</Trans>
      </Text>
      <Text fontSize={32} lineHeight="38px" fontWeight={500}>
        <img src={BTT} alt="Switch Network" style={{ width: '28px', marginRight: '8px' }} /> 0.4 BTT
      </Text>
      <ButtonPrimary
        onClick={() => {
          toggle()
        }}
        style={{ borderRadius: '24px', height: '44px' }}
      >
        <Trans>Request</Trans>
      </ButtonPrimary>
    </Flex>
  )

  return (
    <Modal
      isOpen={open}
      onDismiss={() => {
        toggle()
      }}
      maxHeight={90}
    >
      {modalContent()}
    </Modal>
  )
}

export default FaucetModal
