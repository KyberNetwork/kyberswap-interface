import { PoolType } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityReviewModal'
import AddLiquidityRouteInsights from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityRouteInsights'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityTokenInput'
import PositionApr from 'pages/Earns/PoolDetail/AddLiquidity/components/PositionApr'
import SlippageControl from 'pages/Earns/PoolDetail/AddLiquidity/components/SlippageControl'
import PriceSection from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/PriceSection'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/reviewData'
import useAddLiquidityState from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityState'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { Exchange } from 'pages/Earns/constants'
import { EarnPool } from 'pages/Earns/types'

const FormStack = styled(Stack)`
  width: 100%;
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(20, 20, 22, 0.98) 0%, rgba(16, 16, 18, 0.98) 100%);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    border-radius: 18px;
  `}
`

const WidgetTitle = styled(Text)`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin: 0;
`

const FooterButton = styled.button<{ $primary?: boolean }>`
  flex: 1 1 0;
  height: 44px;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.primary : theme.tabActive)};
  cursor: pointer;
  border-radius: 14px;
  background: ${({ theme, $primary }) => ($primary ? theme.primary : 'transparent')};
  color: ${({ theme, $primary }) => ($primary ? theme.buttonBlack : theme.subText)};
  font-size: 16px;
  font-weight: 500;

  :disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

interface AddLiquidityWidgetViewContext {
  chainId: ChainId
  exchange: Exchange
  poolAddress: string
  poolType: PoolType
  positionId?: string
  earnPool?: EarnPool
  account?: string
}

interface AddLiquidityWidgetViewFeedback {
  validationError?: string
  securityWarnings?: string[]
  isZapImpactBlocked?: boolean
}

interface AddLiquidityWidgetViewAction {
  isApprovalLoading?: boolean
  needsApprovalAction?: boolean
  hasPositiveInput?: boolean
  primaryActionText?: string
  onPrimaryAction?: () => Promise<void>
}

interface AddLiquidityWidgetReviewDialog {
  isOpen?: boolean
  confirmDisabled?: boolean
  confirmLoading?: boolean
  txHash?: string
  txStatus?: '' | 'success' | 'failed' | 'cancelled'
  txError?: string | null
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onConfirm?: () => Promise<void>
  onViewPosition?: () => Promise<void>
}

interface AddLiquidityWidgetViewProps {
  context: AddLiquidityWidgetViewContext
  state: ReturnType<typeof useAddLiquidityState>
  reviewData?: AddLiquidityReviewData | null
  initialTick?: {
    tickLower: number | null
    tickUpper: number | null
  }
  feedback?: AddLiquidityWidgetViewFeedback
  action?: AddLiquidityWidgetViewAction
  reviewDialog?: AddLiquidityWidgetReviewDialog
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onConnectWallet?: () => void
}

