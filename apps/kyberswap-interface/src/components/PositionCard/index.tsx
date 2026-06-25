import { Pair } from '@kyberswap/ks-sdk-classic'
import { Fraction, Percent, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import InfoHelper from 'components/InfoHelper'
import { IconWrapper } from 'components/PageWrappers'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, DMM_ANALYTICS_URL, ONE_BIPS } from 'constants/index'
import { useTotalSupply } from 'data/TotalSupply'
import { useActiveWeb3React } from 'hooks'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import { ExternalLink, UppercaseText } from 'theme'
import { formattedNum, shortenAddress } from 'utils'
import { cn } from 'utils/cn'
import { currencyId } from 'utils/currencyId'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { unwrappedToken } from 'utils/wrappedCurrency'

const FixedHeightRow = ({ className, ...props }: React.ComponentProps<typeof RowBetween>) => (
  <RowBetween className={cn('h-6', className)} {...props} />
)

const VerticalDivider = ({ className }: { className?: string }) => (
  <div className={cn('h-2.5 w-px bg-subText', className)} />
)

const PositionCardWrapper = ({
  className,
  style,
  children,
}: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) => (
  <LightCard
    className={cn('relative overflow-hidden rounded-[20px] border-0 bg-background p-4 sm:p-5', className)}
    style={style}
  >
    {children}
  </LightCard>
)

const formattedUSDPrice = (tokenAmount: TokenAmount, price: number) => {
  const usdValue = parseFloat(tokenAmount.toSignificant(6)) * price

  return <span>{`(~${formattedNum(usdValue.toString(), true)})`}</span>
}

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
  myLiquidity?: UserLiquidityPosition
  tab?: 'ALL' | 'STAKED'
}

