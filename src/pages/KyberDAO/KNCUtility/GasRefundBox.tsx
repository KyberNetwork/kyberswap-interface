import { Trans, t } from '@lingui/macro'
import axios from 'axios'
import { BigNumber } from 'ethers'
import { darken } from 'polished'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { REWARD_SERVICE_API } from 'constants/env'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { isSupportKyberDao, useEligibleTransactions, useGasRefundInfo, useGasRefundTier } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { useEligibleTxToggle, useNotify, useOpenNetworkModal, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { LinkStyledButton, MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'
import { sendEVMTransaction } from 'utils/sendTransaction'

import EligibleTxModal from './EligibleTxModal'
import { KNCUtilityTabs } from './type'

const Hr = styled.hr`
  width: 100%;
  border: none;
  height: 1px;
  background-color: ${({ theme }) => theme.border};
  margin: 0;
`

const Wrapper = styled(Flex)`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  gap: 28px;
  flex-direction: column;
`

const Tab = styled(Text)<{ active?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;

  ${({ active, theme }) =>
    active &&
    css`
      border-radius: 12px;
      font-weight: 600;
      color: ${theme.primary};
    `}

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }
`

export default function GasRefundBox() {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [selectedTab, setSelectedTab] = useState<KNCUtilityTabs>(KNCUtilityTabs.Available)
  const theme = useTheme()
  const { totalReward, reward, claimableReward } = useGasRefundInfo({ rewardStatus: selectedTab })
  const toggleWalletModal = useWalletModalToggle()
  const toggleEligibleTxModal = useEligibleTxToggle()
  const openNetworkModal = useOpenNetworkModal()
  const notify = useNotify()
  const [claiming, setClaiming] = useState(false)
  const addTransactionWithType = useTransactionAdder()
  const eligibleTxs = useEligibleTransactions(1, 1)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { userTier, gasRefundPerCentage } = useGasRefundTier()

  const claimRewards = useCallback(async () => {
    if (!account || !library || !claimableReward || claimableReward.knc <= 0) return

    setClaiming(true)

    const url = REWARD_SERVICE_API + '/rewards/claim'
    const data = {
      wallet: account,
      chainId: chainId.toString(),
      clientCode: 'gas-refund',
      ref: '',
    }
    let response: any
    try {
      response = await axios({ method: 'POST', url, data })
      if (response?.data?.code !== 200000) throw new Error(response?.data?.message)
    } catch (error) {
      console.error('Claim error:', { error })
      notify({
        title: t`Claim Error`,
        summary: error?.response?.data?.message || error?.message || 'Unknown error',
        type: NotificationType.ERROR,
      })
      setClaiming(false)
      return
    }

    const rewardContractAddress = response.data.data.ContractAddress
    const encodedData = response.data.data.EncodedData
    try {
      const tx = await sendEVMTransaction(
        account,
        library,
        rewardContractAddress,
        encodedData,
        BigNumber.from(0),
        async transactionResponse => {
          const transactionReceipt = await transactionResponse.wait()
          if (transactionReceipt.status === 1) {
            setClaiming(false)
          }
        },
      )
      if (!tx) throw new Error()
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        extraInfo: {
          tokenAddress: KNC[chainId].address,
          tokenAmount: claimableReward.knc.toString(),
          tokenSymbol: 'KNC',
        },
      })
    } catch (error) {
      console.error('Claim error:', { error })
      notify({
        title: t`Claim Error`,
        summary: error.message || 'Unknown error',
        type: NotificationType.ERROR,
      })
    } finally {
      setClaiming(false)
    }
  }, [account, addTransactionWithType, chainId, claimableReward, library, notify])

  return (
    <Wrapper>
      <Flex flexDirection="column" sx={{ gap: '16px' }}>
        <RowBetween
          width="100%"
          flexDirection={upToExtraSmall ? 'column' : 'row'}
          align={upToExtraSmall ? 'start' : 'center'}
          sx={{ gap: '16px' }}
        >
          <Flex>
            <TextDashed>
              <MouseoverTooltip width="fit-content" text={<Trans>Rewards available to claim</Trans>} placement="top">
                <Tab
                  active={selectedTab === KNCUtilityTabs.Available}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Available)}
                >
                  <Trans>Available</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
            &nbsp;|&nbsp;
            <TextDashed>
              <MouseoverTooltip
                width="fit-content"
                text={<Trans>Rewards to claim after the end of the countdown period</Trans>}
                placement="top"
              >
                <Tab
                  active={selectedTab === KNCUtilityTabs.Pending}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Pending)}
                >
                  <Trans>Pending</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
            &nbsp;|&nbsp;
            <TextDashed>
              <MouseoverTooltip width="fit-content" text={<Trans>Rewards successfully claimed</Trans>} placement="top">
                <Tab
                  active={selectedTab === KNCUtilityTabs.Claimed}
                  onClick={() => setSelectedTab(KNCUtilityTabs.Claimed)}
                >
                  <Trans>Claimed</Trans>
                </Tab>
              </MouseoverTooltip>
            </TextDashed>
          </Flex>
          {!!userTier && !!gasRefundPerCentage && (
            <Text fontSize={12} fontWeight={400} lineHeight="16px" width="fit-content">
              <Trans>
                Tier {userTier} - {gasRefundPerCentage * 100}% Gas Refund
              </Trans>
            </Text>
          )}
        </RowBetween>
        <RowBetween width="100%" flexDirection="row" sx={{ gap: '16px' }} align="end">
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text} alignItems="center">
              {account ? formattedNum(reward?.knc.toString() || '0') : '--'} KNC
            </Text>
            <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText} alignItems="center">
              {account ? (reward?.usd ? '~' : '') + formattedNum(reward?.usd.toString() || '0', true) : '$ --'}
            </Text>
          </Flex>
          <Flex width="fit-content">
            {selectedTab !== KNCUtilityTabs.Available ? null : account ? (
              isSupportKyberDao(chainId) ? (
                claiming ? (
                  <ButtonPrimary padding={upToXXSmall ? '8px 28px' : '8px 45px'} onClick={claimRewards}>
                    <Dots>
                      <Trans>Claiming</Trans>
                    </Dots>
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    padding={upToXXSmall ? '8px 28px' : '8px 45px'}
                    onClick={claimRewards}
                    disabled={(claimableReward?.knc ?? 0) <= 0}
                  >
                    <Trans>Claim</Trans>
                  </ButtonPrimary>
                )
              ) : (
                <MouseoverTooltip
                  text={
                    <Trans>
                      Gas Refund Rewards is only available on Ethereum chain. Switch your network to continue{' '}
                      <LinkStyledButton onClick={openNetworkModal}>here</LinkStyledButton>
                    </Trans>
                  }
                  width="244px"
                >
                  <ButtonPrimary padding={upToXXSmall ? '8px 28px' : '8px 45px'} $disabled>
                    <Trans>Claim</Trans>
                  </ButtonPrimary>
                </MouseoverTooltip>
              )
            ) : (
              <ButtonLight onClick={toggleWalletModal} padding="10px 12px">
                <Trans>Connect Wallet</Trans>
              </ButtonLight>
            )}
          </Flex>
        </RowBetween>
      </Flex>
      <Hr />
      <RowBetween flexDirection="row" sx={{ gap: '16px' }}>
        <Flex flexDirection="column" sx={{ gap: '16px' }}>
          <TextDashed fontSize={14} lineHeight="20px" fontWeight={500} color={theme.subText}>
            <MouseoverTooltip
              width="fit-content"
              text={<Trans>Total Gas Refund = Available + Pending + Claimed Gas Refund</Trans>}
              placement="top"
            >
              <Trans>Total Gas Refund</Trans>
            </MouseoverTooltip>
          </TextDashed>
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text} alignItems="center">
              {account ? formattedNum(totalReward?.knc.toString() ?? '0') : '--'} KNC
            </Text>
            <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText} alignItems="center">
              {account
                ? (totalReward?.usd ? '~' : '') + formattedNum(totalReward?.usd.toString() ?? '0', true)
                : '$ --'}
            </Text>
          </Flex>
        </Flex>
        <Flex alignSelf="end">
          {!!account && !!eligibleTxs?.transactions.length && (
            <ButtonLight
              padding="2px 12px"
              onClick={toggleEligibleTxModal}
              style={{ whiteSpace: 'nowrap' }}
              width="max-content"
            >
              <Text fontSize={12} fontWeight={500} lineHeight="16px">
                <Trans>Your Transactions</Trans>
              </Text>
            </ButtonLight>
          )}
        </Flex>
      </RowBetween>
      <EligibleTxModal />
    </Wrapper>
  )
}
