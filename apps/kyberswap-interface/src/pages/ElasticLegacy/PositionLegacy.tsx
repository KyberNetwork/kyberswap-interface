import { Trans, t } from '@lingui/macro'

import { ReactComponent as DropdownSvg } from 'assets/svg/down.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/legacyPools'
import { useActiveWeb3React } from 'hooks'
import { Position as SubgraphPosition, usePositionFees, useRemoveLiquidityLegacy } from 'hooks/useElasticLegacy'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

export const FeeTag = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      'ml-1.5 flex h-5 w-max min-w-max items-center gap-1 rounded-full bg-[#1183b733] px-1.5 py-0.5 text-xs font-medium text-darkBlue',
      className,
    )}
  >
    {children}
  </div>
)

const TABLE_GRID = 'grid grid-cols-[0.75fr_2fr_1fr_1.5fr_1fr] items-center p-4 font-medium'

export default function PositionLegacy({ positions }: { positions: SubgraphPosition[] }) {
  const addresses = [...new Set(positions.map(item => [item.token0.id, item.token1.id]).flat())]

  const tokenPrices = useTokenPrices(addresses)

  const feeRewards = usePositionFees(positions)

  return (
    <div className="overflow-x-scroll rounded-2xl border border-border bg-background p-6 text-sm leading-normal text-subText">
      <div className="min-w-[860px] overflow-x-scroll">
        <div className={cn(TABLE_GRID, 'rounded-t-lg bg-tableHeader text-xs text-subText')}>
          <span>
            <Trans>NFT ID</Trans>
          </span>
          <span>
            <Trans>Pools</Trans>
          </span>
          <span>
            <Trans>My liquidity</Trans>
          </span>
          <span>
            <Trans>My fees earned</Trans>
          </span>
          <span className="text-right">
            <Trans>Action</Trans>
          </span>
        </div>

        {positions.map(item => {
          return <Row key={item.id} position={item} feeRewards={feeRewards} tokenPrices={tokenPrices} />
        })}
      </div>
    </div>
  )
}

const Row = ({
  position: item,
  tokenPrices,
  feeRewards,
}: {
  position: SubgraphPosition
  tokenPrices: Record<string, number>
  feeRewards: Record<string, [string, string]>
}) => {
  const {
    removeLiquidity,
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
  } = useRemoveLiquidityLegacy(item, tokenPrices, feeRewards)

  const { account } = useActiveWeb3React()

  return (
    <div key={item.id} className={cn(TABLE_GRID, 'border-b border-border bg-background text-sm text-text')}>
      <span className="text-subText">{item.id}</span>

      <div className="flex items-center">
        <DoubleCurrencyLogo currency0={unwrappedToken(token0)} currency1={unwrappedToken(token1)} />
        <span className="text-primary">
          {unwrappedToken(token0).symbol} - {unwrappedToken(token1).symbol}
        </span>
        <FeeTag>
          <Trans>Fee {((Number(item.pool?.feeTier) || 0) * 100) / ELASTIC_BASE_FEE_UNIT}%</Trans>
        </FeeTag>
      </div>

      <div className="flex w-fit items-center justify-start">
        <MouseoverTooltip
          width="fit-content"
          placement="bottom"
          text={
            <div className="flex flex-col text-xs">
              <div className="flex items-center gap-1">
                <CurrencyLogo currency={unwrappedToken(position.amount0.currency)} size="16px" />
                <span className="font-medium">{position.amount0.toSignificant(6)}</span>
                <span className="font-medium">{unwrappedToken(position.amount0.currency).symbol}</span>
              </div>

              <div className="mt-1.5 flex items-center gap-1">
                <CurrencyLogo currency={unwrappedToken(position.amount1.currency)} size="16px" />
                <span className="font-medium">{position.amount1.toSignificant(6)}</span>
                <span className="font-medium">{unwrappedToken(position.amount1.currency).symbol}</span>
              </div>
            </div>
          }
        >
          {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
          <DropdownSvg />
        </MouseoverTooltip>
      </div>

      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-1">
          <CurrencyLogo currency={unwrappedToken(token0)} size="16px" />
          <span className="font-medium">{feeValue0.toSignificant(6)}</span>
          <span className="font-medium">{unwrappedToken(token0).symbol}</span>
        </div>

        <div className="flex items-center gap-1">
          <CurrencyLogo currency={unwrappedToken(token1)} size="16px" />
          <span className="font-medium">{feeValue1.toSignificant(6)}</span>
          <span className="font-medium">{unwrappedToken(token1).symbol}</span>
        </div>
      </div>

      <div className="flex justify-end">
        {item.owner !== account?.toLowerCase() ? (
          <MouseoverTooltip
            placement="top"
            text={t`You need to withdraw your deposited liquidity position from the Farm first.`}
          >
            <ButtonPrimary padding="6px 12px" className="!bg-buttonGray !text-border">
              <span className="text-xs">
                <Trans>Remove Liquidity</Trans>
              </span>
            </ButtonPrimary>
          </MouseoverTooltip>
        ) : (
          <ButtonOutlined padding="6px 12px" width="fit-content" onClick={() => removeLiquidity(true)}>
            <span className="text-xs">
              <Trans>Remove Liquidity</Trans>
            </span>
          </ButtonOutlined>
        )}
      </div>

      <TransactionConfirmationModal
        isOpen={!!showPendingModal}
        onDismiss={handleDismiss}
        hash={txnHash}
        attemptingTxn={attemptingTxn}
        pendingText={t`Removing liquidity`}
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
}
