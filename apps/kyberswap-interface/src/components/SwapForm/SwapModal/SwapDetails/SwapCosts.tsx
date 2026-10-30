import { Trans, t } from '@lingui/macro'
import { type ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { BuildRouteData } from 'services/route/types/buildRoute'

import Divider from 'components/Divider'
import { HStack, Stack } from 'components/Stack'
import { SwapFeeLabel, TooltipTextOfSwapFee, formatSwapFeePercent } from 'components/SwapForm/Quote/SwapFee'
import { useFeeERC8056Info, useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { DetailLabel, DetailRow } from 'components/SwapForm/SwapModal/SwapDetails/DetailRow'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { getERC8056DisplayAmount } from 'hooks/useERC8056Token'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { ExternalLink, ExternalLinkNoLineHeight } from 'theme'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { calculateFeeFromBuildData } from 'utils/fee'
import { formatDisplayNumber } from 'utils/numbers'
import { isInSafeApp } from 'utils/safeApp'

const AddressLink = ({ children, href }: { children: ReactNode; href: string }) => (
  <ExternalLinkNoLineHeight href={href} className="text-text underline [text-decoration-style:dotted]">
    <span className="text-xs">{children}</span>
  </ExternalLinkNoLineHeight>
)

const GasBreakdown = ({
  additionalCostUsd,
  expanded,
  gasUsd,
}: {
  additionalCostUsd: string | undefined
  expanded: boolean
  gasUsd: string | undefined
}) => {
  if (!additionalCostUsd || additionalCostUsd === '0') {
    return null
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <Stack className="gap-2">
          <HStack className="items-center justify-end gap-2">
            <DetailLabel placement="top" tooltip={<Trans>L2 execution fee</Trans>}>
              Est. L2 gas fee
            </DetailLabel>
            <p className="text-xs font-medium text-text">
              {gasUsd && formatDisplayNumber(gasUsd, { style: 'currency', significantDigits: 5 })}
            </p>
          </HStack>

          <HStack className="items-center justify-end gap-2">
            <DetailLabel placement="top" tooltip={<Trans>L1 fee that pays for rolls up cost</Trans>}>
              Est. L1 gas fee
            </DetailLabel>
            <p className="text-xs font-medium text-text">
              {formatDisplayNumber(additionalCostUsd, {
                style: 'currency',
                significantDigits: 5,
              })}
            </p>
          </HStack>
        </Stack>
      </div>
    </div>
  )
}

export const SwapGasDetails = ({
  isLoading,
  gasUsd,
  buildData,
}: {
  isLoading: boolean
  gasUsd: string | undefined
  buildData: BuildRouteData | undefined
}) => {
  const [showDetailGas, setShowDetailGas] = useState(false)
  const additionalCostUsd = buildData?.additionalCostUsd
  const hasAdditionalCost = Boolean(additionalCostUsd && additionalCostUsd !== '0')
  return (
    <HStack className="min-h-5 w-full items-start justify-between gap-4">
      <HStack className="h-5 w-fit min-w-max items-center">
        <DetailLabel tooltip={<Trans>Estimated network fee for your transaction.</Trans>}>
          {t`Estimated Total Gas`}
        </DetailLabel>
      </HStack>

      <ValueWithLoadingSkeleton
        skeletonStyle={{
          width: '64px',
        }}
        isShowingSkeleton={isLoading}
        content={
          <div className={cn('flex flex-col items-end', showDetailGas && hasAdditionalCost && 'gap-2')}>
            <div
              className={cn('flex h-5 items-center gap-1', hasAdditionalCost && 'cursor-pointer')}
              onClick={() => hasAdditionalCost && setShowDetailGas(prev => !prev)}
            >
              <p className="text-xs font-medium text-text">
                {gasUsd
                  ? formatDisplayNumber(+gasUsd + Number(buildData?.additionalCostUsd || 0), {
                      style: 'currency',
                      significantDigits: 5,
                    })
                  : '--'}
              </p>
              {hasAdditionalCost && (
                <ChevronDown
                  className={cn('cursor-pointer text-subText transition-transform', showDetailGas && 'rotate-180')}
                  size={14}
                />
              )}
            </div>
            <GasBreakdown additionalCostUsd={additionalCostUsd} expanded={showDetailGas} gasUsd={gasUsd} />
          </div>
        }
      />
    </HStack>
  )
}

export const SwapFeeAndRecipientDetails = ({
  isLoading,
  buildData,
}: {
  isLoading: boolean
  buildData: BuildRouteData | undefined
}) => {
  const { chainId, networkInfo, account } = useActiveWeb3React()
  const { routeSummary, recipient: recipientAddressOrName } = useSwapFormContext()
  const feeERC8056Info = useFeeERC8056Info()
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress
  const feeCurrencyAmountFromGet = routeSummary?.fee?.currencyAmount
  const { currencyAmount: feeCurrencyAmountFromBuild = undefined, currency: currencyFromBuild = undefined } =
    calculateFeeFromBuildData(routeSummary, buildData)
  const feeAmountFromBuild = feeCurrencyAmountFromBuild
    ? formatDisplayNumber(getERC8056DisplayAmount(feeERC8056Info, feeCurrencyAmountFromBuild).toExact(), {
        significantDigits: 10,
      })
    : ''

  const feeAmount = routeSummary?.extraFee?.feeAmount
  const feeAmountWithSymbol =
    feeAmountFromBuild && currencyFromBuild?.symbol ? `${feeAmountFromBuild} ${currencyFromBuild.symbol}` : ''
  const feePercent = formatSwapFeePercent(feeAmount)
  const isFeeUpdated = Boolean(
    buildData &&
      feeCurrencyAmountFromGet &&
      feeCurrencyAmountFromBuild &&
      feeCurrencyAmountFromGet.toExact() !== feeCurrencyAmountFromBuild.toExact(),
  )

  const feeTokenAddress = currencyFromBuild?.wrapped.address
  const tokenPrices = useTokenPrices(feeTokenAddress ? [feeTokenAddress] : [], currencyFromBuild?.chainId)
  const feeTokenPrice = feeTokenAddress ? tokenPrices[feeTokenAddress] : 0
  const feeAmountUsdText =
    feeCurrencyAmountFromBuild && feeTokenPrice
      ? formatDisplayNumber(Number(feeCurrencyAmountFromBuild.toExact()) * feeTokenPrice, {
          style: 'currency',
          significantDigits: 4,
        })
      : ''

  return (
    <>
      {isInSafeApp && !!feeAmount && feeAmount !== '0' && (
        <DetailRow
          isLoading={isLoading}
          label={
            <DetailLabel
              tooltip={
                <p>
                  Learn more about the Platform Fee{' '}
                  <ExternalLink href="https://docs.kyberswap.com/">here ↗</ExternalLink>
                </p>
              }
            >
              Platform Fee
            </DetailLabel>
          }
        >
          <p className="text-xs font-medium text-text">0.1%</p>
        </DetailRow>
      )}

      {!isInSafeApp && !!feeAmount && feeAmount !== '0' && (
        <DetailRow
          isLoading={isLoading}
          label={
            <HStack className="w-fit items-center gap-1">
              <DetailLabel tooltip={<TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={feeAmount} />}>
                <SwapFeeLabel />
              </DetailLabel>
              {isFeeUpdated && (
                <div className="flex rounded-[36px] bg-warning/30 px-1 py-0.5 text-[10px] leading-3 text-warning">
                  <Trans>Updated</Trans>
                </div>
              )}
            </HStack>
          }
        >
          <p className="flex flex-nowrap items-center gap-1 text-right text-xs font-medium">
            <span className="text-text">{feePercent || '--'}</span>
            {feeAmountUsdText && <span className="text-subText">(~{feeAmountUsdText})</span>}
          </p>
        </DetailRow>
      )}

      <Divider />
      {recipient && (
        <DetailRow
          label={
            <span className="text-xs text-subText">
              <Trans>Recipient</Trans>
            </span>
          }
        >
          <div className="flex items-center gap-1 text-xs font-medium">
            <img src={networkInfo.icon} alt="network icon" width="12px" height="12px" />
            <AddressLink href={`${networkInfo.etherscanUrl}/address/${recipient}`}>
              {shortenAddress(chainId, recipient)}
            </AddressLink>
          </div>
        </DetailRow>
      )}

      <DetailRow
        label={
          <DetailLabel
            tooltip={
              <Trans>
                The contract address that will be executing the swap. You can verify the contract in the block explorer.
              </Trans>
            }
          >
            <Trans>Contract Address</Trans>
          </DetailLabel>
        }
      >
        {buildData?.routerAddress && (
          <div className="flex items-center">
            <AddressLink href={`${networkInfo.etherscanUrl}/address/${buildData.routerAddress}`}>
              {shortenAddress(chainId, buildData.routerAddress)}
            </AddressLink>
          </div>
        )}
      </DetailRow>
    </>
  )
}
