import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import {
  isSupportKyberDao,
  useClaimGasRefundRewards,
  useEligibleTransactions,
  useGasRefundInfo,
  useGasRefundTier,
  useVotingInfo,
} from 'hooks/kyberdao'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useOpenNetworkModal, useWalletModalToggle } from 'state/application/hooks'
import { LinkStyledButton, MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'

import TimerCountdown from '../TimerCountdown'
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
  const { mixpanelHandler } = useMixpanel()
  const { account, chainId } = useActiveWeb3React()
  const [selectedTab, setSelectedTab] = useState<KNCUtilityTabs>(KNCUtilityTabs.Available)
  const theme = useTheme()
  const { totalReward, reward, claimableReward } = useGasRefundInfo({ rewardStatus: selectedTab })
  const toggleWalletModal = useWalletModalToggle()
  const [isShowEligibleTx, setShowEligibleTx] = useState(false)
  const openNetworkModal = useOpenNetworkModal()
  const eligibleTxs = useEligibleTransactions(1, 1)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { userTier, gasRefundPerCentage } = useGasRefundTier()
  const { daoInfo: { first_epoch_start_timestamp = 0, current_epoch = 0, epoch_period_in_seconds = 0 } = {} } =
    useVotingInfo()

  const claimReward = useClaimGasRefundRewards()
  const [claiming, setClaiming] = useState(false)
  const handleClaimReward = useCallback(async () => {
    try {
      setClaiming(true)
      mixpanelHandler(MIXPANEL_TYPE.GAS_REFUND_CLAIM_CLICK, {
        source: 'KNC Utility page',
        token_amount: claimableReward?.knc,
      })
      await claimReward()
    } finally {
      setClaiming(false)
    }
  }, [claimReward, claimableReward?.knc, mixpanelHandler])

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
            <Text sx={{ userSelect: 'none' }}>&nbsp;|&nbsp;</Text>
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
            <Text sx={{ userSelect: 'none' }}>&nbsp;|&nbsp;</Text>
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
            {selectedTab === KNCUtilityTabs.Available ? (
              account ? (
                isSupportKyberDao(chainId) ? (
                  <ButtonPrimary
                    padding={upToXXSmall ? '8px 28px' : '8px 45px'}
                    onClick={claiming ? undefined : handleClaimReward}
                    disabled={claiming || (claimableReward?.knc ?? 0) <= 0}
                  >
                    {claiming ? (
                      <Dots>
                        <Trans>Claiming</Trans>
                      </Dots>
                    ) : (
                      <Trans>Claim</Trans>
                    )}
                  </ButtonPrimary>
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
              )
            ) : selectedTab === KNCUtilityTabs.Pending ? (
              <Text fontSize={12} fontWeight={500} lineHeight="16px" as="span">
                <Trans>
                  Available to claim in{' '}
                  <TimerCountdown
                    endTime={first_epoch_start_timestamp + (current_epoch + 1) * epoch_period_in_seconds} // reward claim at n+2 epoch
                    maxLength={2}
                    sx={{ display: 'inline-flex !important' }}
                  />
                </Trans>
              </Text>
            ) : null}
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
              onClick={() => setShowEligibleTx(isShowEligibleTx => !isShowEligibleTx)}
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
      <EligibleTxModal isOpen={isShowEligibleTx} closeModal={() => setShowEligibleTx(false)} />
    </Wrapper>
  )
}
