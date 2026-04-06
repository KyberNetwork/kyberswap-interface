import { PoolType, Pool as ZapPool } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonErrorStyle, ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityTokenInput'
import EstimatedPositionApr from 'pages/Earns/PoolDetail/AddLiquidity/components/EstimatedPositionApr'
import PriceSection from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection'
import SlippageControl from 'pages/Earns/PoolDetail/AddLiquidity/components/SlippageControl'
import { useApproval } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useApproval'
import { useFeedback } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useFeedback'
import { useZapActions } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapActions'
import { useZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { useWalletModalToggle } from 'state/application/hooks'

const FormStack = styled(Stack)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
`

type AddLiquidityWidgetContext = {
  chainId: ChainId
  poolAddress: string
  poolType: PoolType
  pool: ZapPool
}

type AddLiquidityWidgetPreview = {
  loading?: boolean
  onPreview?: () => Promise<void>
}

type AddLiquidityWidgetProps = {
  context: AddLiquidityWidgetContext
  state: ReturnType<typeof useZapState>
  preview?: AddLiquidityWidgetPreview
  feedback: ReturnType<typeof useFeedback>['widget']
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onOpenZapMigration?: (
    position: { exchange: string; poolId: string; positionId: string | number },
    initialTick?: { tickUpper: number; tickLower: number },
    initialSlippage?: number,
  ) => void
}

const AddLiquidityWidget = ({
  context,
  state,
  preview,
  feedback,
  onTrackEvent,
  onOpenZapMigration,
}: AddLiquidityWidgetProps) => {
  const { chainId: poolChainId, poolAddress, poolType, pool } = context
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [highlightDegenMode, setHighlightDegenMode] = useState(false)

  const isUniV3 = state.priceRange.isUniV3
  const route = state.route.data

  const approval = useApproval({
    tokensIn: state.tokenInput.tokens,
    amountsIn: state.tokenInput.amounts,
    route,
  })

  const openDegenModeSetting = () => {
    setIsSettingsOpen(true)
    setHighlightDegenMode(true)
  }
  const actions = useZapActions({
    state,
    approval,
    poolChainId,
    isZapImpactBlocked: feedback.isZapImpactBlocked,
    onOpenSettings: openDegenModeSetting,
    preview,
  })

  const PrimaryActionButton = actions.primaryActionVariant === 'error' ? ButtonErrorStyle : ButtonPrimary

  useEffect(() => {
    if (!highlightDegenMode) return

    document.getElementById('earn-add-liquidity-setting')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timeoutId = window.setTimeout(() => {
      setHighlightDegenMode(false)
    }, 4000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [highlightDegenMode])

  return (
    <FormStack gap={16}>
      <Stack gap={12}>
        <HStack align="center" justify="space-between">
          <Text fontWeight={500} letterSpacing="0.06em">
            ADD LIQUIDITY
          </Text>
          <AddLiquiditySettings
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            highlightDegenMode={highlightDegenMode}
          />
        </HStack>

        <AddLiquidityTokenInput
          context={{
            chainId: poolChainId,
            poolType,
            poolAddress,
            pool,
          }}
          wallet={{
            address: account || undefined,
            onConnect: toggleWalletModal,
          }}
          value={{
            tokens: state.tokenInput.tokens,
            amounts: state.tokenInput.amounts,
            balances: state.tokenInput.balances,
            prices: state.tokenInput.prices,
            route,
            slippage: state.slippage.value,
            tickLower: state.priceRange.tickLower,
            tickUpper: state.priceRange.tickUpper,
          }}
          onTrackEvent={onTrackEvent}
          onOpenZapMigration={onOpenZapMigration}
          onTokensChange={state.tokenInput.setTokens}
          onAmountsChange={state.tokenInput.setAmounts}
        />
      </Stack>

      {isUniV3 && (
        <PriceSection
          context={{
            chainId: poolChainId,
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
          }}
          onTrackEvent={onTrackEvent}
          onRevertPriceToggle={state.priceRange.toggleRevertPrice}
          onTickLowerChange={state.priceRange.setTickLower}
          onTickUpperChange={state.priceRange.setTickUpper}
        />
      )}

      {feedback.securityWarnings.map(message => (
        <NoteCard key={message} $warning>
          {message}
        </NoteCard>
      ))}

      {feedback.routeWarnings.map(message => (
        <NoteCard key={message} $warning>
          {message}
        </NoteCard>
      ))}

      {isUniV3 && (
        <EstimatedPositionApr
          chainId={poolChainId}
          poolAddress={poolAddress}
          isFarming={pool.isFarming}
          tickLower={state.priceRange.tickLower}
          tickUpper={state.priceRange.tickUpper}
          route={route}
        />
      )}

      <SlippageControl
        context={{
          chainId: poolChainId,
          poolType,
          pool,
        }}
        value={{
          slippage: state.slippage.value,
          suggestedSlippage: state.slippage.suggestedValue,
          route,
        }}
        onTrackEvent={onTrackEvent}
        onSlippageChange={state.slippage.setValue}
      />

      <HStack gap={16}>
        <PrimaryActionButton
          altDisabledStyle
          onClick={() => void actions.handlePrimaryAction()}
          disabled={actions.isPrimaryActionDisabled}
        >
          {actions.primaryActionText}
        </PrimaryActionButton>
      </HStack>
    </FormStack>
  )
}

export default AddLiquidityWidget