export function NarrowPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance),
        ]
      : [undefined, undefined]

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)
  return (
    <PositionCardWrapper style={border ? { border } : undefined}>
      <AutoColumn className="gap-3">
        <FixedHeightRow>
          <RowFixed>
            <span className="text-base font-medium">
              <Trans>My position</Trans>
            </span>
          </RowFixed>
        </FixedHeightRow>
        <FixedHeightRow onClick={() => setShowMore(!showMore)}>
          <RowFixed>
            <DoubleCurrencyLogo currency0={native0} currency1={native1} margin={true} size={20} />
            <span className="text-xl font-medium">
              {native0?.symbol}/{native1?.symbol}
            </span>
          </RowFixed>
          <RowFixed>
            <span className="text-xl font-medium">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'} </span>
          </RowFixed>
        </FixedHeightRow>
        <AutoColumn className="gap-1">
          <FixedHeightRow>
            <span className="text-base font-medium">
              <Trans>My pool share:</Trans>
            </span>
            <span className="text-base font-medium">
              {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
            </span>
          </FixedHeightRow>
          <FixedHeightRow>
            <span className="text-base font-medium">{native0?.symbol}:</span>
            {token0Deposited ? (
              <RowFixed>
                <span className="ml-1.5 text-base font-medium">{token0Deposited?.toSignificant(6)}</span>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>
          <FixedHeightRow>
            <span className="text-base font-medium">{native1?.symbol}:</span>
            {token1Deposited ? (
              <RowFixed>
                <span className="ml-1.5 text-base font-medium">{token1Deposited?.toSignificant(6)}</span>
              </RowFixed>
            ) : (
              '-'
            )}
          </FixedHeightRow>
        </AutoColumn>
      </AutoColumn>
    </PositionCardWrapper>
  )
}

export function MinimalPositionCard({ pair, showUnwrapped = false }: PositionCardProps) {
  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const userPoolBalance = useTokenBalance(pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance),
        ]
      : [undefined, undefined]

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  const usdPrices = useTokenPrices([pair.token0.wrapped.address, pair.token1.wrapped.address])

  // MinimalPositionItemDivider: 36px tall, border color, hidden under 1000px (`min-lg` is 1200, so use arbitrary).
  const minimalDivider = <div className="hidden h-9 w-px bg-border [@media(min-width:1000px)]:block" />

  // MinimalPositionItem: full width with bottom border under 1000px; fit-content + no border at 1000px+.
  const itemBase =
    'flex w-full flex-col gap-1 border-b border-border pb-4 [@media(min-width:1000px)]:w-fit [@media(min-width:1000px)]:border-b-0 [@media(min-width:1000px)]:pb-0'
  const itemNoBorder = 'flex w-full flex-col gap-1 [@media(min-width:1000px)]:w-fit'

  return (
    <>
      <div className="mx-4 border-b border-border py-4 text-base font-medium">
        <Trans>My Current Position</Trans>
      </div>

      <div
        className={cn(
          'flex flex-col items-start justify-between gap-4 rounded-[20px] bg-background p-4',
          '[@media(min-width:1000px)]:flex-row [@media(min-width:1000px)]:items-center [@media(min-width:1000px)]:px-4 [@media(min-width:1000px)]:py-5',
        )}
      >
        <div className={itemBase}>
          <RowFixed>
            <DoubleCurrencyLogo currency0={native0} currency1={native1} size={16} />
            <UppercaseText className="ml-1">
              <span className="text-xs font-medium text-subText">
                {native0?.symbol}/{native1?.symbol} <Trans>LP Tokens</Trans>
              </span>
            </UppercaseText>
          </RowFixed>
          <RowFixed>
            <span className="text-sm font-normal">{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'} </span>
          </RowFixed>
        </div>
        {minimalDivider}

        <div className={itemBase}>
          <div className="flex items-center gap-1">
            <CurrencyLogo currency={native0} size="16px" />
            <span className="text-xs font-medium">{native0?.symbol}</span>
          </div>

          {token0Deposited ? (
            <RowFixed>
              <span className="text-sm font-normal">
                {token0Deposited.equalTo('0')
                  ? '0'
                  : token0Deposited
                      .divide(token0Deposited.decimalScale)
                      .lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                  ? '<0.01'
                  : token0Deposited?.toSignificant(6)}{' '}
                {formattedUSDPrice(token0Deposited, usdPrices[pair.token0.wrapped.address])}
              </span>
            </RowFixed>
          ) : (
            '-'
          )}
        </div>

        {minimalDivider}

        <div className={itemBase}>
          <div className="flex items-center gap-1">
            <CurrencyLogo currency={native1} size="16px" />
            <span className="text-xs font-medium">{native1?.symbol}</span>
          </div>
          {token1Deposited ? (
            <RowFixed>
              <span className="text-sm font-normal">
                {token1Deposited.equalTo('0')
                  ? '0'
                  : token1Deposited
                      .divide(token1Deposited.decimalScale)
                      .lessThan(new Fraction(JSBI.BigInt(1), JSBI.BigInt(100)))
                  ? '<0.01'
                  : token1Deposited?.toSignificant(6)}{' '}
                {formattedUSDPrice(token1Deposited, usdPrices[pair.token1.wrapped.address])}
              </span>
            </RowFixed>
          ) : (
            '-'
          )}
        </div>

        {minimalDivider}
        <div className={itemNoBorder}>
          <span className="text-xs font-medium text-subText">
            <UppercaseText>
              <Trans>My Share Of Pool</Trans>
            </UppercaseText>
          </span>
          <span className="text-sm font-normal">
            {poolTokenPercentage && poolTokenPercentage.greaterThan('0')
              ? poolTokenPercentage?.lessThan(ONE_BIPS)
                ? '<0.01'
                : poolTokenPercentage?.toFixed(2)
              : '0'}
            %
          </span>
        </div>
      </div>
    </>
  )
}

const FullRow = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-2 flex justify-between text-xs font-medium leading-loose text-subText">{children}</div>
)

export default function FullPositionCard({ pair, border, stakedBalance, myLiquidity, tab }: PositionCardProps) {
  const { chainId, networkInfo } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const userDefaultPoolBalance = useTokenBalance(pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance),
        ]
      : [undefined, undefined]

  const [token0Staked, token1Staked] =
    !!pair &&
    !!totalPoolTokens &&
    !!stakedBalance &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, stakedBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, stakedBalance),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, stakedBalance),
        ]
      : [undefined, undefined]

  const amp = new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000))

  const percentToken0 = pair.reserve0.asFraction
    .divide(pair.virtualReserve0)
    .multiply('100')
    .divide(
      pair.reserve0.divide(pair.virtualReserve0).asFraction.add(pair.reserve1.divide(pair.virtualReserve1).asFraction),
    )
  const percentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(percentToken0)

  const usdValue = myLiquidity
    ? (parseFloat(myLiquidity.liquidityTokenBalance) * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const stakedUSD = myLiquidity
    ? (parseFloat(stakedBalance?.toExact() || '0') * parseFloat(myLiquidity.pool.reserveUSD)) /
      parseFloat(myLiquidity.pool.totalSupply)
    : 0

  const totalDeposit = formattedNum((usdValue + stakedUSD).toString(), true)

  const isWarning = percentToken0.lessThan(JSBI.BigInt(10)) || percentToken1.lessThan(JSBI.BigInt(10))

  const warningToken = isWarning
    ? percentToken0.lessThan(JSBI.BigInt(10))
      ? pair.token0.symbol
      : pair.token1.symbol
    : undefined

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  return (
    <PositionCardWrapper style={border ? { border } : undefined}>
      <div className="flex justify-between">
        <div>
          <div className="flex items-center">
            <DoubleCurrencyLogo currency0={native0} currency1={native1} size={24} />
            <span className="text-xl font-medium">{`${native0?.symbol}/${native1?.symbol}`}</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-max text-xs font-medium text-subText">AMP = {amp.toSignificant(5)}</span>

            <VerticalDivider />
            <div className="flex items-center text-xs text-subText">
              <span>{shortenAddress(chainId, pair.address, 3)}</span>
              <CopyHelper toCopy={pair.address} />
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {isWarning && (
            <MouseoverTooltip
              text={
                warningToken ? (
                  <span className="text-center text-warning">{t`Note: ${warningToken} is now <10% of the pool. Pool might become inactive if ${warningToken} reaches 0%.`}</span>
                ) : (
                  <span className="text-center text-warning">
                    <Trans>One token is close to 0% in the pool ratio. Pool might go inactive.</Trans>
                  </span>
                )
              }
            >
              <IconWrapper className="size-6 !bg-warning">
                <AlertTriangle className="text-textReverse" size={16} />
              </IconWrapper>
            </MouseoverTooltip>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-end" />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-base font-medium text-subText">
          {tab === 'ALL' ? <Trans>My Liquidity</Trans> : <Trans>My Staked</Trans>}
        </span>
        <div className="mt-0.5 flex items-baseline gap-1 text-xs text-subText">
          <div className="flex items-center">APR</div>
          <span className="text-xl font-medium text-apr">--</span>
        </div>
      </div>
      <Divider className="mt-2" />

      <div className="mt-3 flex h-[168px] flex-col">
        {tab === 'ALL' ? (
          <>
            <FullRow>
              <span>
                <Trans>My Liquidity Balance</Trans>
              </span>
              <span className="text-sm text-text">{totalDeposit}</span>
            </FullRow>
            <FullRow>
              <span>
                <Trans>Total LP Tokens</Trans>
              </span>
              <span className="text-sm text-text">{userPoolBalance?.toSignificant(6) ?? '-'}</span>
            </FullRow>
            <FullRow>
              <div className="flex items-center">
                <span>
                  <Trans>Available LP Tokens</Trans>
                </span>
                <InfoHelper text={t`Your available LP Token balance after staking (if applicable)`} size={14} />
              </div>
              <span className="text-sm text-text">{userDefaultPoolBalance?.toSignificant(6) ?? '0'}</span>
            </FullRow>

            <FullRow>
              <span>
                <Trans>Pooled {native0?.symbol}</Trans>
              </span>
              {token0Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <span className="ml-1.5 text-sm font-medium text-text">{token0Deposited?.toSignificant(6)}</span>
                </RowFixed>
              ) : (
                '-'
              )}
            </FullRow>
            <FullRow>
              <span>
                <Trans>Pooled {native1?.symbol}</Trans>
              </span>
              {token1Deposited ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <span className="ml-1.5 text-sm font-medium text-text">{token1Deposited?.toSignificant(6)}</span>
                </RowFixed>
              ) : (
                '-'
              )}
            </FullRow>

            <FullRow>
              <span>
                <Trans>My Share Of Pool</Trans>
              </span>
              <span className="text-sm text-text">
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </span>
            </FullRow>
          </>
        ) : (
          <>
            <FullRow>
              <span>
                <Trans>My Staked Balance</Trans>
              </span>
              <span className="text-sm text-text">{formattedNum(stakedUSD.toString(), true)}</span>
            </FullRow>
            <FullRow>
              <span>
                <Trans>Staked LP Tokens</Trans>
              </span>
              <span className="text-sm text-text">{stakedBalance?.toSignificant(6) ?? '-'}</span>
            </FullRow>
            <FullRow>
              <span>
                <Trans>Staked {native0?.symbol}</Trans>
              </span>
              {token0Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency0} />
                  <span className="ml-1.5 text-sm font-medium text-text">{token0Staked?.toSignificant(6)}</span>
                </RowFixed>
              ) : (
                '-'
              )}
            </FullRow>
            <FullRow>
              <span>
                <Trans>Staked {native1?.symbol}</Trans>
              </span>
              {token1Staked ? (
                <RowFixed>
                  <CurrencyLogo size="16px" currency={currency1} />
                  <span className="ml-1.5 text-sm font-medium text-text">{token1Staked?.toSignificant(6)}</span>
                </RowFixed>
              ) : (
                '-'
              )}
            </FullRow>
          </>
        )}
      </div>

      {tab === 'ALL' && (
        <div className="mt-5 flex gap-4">
          {userDefaultPoolBalance?.greaterThan(JSBI.BigInt(0)) ? (
            <ButtonOutlined
              className="p-2.5 text-sm"
              as={Link}
              to={`/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyId(currency0, chainId)}/${currencyId(
                currency1,
                chainId,
              )}/${pair.address}`}
            >
              <span className="w-max">
                <Trans>Remove Liquidity</Trans>
              </span>
            </ButtonOutlined>
          ) : (
            <ButtonPrimary disabled className="p-2.5 text-sm">
              <span className="w-max">
                <Trans>Remove Liquidity</Trans>
              </span>
            </ButtonPrimary>
          )}
        </div>
      )}

      <Divider className="mt-5" />

      <div className="mt-4 flex items-center justify-between">
        <ButtonEmpty width="max-content" className="text-sm" padding="0">
          <ExternalLink
            className="w-full text-center"
            href={`${DMM_ANALYTICS_URL[chainId]}/pool/${pair.address || ''}`}
          >
            <Trans>Analytics ↗</Trans>
          </ExternalLink>
        </ButtonEmpty>
      </div>
    </PositionCardWrapper>
  )
}
