import { Trans, t } from '@lingui/macro'
import memoizeOne from 'memoize-one'
import { CSSProperties, memo, useState } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeGrid, areEqual } from 'react-window'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { OutlineCard } from 'components/Card'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import {
  Position,
  Position as SubgraphPosition,
  usePositionFees,
  useRemoveLiquidityLegacy,
} from 'hooks/useElasticLegacy'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import useTheme from 'hooks/useTheme'
import { outerElementType } from 'pages/ProAmmPool/PositionGrid'
import { Tab, TabContainer } from 'pages/ProAmmPool/PositionListItem'
import { Bound } from 'state/mint/proamm/type'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatTickPrice } from 'utils/formatTickPrice'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

const Item = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 20px;
`

export default function AllPositionLegacy({ positions }: { positions: SubgraphPosition[] }) {
  const feeRewards = usePositionFees(positions)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const addresses = [...new Set(positions.map(item => [item.token0.id, item.token1.id]).flat())]

  const tokenPrices = useTokenPrices(addresses)

  const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3

  const itemData = createItemData(positions, tokenPrices, feeRewards)

  return (
    <>
      <Flex marginTop="1.25rem" />
      <FixedSizeGrid
        width={1176}
        columnCount={columnCount}
        outerElementType={outerElementType}
        rowCount={Math.ceil(positions.length / columnCount)}
        height={752}
        columnWidth={upToSmall ? 368 : 392}
        rowHeight={376}
        itemData={itemData}
      >
        {Row}
      </FixedSizeGrid>
    </>
  )
}

const Row = memo(
  ({
    rowIndex,
    columnIndex,
    style,
    data,
  }: {
    rowIndex: number
    columnIndex: number
    style: CSSProperties
    data: {
      positions: Position[]
      feeRewards: Record<string, [string, string]>
      tokenPrices: Record<string, number>
    }
  }) => {
    const styles = {
      ...style,
      left: columnIndex === 0 ? style.left : Number(style.left) + columnIndex * 24,
      right: columnIndex === 3 ? style.right : Number(style.right) + columnIndex * 24,
    }

    const { positions, feeRewards, tokenPrices } = data

    const theme = useTheme()
    const [tab, setTab] = useState<'liquidity' | 'price_range'>('liquidity')

    const { chainId, account } = useActiveWeb3React()

    const sortedPositions = positions.sort((a, b) => +b.liquidity - +a.liquidity)
    const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
    const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
    const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3
    const index = rowIndex * columnCount + columnIndex
    const p = sortedPositions[index]

    const {
      removeLiquidity,
      collectFee,
      handleDismiss,
      removeLiquidityError,
      attemptingTxn,
      txnHash,
      showPendingModal,
      token0,
      token1,
      position,
      feeValue0,
      feeValue1,
      usd,
    } = useRemoveLiquidityLegacy(p || positions[0], tokenPrices, feeRewards)

    const pTemp = p || positions[0]
    const tickAtLimit = useIsTickAtLimit(+pTemp.pool.feeTier, +pTemp.tickLower.tickIdx, +pTemp.tickUpper.tickIdx)

    if (!p) return <div />

    const outOfRange = +p.pool.tick < +p.tickLower.tickIdx || +p.pool.tick >= +p.tickUpper.tickIdx

    const price = position.pool.priceOf(position.pool.token0)
    const priceLower = position.token0PriceLower
    const priceUpper = position.token0PriceUpper

    const isOwner = p.owner.toLowerCase() === account?.toLowerCase()

    return (
      <div style={styles}>
        <Item>
          <Flex justifyContent="space-between" alignItems="center">
            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={unwrappedToken(token0)} currency1={unwrappedToken(token1)} size={20} />
              <Text fontWeight="500">
                {unwrappedToken(token0).symbol} - {unwrappedToken(token1).symbol}
              </Text>
              <FeeTag>Fee {((Number(p.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
            </Flex>

            <RangeBadge hideText removed={p.liquidity === '0'} inRange={!outOfRange} />
          </Flex>

          <Flex marginTop="8px" color={theme.subText} fontSize="12px" justifyContent="space-between">
            <Flex alignItems="center">
              {shortenAddress(chainId, p.pool.id)}
              <CopyHelper toCopy={p.pool.id} />
            </Flex>
            <Text>
              ID:{' '}
              <Text as="span" color={theme.text}>
                {p.id}
              </Text>
            </Text>
          </Flex>

          <TabContainer style={{ marginTop: '1rem' }}>
            <Tab isActive={tab === 'liquidity'} onClick={() => setTab('liquidity')}>
              <Trans>My Liquidity</Trans>
            </Tab>
            <Tab isActive={tab === 'price_range'} onClick={() => setTab('price_range')}>
              <Trans>Price Range</Trans>
            </Tab>
          </TabContainer>

          {tab === 'liquidity' && (
            <OutlineCard padding="12px" marginTop="1rem" borderRadius="1rem">
              <Flex justifyContent="space-between" fontSize="12px" color={theme.subText}>
                <Text>
                  <Trans>My Liquidity Balance</Trans>
                </Text>
                <Text color={theme.text} fontWeight="500">
                  {formatDollarAmount(usd)}
                </Text>
              </Flex>
              <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                <Text>
                  <Trans>My Pooled {unwrappedToken(token0).symbol}</Trans>
                </Text>
                <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={unwrappedToken(token0)} size="12px" />
                  {position.amount0.toSignificant(6)}
                </Flex>
              </Flex>
              <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginY="12px">
                <Text>
                  <Trans>My Pooled {unwrappedToken(token1).symbol}</Trans>
                </Text>
                <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={unwrappedToken(token1)} size="12px" />
                  {position.amount1.toSignificant(6)}
                </Flex>
              </Flex>
              <Divider />
              <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                <Text>
                  <Trans>{unwrappedToken(token0).symbol} Fees Earned</Trans>
                </Text>
                <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={unwrappedToken(token0)} size="12px" />
                  {feeValue0.toSignificant(6)}
                </Flex>
              </Flex>
              <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                <Text>
                  <Trans>{unwrappedToken(token1).symbol} Fees Earned</Trans>
                </Text>
                <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={unwrappedToken(token1)} size="12px" />
                  {feeValue1.toSignificant(6)}
                </Flex>
              </Flex>
            </OutlineCard>
          )}

          {tab === 'price_range' && (
            <>
              <OutlineCard padding="12px" marginTop="1rem" borderRadius="1rem">
                <Text fontSize="12px" color={theme.subText}>
                  <Trans>Selected Price Range</Trans>:
                </Text>

                <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                  <Text>
                    <Trans>Current Price</Trans>
                  </Text>
                  <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                    {price.toSignificant(6)} {unwrappedToken(token1).symbol} per {unwrappedToken(token0).symbol}
                  </Flex>
                </Flex>

                <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                  <Text>
                    <Trans>Min Price</Trans>
                  </Text>
                  <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                    {formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)} {unwrappedToken(token1).symbol} per{' '}
                    {unwrappedToken(token0).symbol}
                  </Flex>
                </Flex>

                <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
                  <Text>
                    <Trans>Max Price</Trans>
                  </Text>
                  <Flex color={theme.text} fontWeight="500" alignItems="center" sx={{ gap: '4px' }}>
                    {formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)} {unwrappedToken(token1).symbol} per{' '}
                    {unwrappedToken(token0).symbol}
                  </Flex>
                </Flex>
              </OutlineCard>

              <Flex height="38px" />
            </>
          )}

          <Flex marginTop="1rem" sx={{ gap: '12px' }}>
            <ButtonPrimary
              style={{ height: '36px' }}
              disabled={p.liquidity === '0' || !isOwner}
              onClick={() => removeLiquidity(true)}
            >
              <MouseoverTooltip text={!isOwner ? t`Please withdraw your liquidity from farm contract first` : ''}>
                <Text sx={{ borderBottom: !isOwner ? `1px dotted ${theme.border}` : undefined }}>Remove Liquidity</Text>
              </MouseoverTooltip>
            </ButtonPrimary>
            <ButtonOutlined
              style={{ height: '36px' }}
              disabled={(feeValue0.equalTo('0') && feeValue1.equalTo('0')) || !isOwner}
              onClick={() => {
                collectFee()
              }}
            >
              <MouseoverTooltip text={!isOwner ? t`Please withdraw your liquidity from farm contract first` : ''}>
                <Text
                  sx={{
                    borderBottom:
                      !isOwner && (feeValue0.greaterThan('0') || feeValue1.greaterThan('0'))
                        ? `1px dotted ${theme.border}`
                        : undefined,
                  }}
                >
                  Collect Fees
                </Text>
              </MouseoverTooltip>
            </ButtonOutlined>
          </Flex>
        </Item>

        <TransactionConfirmationModal
          isOpen={!!showPendingModal}
          onDismiss={handleDismiss}
          hash={txnHash}
          attemptingTxn={attemptingTxn}
          pendingText={showPendingModal === 'collectFee' ? t`Collecting Fees` : t`Removing liquidity`}
          content={() => (
            <Flex flexDirection={'column'} width="100%">
              {removeLiquidityError ? (
                <TransactionErrorContent
                  onDismiss={handleDismiss}
                  message={removeLiquidityError}
                  confirmText={
                    removeLiquidityError?.includes('burn amount exceeds balance') ? 'Remove without Fees' : ''
                  }
                  confirmAction={() => {
                    if (removeLiquidityError?.includes('burn amount exceeds balance')) {
                      removeLiquidity(false)
                    }
                  }}
                />
              ) : null}
            </Flex>
          )}
        />
      </div>
    )
  },
  areEqual,
)

Row.displayName = 'RowItem'

const createItemData = memoizeOne(
  (positions: Position[], tokenPrices: Record<string, number>, feeRewards: Record<string, [string, string]>) => {
    return {
      positions,
      tokenPrices,
      feeRewards,
    }
  },
)
