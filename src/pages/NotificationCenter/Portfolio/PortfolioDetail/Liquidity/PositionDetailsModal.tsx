import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { DefaultTheme } from 'styled-components'

import Badge, { BadgeVariant } from 'components/Badge'
import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { formatUnitsToFixed } from 'utils/formatBalance'
import { formatDisplayNumber } from 'utils/numbers'

import { LiquidityData } from '../../type'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
`
const logoStyle = { width: '20px', height: '20px', borderRadius: '4px' }

const calculateTextProfitColor = (value: number | undefined, theme: DefaultTheme) => {
  if (!value) return theme.subText
  if (value > 0) return theme.primary
  if (value < 0) return theme.red
  return theme.subText
}

export default function PositionDetailsModal({
  isOpen,
  position,
  onClose,
}: {
  isOpen: boolean
  position: LiquidityData | null
  onClose: () => void
}) {
  const [tab, setTab] = useState(0)
  const theme = useTheme()
  if (!position) return null

  const token0 = position.balance.lpData.lpPoolData.token0
  const token1 = position.balance.lpData.lpPoolData.token1
  const lpPositionData = position.balance.lpData.lpPositionData
  const lpUniV2Data = position.balance.lpData.lpUniV2Data

  const currentToken0Amount = lpPositionData?.currentToken0Amount || lpUniV2Data?.currentToken0Amount
  const currentToken1Amount = lpPositionData?.currentToken1Amount || lpUniV2Data?.currentToken1Amount
  const totalToken0Amount = lpPositionData?.totalToken0Amount || lpUniV2Data?.totalToken0Amount
  const totalToken1Amount = lpPositionData?.totalToken1Amount || lpUniV2Data?.totalToken1Amount
  const currentToken0Usd = lpPositionData?.currentToken0Value || lpUniV2Data?.currentToken0Usd || 0
  const currentToken1Usd = lpPositionData?.currentToken1Value || lpUniV2Data?.currentToken1Usd || 0
  const totalToken0Usd = lpPositionData?.totalToken0Value || lpUniV2Data?.totalToken0Usd || 0
  const totalToken1Usd = lpPositionData?.totalToken1Value || lpUniV2Data?.totalToken1Usd || 0
  const currentValueRatio =
    +currentToken0Usd && +currentToken1Usd ? currentToken0Usd / (+currentToken0Usd + +currentToken1Usd) : 0
  const totalValueRatio = +totalToken0Usd && +totalToken1Usd ? totalToken0Usd / (totalToken0Usd + totalToken1Usd) : 0

  const claimedFeeToken0Amount = lpUniV2Data?.totalFeeEarned0 || lpPositionData?.totalFeeEarned0
  const claimedFeeToken1Amount = lpUniV2Data?.totalFeeEarned1 || lpPositionData?.totalFeeEarned1
  const claimedFeeToken0Usd = lpUniV2Data?.feeToken0Usd || lpPositionData?.totalFeeEarned0Usd
  const claimedFeeToken1Usd = lpUniV2Data?.feeToken1Usd || lpPositionData?.totalFeeEarned1Usd
  const fees = position.balance.underlying.filter(item => item.assetType === 'reward') || []
  const farmRewards = position.balance.harvestedReward

  return (
    <Modal
      isOpen={isOpen}
      borderRadius="16px"
      maxWidth="800px"
      onDismiss={() => {
        onClose()
        setTab(0)
      }}
    >
      <Wrapper>
        <Column width="100%" gap="16px">
          <RowBetween>
            <Row gap="20px">
              <Text>
                <Trans>Position Details</Trans>
              </Text>
              {lpPositionData && lpPositionData.tokenId && (
                <Badge variant={BadgeVariant.PRIMARY}>
                  <RowFit gap="4px">
                    <Info size={14} />
                    {lpPositionData.tokenId}
                  </RowFit>
                </Badge>
              )}
            </Row>
            <ButtonAction
              onClick={() => {
                onClose()
                setTab(0)
              }}
            >
              <X />
            </ButtonAction>
          </RowBetween>
          <Row
            style={{ backgroundColor: theme.buttonBlack, borderRadius: '16px', padding: '16px' }}
            sx={{ '>div': { flex: 1 } }}
          >
            <Column gap="4px">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Profit & Loss</Trans>
              </Text>
              <Text color={calculateTextProfitColor(lpPositionData?.pnl, theme)} fontWeight={500} lineHeight="24px">
                {lpPositionData?.pnl
                  ? formatDisplayNumber(lpPositionData.pnl, {
                      style: 'currency',
                      fractionDigits: 2,
                      allowDisplayNegative: true,
                    })
                  : '--'}
              </Text>
            </Column>
            <Column gap="4px">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Impermanent Loss</Trans>
              </Text>
              <Text
                color={calculateTextProfitColor(lpPositionData?.impermanentLoss, theme)}
                fontWeight={500}
                lineHeight="24px"
              >
                {lpPositionData?.impermanentLoss
                  ? formatDisplayNumber(lpPositionData.impermanentLoss, {
                      style: 'currency',
                      fractionDigits: 2,
                      allowDisplayNegative: true,
                    })
                  : '--'}
              </Text>
            </Column>
            <Column gap="4px">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Fees Earned</Trans>
              </Text>
              <Text
                color={calculateTextProfitColor(lpPositionData?.totalFeeEarned, theme)}
                fontWeight={500}
                lineHeight="24px"
              >
                {lpPositionData?.totalFeeEarned
                  ? formatDisplayNumber(lpPositionData.totalFeeEarned, { style: 'currency', fractionDigits: 2 })
                  : '--'}
              </Text>
            </Column>
            <Column gap="4px">
              <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                <Trans>Farm Rewards</Trans>
              </Text>
              <Text
                color={calculateTextProfitColor(lpPositionData?.totalFarmingReward, theme)}
                fontWeight={500}
                lineHeight="24px"
              >
                {lpPositionData?.totalFarmingReward
                  ? formatDisplayNumber(lpPositionData.totalFarmingReward, { style: 'currency', fractionDigits: 2 })
                  : '--'}
              </Text>
            </Column>
          </Row>
          <Row
            style={{ backgroundColor: theme.buttonBlack, borderRadius: '16px', padding: '16px' }}
            sx={{ '>div': { flex: 1 } }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0px, 1fr)', gap: '16px' }}>
              <Text fontSize="12px" color={theme.subText}>
                <Trans>Token</Trans>
              </Text>
              <Text fontSize="12px" color={theme.subText}>
                <Trans>Current Liquidity</Trans>
              </Text>
              <Text fontSize="12px" color={theme.subText}>
                <Trans>Provided Liquidity</Trans>
              </Text>
              <Row align="center" gap="4px">
                <Logo srcs={[token0.logo]} style={logoStyle} />
                <Text fontSize="14px">{token0.symbol}</Text>
              </Row>
              <RenderCurrencyValues
                amount={currentToken0Amount}
                tokenDecimals={token0.decimals}
                usd={currentToken0Usd}
                badge={`${Math.round(currentValueRatio * 100)}%`}
              />
              <RenderCurrencyValues
                amount={totalToken0Amount}
                tokenDecimals={token0.decimals}
                usd={totalToken0Usd}
                badge={`${Math.round(totalValueRatio * 100)}%`}
              />
              <Row align="center" gap="4px">
                <Logo srcs={[token1.logo]} style={logoStyle} />
                <Text fontSize="14px">{token1.symbol}</Text>
              </Row>
              <RenderCurrencyValues
                amount={currentToken1Amount}
                tokenDecimals={token1.decimals}
                usd={currentToken1Usd}
                badge={`${100 - Math.round(currentValueRatio * 100)}%`}
              />
              <RenderCurrencyValues
                amount={totalToken1Amount}
                tokenDecimals={token1.decimals}
                usd={totalToken1Usd}
                badge={`${100 - Math.round(totalValueRatio * 100)}%`}
              />
            </div>
          </Row>
          <Divider style={{ width: '100%' }} backgroundColor={theme.border + '90'} />
          <Row
            fontSize="20px"
            lineHeight="24px"
            fontWeight={500}
            color={theme.subText}
            gap="16px"
            sx={{ '>div': { cursor: 'pointer', '&.active': { color: theme.primary } } }}
          >
            <Text className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>
              <Trans>My Fee Earnings</Trans>
            </Text>
            {farmRewards !== undefined && (
              <>
                <Divider style={{ height: '16px', width: '1px' }} />
                <Text className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>
                  <Trans>My Farm Rewards</Trans>
                </Text>
              </>
            )}
          </Row>
          {tab === 0 && (
            <Row
              style={{ backgroundColor: theme.buttonBlack, borderRadius: '16px', padding: '16px' }}
              sx={{ '>div': { flex: 1 } }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0px, 1fr)', gap: '16px' }}>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Token</Trans>
                </Text>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Unclaimed</Trans>
                </Text>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Claimed</Trans>
                </Text>
                <Row align="center" gap="4px">
                  <Logo srcs={[token0.logo]} style={logoStyle} />
                  <Text fontSize="14px">{token0.symbol}</Text>
                </Row>
                <RenderCurrencyValues
                  amount={fees[0]?.balance}
                  tokenDecimals={token0.decimals}
                  usd={fees[0]?.quotes.usd.value}
                />
                <RenderCurrencyValues
                  amount={claimedFeeToken0Amount}
                  tokenDecimals={token0.decimals}
                  usd={claimedFeeToken0Usd}
                />
                <Row align="center" gap="4px">
                  <Logo srcs={[token1.logo]} style={logoStyle} />
                  <Text fontSize="14px">{token1.symbol}</Text>
                </Row>
                <RenderCurrencyValues
                  amount={fees[1]?.balance}
                  tokenDecimals={token1.decimals}
                  usd={fees[1]?.quotes.usd.value}
                />
                <RenderCurrencyValues
                  amount={claimedFeeToken1Amount}
                  tokenDecimals={token1.decimals}
                  usd={claimedFeeToken1Usd}
                />
              </div>
            </Row>
          )}
          {tab === 1 && (
            <Row
              style={{ backgroundColor: theme.buttonBlack, borderRadius: '16px', padding: '16px' }}
              sx={{ '>div': { flex: 1 } }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0px, 1fr)', gap: '16px' }}>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Token</Trans>
                </Text>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Unclaimed</Trans>
                </Text>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>Claimed</Trans>
                </Text>
                {farmRewards?.map(item => {
                  return (
                    <>
                      <Row align="center" gap="4px">
                        <Logo srcs={[item.token.logo]} style={logoStyle} />
                        <Text fontSize="14px">{item.token.symbol}</Text>
                      </Row>
                      <Column gap="8px">
                        <Text fontWeight={500} lineHeight="24px">
                          --
                        </Text>
                        <Row gap="8px">
                          <Text fontSize="14px" color={theme.subText}>
                            --
                          </Text>
                        </Row>
                      </Column>
                      <Column gap="8px">
                        <Text fontWeight={500} lineHeight="24px">
                          {+item.balance ? formatUnitsToFixed(item.balance, item.token.decimals, 8) : '--'}
                        </Text>
                        <Row gap="8px">
                          <Text fontSize="14px" color={theme.subText}>
                            {+item.quotes.usd.value
                              ? formatDisplayNumber(item.quotes.usd.value, { style: 'currency', fractionDigits: 2 })
                              : '--'}
                          </Text>
                        </Row>
                      </Column>
                    </>
                  )
                })}
              </div>
            </Row>
          )}
          <Row justify="flex-end" style={{ fontStyle: 'italic', fontSize: '14px', color: theme.subText }}>
            <Trans>Powered by Krystal Liquidity Lens</Trans>
          </Row>
        </Column>
      </Wrapper>
    </Modal>
  )
}

const RenderCurrencyValues = ({
  amount,
  tokenDecimals,
  usd,
  badge,
}: {
  amount?: string
  tokenDecimals?: number
  usd?: number
  badge?: string
}) => {
  const theme = useTheme()
  return (
    <Column gap="8px">
      <Text fontWeight={500} lineHeight="24px">
        {amount !== undefined && +amount !== 0 ? formatUnitsToFixed(amount, tokenDecimals, 8) : '--'}
      </Text>
      <Row gap="8px">
        <Text fontSize="14px" color={theme.subText}>
          {!!usd ? formatDisplayNumber(usd, { style: 'currency', fractionDigits: 2 }) : '--'}
        </Text>
        {badge && (
          <Badge variant={BadgeVariant.DEFAULT} style={{ fontSize: '12px' }}>
            {badge}
          </Badge>
        )}
      </Row>
    </Column>
  )
}
