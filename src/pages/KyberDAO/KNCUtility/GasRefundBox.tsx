import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import axios from 'axios'
import { BigNumber } from 'ethers'
import { darken } from 'polished'
import { useState } from 'react'
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
import { useEligibleTransactions, useGasRefundInfo } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import { useEligibleTxToggle, useNotify, useOpenNetworkModal, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { LinkStyledButton, MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'
import { sendEVMTransaction } from 'utils/sendTransaction'

import EligibleTxModal from './EligibleTxModal'
import { KNCUtilityTabs } from './type'

const TotalReward = styled.div`
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};
`

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 24px 24px 30px;
  background-color: ${({ theme }) => theme.background};
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

  const claimRewards = async () => {
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
  }

  return (
    <Wrapper>
      <Flex flexDirection="column" sx={{ gap: '16px' }}>
        <Flex>
          <MouseoverTooltip
            width="fit-content"
            text={<Trans>Available rewards: Claimable rewards in this epoch.</Trans>}
            placement="top"
          >
            <Tab
              active={selectedTab === KNCUtilityTabs.Available}
              onClick={() => setSelectedTab(KNCUtilityTabs.Available)}
            >
              <Trans>Available</Trans>
            </Tab>
          </MouseoverTooltip>
          &nbsp;|&nbsp;
          <MouseoverTooltip
            width="fit-content"
            text={
              <Trans>
                Pending rewards: Cumulative rewards not yet can be claim. Will be able to claim in next epoch.
              </Trans>
            }
            placement="top"
          >
            <Tab active={selectedTab === KNCUtilityTabs.Pending} onClick={() => setSelectedTab(KNCUtilityTabs.Pending)}>
              <Trans>Pending</Trans>
            </Tab>
          </MouseoverTooltip>
          &nbsp;|&nbsp;
          <MouseoverTooltip
            width="fit-content"
            text={<Trans>Claimed rewards: Rewards claimed and transferred to user wallet.</Trans>}
            placement="top"
          >
            <Tab active={selectedTab === KNCUtilityTabs.Claimed} onClick={() => setSelectedTab(KNCUtilityTabs.Claimed)}>
              <Trans>Claimed</Trans>
            </Tab>
          </MouseoverTooltip>
        </Flex>
        <RowBetween
          width="100%"
          flexDirection={upToXXSmall ? 'column' : 'row'}
          sx={{ gap: '16px' }}
          align={upToXXSmall ? 'start' : 'end'}
        >
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text} alignItems="center">
              {account ? formattedNum(reward?.knc.toString() || '0') : '--'} KNC
            </Text>
            <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText} alignItems="center">
              {account ? (reward?.usd ? '~' : '') + formattedNum(reward?.usd.toString() || '0', true) : '$ --'}
            </Text>
          </Flex>
          <Flex width="fit-content">
            {account ? (
              chainId === ChainId.MAINNET ? (
                claiming ? (
                  <ButtonPrimary padding="8px 45px" onClick={claimRewards}>
                    <Dots>
                      <Trans>Claiming</Trans>
                    </Dots>
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary padding="8px 45px" onClick={claimRewards} disabled={(claimableReward?.knc ?? 0) <= 0}>
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
                  <div>
                    <ButtonPrimary padding="8px 45px" $disabled>
                      <Trans>Claim</Trans>
                    </ButtonPrimary>
                  </div>
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
      <TotalReward>
        <RowBetween
          flexDirection={upToXXSmall ? 'column' : 'row'}
          sx={{ gap: '16px' }}
          align={upToXXSmall ? 'start' : 'end'}
        >
          <Flex flexDirection="column" sx={{ gap: '16px' }}>
            <TextDashed fontSize={14} lineHeight="20px" fontWeight={500} color={theme.subText}>
              <MouseoverTooltip
                width="fit-content"
                text={<Trans>Total Gas Refund = Available + Pending + Claimed</Trans>}
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
          <Flex alignSelf={upToXXSmall ? 'start' : 'end'}>
            {!!account && !!eligibleTxs?.transactions.length && (
              <ButtonLight padding="2px 12px" onClick={toggleEligibleTxModal}>
                <Trans>Your Transactions</Trans>
              </ButtonLight>
            )}
          </Flex>
        </RowBetween>
      </TotalReward>
      <EligibleTxModal />
    </Wrapper>
  )
}
