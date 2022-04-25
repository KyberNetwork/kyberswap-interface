import React, { useState, useMemo } from 'react'
import { Text, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'
import { Trans, t } from '@lingui/macro'
import { useActiveWeb3React } from 'hooks'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Deposit from 'components/Icons/Deposit'
import Withdraw from 'components/Icons/Withdraw'
import Harvest from 'components/Icons/Harvest'
import Divider from 'components/Divider'
import styled from 'styled-components'
import { useProMMFarms, useFarmAction } from 'state/farms/promm/hooks'
import { ProMMFarmTableRow } from './styleds'
import { Token, CurrencyAmount } from '@vutien/sdk-core'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { shortenAddress } from 'utils'
import CopyHelper from 'components/Copy'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { useWalletModalToggle, useTokensPrice } from 'state/application/hooks'
import { MouseoverTooltip } from 'components/Tooltip'
import { Plus, Minus } from 'react-feather'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { Dots } from 'pages/Pool/styleds'
import { ProMMFarm } from 'state/farms/promm/types'
import { formatDollarAmount } from 'utils/numbers'
import CurrencyLogo from 'components/CurrencyLogo'
import { useToken } from 'hooks/Tokens'
import { Pool, Position } from '@vutien/dmm-v3-sdk'
import { BigNumber } from 'ethers'

const FarmRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.bg2};
  padding: 1rem;
`

const BtnLight = styled(ButtonLight)`
  padding: 10px 12px;
  height: 36px;
  width: fit-content;
`

const ActionButton = styled(ButtonLight)<{ backgroundColor?: string }>`
  background-color: ${({ theme, backgroundColor }) => backgroundColor || theme.primary + '33'};
  width: 28px;
  height: 28px;
