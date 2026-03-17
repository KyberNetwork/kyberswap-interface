import { PoolType } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityReviewModal'
import AddLiquidityRouteInsights from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityRouteInsights'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityTokenInput'
import PositionApr from 'pages/Earns/PoolDetail/AddLiquidity/components/PositionApr'
import PriceSection from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection'
import SlippageControl from 'pages/Earns/PoolDetail/AddLiquidity/components/SlippageControl'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/reviewData'
import useAddLiquidityState from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityState'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { Exchange } from 'pages/Earns/constants'

const FormStack = styled(Stack)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
`

const WidgetTitle = styled(Text)`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  letter-spacing: 0.06em;
`

interface AddLiquidityWidgetViewContext {
  chainId: ChainId
  exchange: Exchange
  poolAddress: string
  poolType: PoolType
  positionId?: string
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
    account,
  } = context
  const validationError = feedback?.validationError || ''
  const securityWarnings = feedback?.securityWarnings || []
  const isZapImpactBlocked = Boolean(feedback?.isZapImpactBlocked)
  const isApprovalLoading = Boolean(action?.isApprovalLoading)
  const needsApprovalAction = Boolean(action?.needsApprovalAction)
  const hasPositiveInput = Boolean(action?.hasPositiveInput)
  const primaryActionText = action?.primaryActionText || 'Preview'
  const shouldShowFeedback = Boolean(account)
  const pool = state.pool.data
  if (!pool) return null

  return (
    <FormStack gap={16}>
      <Stack gap={12}>
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
            route: state.route.data,
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
            isFarming={pool.isFarming}
            tickLower={state.priceRange.tickLower}
            tickUpper={state.priceRange.tickUpper}
            amounts={state.tokenInput.amounts}
            route={state.route.data}
            routeLoading={state.route.loading}
          />
        </>
      )}

      {shouldShowFeedback && validationError ? <NoteCard $warning>{validationError}</NoteCard> : null}
      {shouldShowFeedback &&
        securityWarnings.map(message => (
          <NoteCard key={message} $warning>
            {message}
          </NoteCard>
        ))}
      {shouldShowFeedback && !validationError && state.route.error ? (
        <NoteCard $warning>{state.route.error}</NoteCard>
      ) : null}

      {shouldShowFeedback && !state.route.error ? (
        <AddLiquidityRouteInsights data={reviewData} degenModeBlocked={isZapImpactBlocked} />
      ) : null}

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
        <ButtonOutlined>Cancel</ButtonOutlined>
        <ButtonPrimary
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
          altDisabledStyle
        >
          {primaryActionText}
        </ButtonPrimary>
      </HStack>

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
