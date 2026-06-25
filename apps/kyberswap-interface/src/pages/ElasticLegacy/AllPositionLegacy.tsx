import { Trans, t } from '@lingui/macro'
import memoizeOne from 'memoize-one'
import { CSSProperties, memo, useState } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeGrid, areEqual } from 'react-window'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { OutlineCard } from 'components/Card'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import {
  Position,
  Position as SubgraphPosition,
  usePositionFees,
  useRemoveLiquidityLegacy,
} from 'hooks/useElasticLegacy'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { FeeTag } from 'pages/ElasticLegacy/PositionLegacy'
import { outerElementType } from 'pages/ProAmmPool/PositionGrid'
import { Tab, TabContainer } from 'pages/ProAmmPool/PositionListItem'
import { Bound } from 'state/mint/proamm/type'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'
import { formatTickPrice } from 'utils/formatTickPrice'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

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
      <div className="mt-5" />
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

    const [tab, setTab] = useState<'liquidity' | 'price_range'>('liquidity')

    const { chainId } = useActiveWeb3React()

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

    return (
      <div style={styles}>
        <div className="rounded-[20px] bg-background p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DoubleCurrencyLogo currency0={unwrappedToken(token0)} currency1={unwrappedToken(token1)} size={20} />
              <span className="font-medium">
                {unwrappedToken(token0).symbol} - {unwrappedToken(token1).symbol}
              </span>
              <FeeTag>
                <Trans>Fee {((Number(p.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</Trans>
              </FeeTag>
            </div>

            <RangeBadge hideText removed={p.liquidity === '0'} inRange={!outOfRange} />
          </div>

          <div className="mt-2 flex justify-between text-xs text-subText">
            <div className="flex items-center">
              {shortenAddress(chainId, p.pool.id)}
              <CopyHelper toCopy={p.pool.id} />
            </div>
            <span>
              <Trans>
                ID: <span className="text-text">{p.id}</span>
              </Trans>
            </span>
          </div>

          <TabContainer className="mt-4">
            <Tab isActive={tab === 'liquidity'} onClick={() => setTab('liquidity')}>
              <Trans>My Liquidity</Trans>
            </Tab>
            <Tab isActive={tab === 'price_range'} onClick={() => setTab('price_range')}>
              <Trans>Price Range</Trans>
            </Tab>
          </TabContainer>

          {tab === 'liquidity' && (
            <OutlineCard className="mt-4 rounded-2xl p-3">
              <div className="flex justify-between text-xs text-subText">
                <span>
                  <Trans>My Liquidity Balance</Trans>
                </span>
                <span className="font-medium text-text">{formatDollarAmount(usd)}</span>
              </div>
              <div className="mt-3 flex justify-between text-xs text-subText">
                <span>
                  <Trans>My Pooled {unwrappedToken(token0).symbol}</Trans>
                </span>
                <div className="flex items-center gap-1 font-medium text-text">
                  <CurrencyLogo currency={unwrappedToken(token0)} size="12px" />
                  {position.amount0.toSignificant(6)}
                </div>
              </div>
              <div className="my-3 flex justify-between text-xs text-subText">
                <span>
                  <Trans>My Pooled {unwrappedToken(token1).symbol}</Trans>
                </span>
                <div className="flex items-center gap-1 font-medium text-text">
                  <CurrencyLogo currency={unwrappedToken(token1)} size="12px" />
                  {position.amount1.toSignificant(6)}
                </div>
              </div>
              <Divider />
              <div className="mt-3 flex justify-between text-xs text-subText">
                <span>
                  <Trans>{unwrappedToken(token0).symbol} Fees Earned</Trans>
                </span>
                <div className="flex items-center gap-1 font-medium text-text">
                  <CurrencyLogo currency={unwrappedToken(token0)} size="12px" />
                  {feeValue0.toSignificant(6)}
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-subText">
                <span>
                  <Trans>{unwrappedToken(token1).symbol} Fees Earned</Trans>
                </span>
                <div className="flex items-center gap-1 font-medium text-text">
                  <CurrencyLogo currency={unwrappedToken(token1)} size="12px" />
                  {feeValue1.toSignificant(6)}
                </div>
              </div>
            </OutlineCard>
          )}

          {tab === 'price_range' && (
            <>
              <OutlineCard className="mt-4 rounded-2xl p-3">
                <span className="text-xs text-subText">
                  <Trans>Selected Price Range</Trans>:
                </span>

                <div className="mt-3 flex justify-between text-xs text-subText">
                  <span>
                    <Trans>Current Price</Trans>
                  </span>
                  <div className="flex items-center gap-1 font-medium text-text">
                    <Trans>
                      {price.toSignificant(6)} {unwrappedToken(token1).symbol} per {unwrappedToken(token0).symbol}
                    </Trans>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-subText">
                  <span>
                    <Trans>Min Price</Trans>
                  </span>
                  <div className="flex items-center gap-1 font-medium text-text">
                    <Trans>
                      {formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)} {unwrappedToken(token1).symbol} per{' '}
                      {unwrappedToken(token0).symbol}
                    </Trans>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-subText">
                  <span>
                    <Trans>Max Price</Trans>
                  </span>
                  <div className="flex items-center gap-1 font-medium text-text">
                    <Trans>
                      {formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)} {unwrappedToken(token1).symbol} per{' '}
                      {unwrappedToken(token0).symbol}
                    </Trans>
                  </div>
                </div>
              </OutlineCard>

              <div className="h-[38px]" />
            </>
          )}

          <div className="mt-4 flex gap-3">
            <ButtonPrimary className="h-9" disabled={p.liquidity === '0'} onClick={() => removeLiquidity(true)}>
              <Trans>Remove Liquidity</Trans>
            </ButtonPrimary>
            <ButtonOutlined
              className="h-9"
              disabled={feeValue0.equalTo('0') && feeValue1.equalTo('0')}
              onClick={() => {
                collectFee()
              }}
            >
              <Trans>Collect Fees</Trans>
            </ButtonOutlined>
          </div>
        </div>

        <TransactionConfirmationModal
          isOpen={!!showPendingModal}
          onDismiss={handleDismiss}
          hash={txnHash}
          attemptingTxn={attemptingTxn}
          pendingText={showPendingModal === 'collectFee' ? t`Collecting Fees` : t`Removing liquidity`}
          content={() => (
            <div className="flex w-full flex-col">
              {removeLiquidityError ? (
                <TransactionErrorContent
                  onDismiss={handleDismiss}
                  message={removeLiquidityError}
                  confirmText={
                    removeLiquidityError?.includes('burn amount exceeds balance') ? t`Remove without fees` : ''
                  }
                  confirmAction={() => {
                    if (removeLiquidityError?.includes('burn amount exceeds balance')) {
                      removeLiquidity(false)
                    }
                  }}
                />
              ) : null}
            </div>
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