`

const Reward = ({ token: address, amount }: { token: string; amount?: BigNumber }) => {
  const token = useToken(address)

  const tokenAmout = token && CurrencyAmount.fromRawAmount(token, amount?.toString() || '0')

  return (
    <Flex alignItems="center" sx={{ gap: '4px' }}>
      {tokenAmout?.toSignificant(6) || '0'}
      <CurrencyLogo currency={token} size="16px" />
    </Flex>
  )
}

const Row = ({
  farm,
  onOpenModal,
}: {
  farm: ProMMFarm
  onOpenModal: (modalType: 'deposit' | 'withdraw' | 'stake' | 'unstake', pid?: number) => void
}) => {
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const token0 = useToken(farm.token0)
  const token1 = useToken(farm.token1)

  const prices = useTokensPrice([token0, token1])

  const pool = useMemo(() => {
    if (token0 && token1)
      return new Pool(
        token0,
        token1,
        farm.feeTier,
        farm.sqrtP.toString(),
        farm.baseL.toString(),
        farm.reinvestL.toString(),
        farm.currentTick,
      )
    return null
  }, [token0, token1, farm])

  const position: {
    token0Amount: CurrencyAmount<Token>
    token1Amount: CurrencyAmount<Token>
    amountUsd: number
    rewardAmounts: BigNumber[]
  } | null = useMemo(() => {
    if (pool && token0 && token1) {
      let token0Amount = CurrencyAmount.fromRawAmount(token0, '0')
      let token1Amount = CurrencyAmount.fromRawAmount(token1, '0')

      let rewardAmounts = farm.rewardTokens.map(_item => BigNumber.from('0'))

      farm.userDepositedNFTs.forEach(item => {
        const pos = new Position({
          pool,
          liquidity: item.stakedLiquidity.toString(),
          tickLower: item.tickLower,
          tickUpper: item.tickUpper,
        })

        token0Amount = token0Amount.add(pos.amount0)
        token1Amount = token1Amount.add(pos.amount1)

        item.rewardPendings.forEach((rw, index) => (rewardAmounts[index] = rewardAmounts[index].add(rw)))
      })

      const amount0Usd = prices[0] * parseFloat(token0Amount.toExact())
      const amount1Usd = prices[1] * parseFloat(token0Amount.toExact())

      return { token1Amount, amountUsd: amount0Usd + amount1Usd, token0Amount, rewardAmounts }
    }
    return null
  }, [pool, token0, token1, prices, farm])

  return (
    <>
      <ProMMFarmTableRow>
        <div>
          <DoubleCurrencyLogo currency0={token0} currency1={token1} />
          <Text marginTop="0.5rem" fontSize={14}>
            {token0?.symbol} - {token1?.symbol}
          </Text>
        </div>

        <div>
          <Flex alignItems="center">
            <Text fontSize={14}>{shortenAddress(farm.poolAddress)}</Text>
            <CopyHelper toCopy={farm.poolAddress} />
          </Flex>
          <Text marginTop="0.5rem" color={theme.subText}>
            Fee = {farm.feeTier / 100}%
          </Text>
        </div>

        <Text>TODO: TVL</Text>
        <Text>
          {farm.endTime > currentTimestamp ? getFormattedTimeFromSecond(farm.endTime - currentTimestamp) : t`ENDED`}
        </Text>
        {/* TODO: calculate farm apr */}
        <Text textAlign="end" color={theme.apr}>
          TODO
        </Text>

        <Text textAlign="end">{getFormattedTimeFromSecond(farm.vestingDuration, true)}</Text>

        <Text textAlign="right">{!!position?.amountUsd ? formatDollarAmount(position.amountUsd) : '--'}</Text>
        <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
          {farm.rewardTokens.map((token, idx) => (
            <Reward key={token} token={token} amount={position?.rewardAmounts[idx]} />
          ))}
        </Flex>
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
          <ActionButton onClick={() => onOpenModal('stake', farm.pid)}>
            <MouseoverTooltip text={t`Stake`} placement="top" width="fit-content">
              <Plus color={theme.primary} size={16} />
            </MouseoverTooltip>
          </ActionButton>

          <ActionButton backgroundColor={theme.subText + '33'} onClick={() => onOpenModal('unstake', farm.pid)}>
            <MouseoverTooltip text={t`Unstake`} placement="top" width="fit-content">
              <Minus color={theme.subText} size={16} />
            </MouseoverTooltip>
          </ActionButton>

          <ActionButton backgroundColor={theme.buttonBlack + '66'} onClick={() => {}}>
            <MouseoverTooltip text={t`Harvest`} placement="top" width="fit-content">
              <Harvest color={theme.subText} />
            </MouseoverTooltip>
          </ActionButton>
        </Flex>
      </ProMMFarmTableRow>
      <Divider />
    </>
  )
}

function ProMMFarmGroup({
  address,
  onOpenModal,
}: {
  address: string
  onOpenModal: (modalType: 'deposit' | 'withdraw' | 'stake' | 'unstake', pid?: number) => void
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { data } = useProMMFarms()
  const farms = data[address]
  const toggleWalletModal = useWalletModalToggle()

  const { approve, isApprovedForAll } = useFarmAction(address)
  const [approvalTx, setApprovalTx] = useState('')

  const isApprovalTxPending = useIsTransactionPending(approvalTx)

  const handleAprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  if (!farms) return null

  return (
    <>
      <FarmRow>
        <Flex sx={{ gap: '20px' }} alignItems="center">
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
            </Text>
            <Flex>$123.456 </Flex>
          </Flex>

          {!!account ? (
            !isApprovedForAll ? (
              <BtnLight onClick={handleAprove} disabled={isApprovalTxPending}>
                <Text fontSize="14px" marginLeft="4px">
                  {approvalTx && isApprovalTxPending ? (
                    <Dots>
                      <Trans>Approving</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve</Trans>
                  )}
                </Text>
              </BtnLight>
            ) : (
              <Flex sx={{ gap: '12px' }} alignItems="center">
                <BtnLight onClick={() => onOpenModal('deposit')}>
                  <Deposit />
                  <Text fontSize="14px" marginLeft="4px">
                    <Trans>Deposit</Trans>
                  </Text>
                </BtnLight>

                <BtnLight
                  onClick={() => onOpenModal('withdraw')}
                  style={{ background: theme.subText + '33', color: theme.subText }}
                >
                  <Withdraw />
                  <Text fontSize="14px" marginLeft="4px">
                    <Trans>Withdraw</Trans>
                  </Text>
                </BtnLight>
              </Flex>
            )
          ) : (
            <BtnLight onClick={toggleWalletModal}>
              <Trans>Connect Wallet</Trans>
            </BtnLight>
          )}
        </Flex>
        <Flex alignItems="center" sx={{ gap: '24px' }}>
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
            </Text>
            <Flex>$123.456 </Flex>
          </Flex>

          <ButtonPrimary style={{ height: '36px', fontSize: '14px' }} padding="10px 12px" width="fit-content">
            <Harvest />
            <Text marginLeft="4px">
              <Trans>Harvest All</Trans>
            </Text>
          </ButtonPrimary>
        </Flex>
      </FarmRow>
      <Divider />
      {farms.map((farm, index) => {
        return <Row farm={farm} key={index} onOpenModal={onOpenModal} />
      })}
    </>
  )
}

export default ProMMFarmGroup