export default function AddLiquidityWidgetView({
  context,
  state,
  reviewData,
  initialTick,
  feedback,
  action,
  reviewDialog,
  onTrackEvent,
  onConnectWallet,
}: AddLiquidityWidgetViewProps) {
  const {
    chainId: normalizedChainId,
    exchange: normalizedExchange,
    poolAddress,
    poolType,
    positionId,
    earnPool,
    account,
  } = context
  const validationError = feedback?.validationError || ''
  const securityWarnings = feedback?.securityWarnings || []
  const isZapImpactBlocked = Boolean(feedback?.isZapImpactBlocked)
  const isApprovalLoading = Boolean(action?.isApprovalLoading)
  const needsApprovalAction = Boolean(action?.needsApprovalAction)
  const hasPositiveInput = Boolean(action?.hasPositiveInput)
  const primaryActionText = action?.primaryActionText || 'Preview'
  const pool = state.pool.data
  if (!pool) return null

  return (
    <FormStack gap={16}>
      <Stack gap={20}>
        <HStack align="center" justify="space-between">
          <WidgetTitle>ADD LIQUIDITY</WidgetTitle>
          <AddLiquiditySettings />
        </HStack>

        <AddLiquidityTokenInput
          context={{
            chainId: normalizedChainId,
            poolAddress,
            poolType,
            positionId,
            pool,
          }}
          wallet={{
            address: account || undefined,
            onConnect: onConnectWallet,
          }}
          value={{
            tokens: state.tokenInput.tokens,
            amounts: state.tokenInput.amounts,
            balances: state.tokenInput.balances,
            prices: state.tokenInput.prices,
            slippage: state.slippage.value,
            tickLower: state.priceRange.tickLower,
            tickUpper: state.priceRange.tickUpper,
          }}
          onTrackEvent={onTrackEvent}
          onTokensChange={state.tokenInput.setTokens}
          onAmountsChange={state.tokenInput.setAmounts}
        />
      </Stack>

      {state.priceRange.isUniV3 && (
        <>
          <PriceSection
            context={{
              chainId: normalizedChainId,
              poolType,
              pool,
            }}
            value={{
              poolPrice: state.priceRange.poolPrice,
              revertPrice: state.priceRange.revertPrice,
              minPrice: state.priceRange.minPrice,
              maxPrice: state.priceRange.maxPrice,
              tickLower: state.priceRange.tickLower,
              tickUpper: state.priceRange.tickUpper,
              hasInitialTick: initialTick?.tickLower !== null && initialTick?.tickUpper !== null,
            }}
            onTrackEvent={onTrackEvent}
            onRevertPriceToggle={state.priceRange.toggleRevertPrice}
            onTickLowerChange={state.priceRange.setTickLower}
            onTickUpperChange={state.priceRange.setTickUpper}
          />

          <PositionApr
            chainId={normalizedChainId}
            poolAddress={poolAddress}
            pool={earnPool}
            isFarming={pool.isFarming}
            tickLower={state.priceRange.tickLower}
            tickUpper={state.priceRange.tickUpper}
            amounts={state.tokenInput.amounts}
            route={state.route.data}
          />
        </>
      )}

      {validationError ? <NoteCard $warning>{validationError}</NoteCard> : null}
      {securityWarnings.map(message => (
        <NoteCard key={message} $warning>
          {message}
        </NoteCard>
      ))}
      {!validationError && state.route.error ? <NoteCard $warning>{state.route.error}</NoteCard> : null}

      {!state.route.error ? (
        <AddLiquidityRouteInsights data={reviewData} degenModeBlocked={isZapImpactBlocked} />
      ) : null}

      <Stack gap={8}>
        <SlippageControl
          context={{
            chainId: normalizedChainId,
            poolType,
            pool,
          }}
          value={{
            slippage: state.slippage.value,
            suggestedSlippage: state.slippage.suggestedValue,
          }}
          onTrackEvent={onTrackEvent}
          onSlippageChange={state.slippage.setValue}
        />

        <HStack gap={16}>
          <FooterButton type="button">Cancel</FooterButton>
          <FooterButton
            $primary
            disabled={
              !!account &&
              (!hasPositiveInput ||
                !!validationError ||
                !state.route.data ||
                isApprovalLoading ||
                (isZapImpactBlocked && !needsApprovalAction))
            }
            onClick={() => {
              void action?.onPrimaryAction?.()
            }}
            type="button"
          >
            {primaryActionText}
          </FooterButton>
        </HStack>
      </Stack>

      <AddLiquidityReviewModal
        isOpen={reviewDialog?.isOpen}
        exchange={normalizedExchange}
        data={reviewData}
        confirmDisabled={reviewDialog?.confirmDisabled}
        confirmLoading={reviewDialog?.confirmLoading}
        txHash={reviewDialog?.txHash}
        txStatus={reviewDialog?.txStatus}
        txError={reviewDialog?.txError}
        transactionExplorerUrl={reviewDialog?.transactionExplorerUrl}
        onDismiss={reviewDialog?.onDismiss}
        onConfirm={() => {
          void reviewDialog?.onConfirm?.()
        }}
        onRevertPriceToggle={state.priceRange.toggleRevertPrice}
        onViewPosition={reviewDialog?.onViewPosition}
      />
    </FormStack>
  )
}
