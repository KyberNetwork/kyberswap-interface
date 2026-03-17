import { NATIVE_TOKEN_ADDRESS, PoolType, Pool as ZapPool } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useGetHoneypotInfoQuery } from 'services/zapInService'
import styled from 'styled-components'

import { ButtonErrorStyle, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityTokenInput'
import PositionApr from 'pages/Earns/PoolDetail/AddLiquidity/components/PositionApr'
import PriceSection from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection'
import SlippageControl from 'pages/Earns/PoolDetail/AddLiquidity/components/SlippageControl'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import useApproval from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useApproval'
import useZapActions from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapActions'
import useZapState from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getSecurityWarnings } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'

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

interface AddLiquidityWidgetContext {
  chainId: ChainId
  poolAddress: string
  poolType: PoolType
  pool: ZapPool
}

interface AddLiquidityWidgetPreview {
  loading?: boolean
  onPreview?: (permitData?: string) => Promise<void>
}

interface AddLiquidityWidgetProps {
  context: AddLiquidityWidgetContext
  state: ReturnType<typeof useZapState>
  isZapImpactBlocked: boolean
  preview?: AddLiquidityWidgetPreview
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onCancel?: () => void
}

export default function AddLiquidityWidget({
  context,
  state,
  isZapImpactBlocked,
  preview,
  onTrackEvent,
  onCancel,
}: AddLiquidityWidgetProps) {
  const { chainId: poolChainId, poolAddress, poolType, pool } = context
  const { account, toggleWalletModal } = useAddLiquidityRuntimeContext()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [highlightDegenMode, setHighlightDegenMode] = useState(false)

  const route = state.route.data
  const validationError = state.validation.error

  const tokensToCheck = useMemo(() => {
    return [pool.token0, pool.token1].filter(
      token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
    )
  }, [pool])

  const { data: honeypotInfoMap } = useGetHoneypotInfoQuery(
    {
      chainId: poolChainId || ChainId.MAINNET,
      addresses: tokensToCheck.map(token => token.address),
    },
    {
      skip: !tokensToCheck.length,
    },
  )

  const securityWarnings = useMemo(
    () => getSecurityWarnings({ tokens: tokensToCheck, honeypotInfoMap }),
    [honeypotInfoMap, tokensToCheck],
  )

  const approval = useApproval({
    tokensIn: state.tokenInput.tokens,
    amountsIn: state.tokenInput.amounts,
    route,
  })

  const shouldShowFeedback = Boolean(account)
  const openDegenModeSetting = () => {
    setIsSettingsOpen(true)
    setHighlightDegenMode(true)
  }

  const actions = useZapActions({
    state,
    approval,
    poolChainId,
    isZapImpactBlocked,
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
          <WidgetTitle>ADD LIQUIDITY</WidgetTitle>
          <AddLiquiditySettings
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            highlightDegenMode={highlightDegenMode}
          />
        </HStack>

        <AddLiquidityTokenInput
          context={{
            chainId: poolChainId,
            poolAddress,
            poolType,
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
          onTokensChange={state.tokenInput.setTokens}
          onAmountsChange={state.tokenInput.setAmounts}
        />
      </Stack>

      {state.priceRange.isUniV3 && (
        <>
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

          <PositionApr
            chainId={poolChainId}
            poolAddress={poolAddress}
            isFarming={pool.isFarming}
            tickLower={state.priceRange.tickLower}
            tickUpper={state.priceRange.tickUpper}
            route={route}
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

      <SlippageControl
        context={{
          chainId: poolChainId,
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
        <ButtonOutlined onClick={onCancel}>Cancel</ButtonOutlined>
        <PrimaryActionButton
          disabled={actions.isPrimaryActionDisabled}
          onClick={() => {
            void actions.handlePrimaryAction()
          }}
          altDisabledStyle
        >
          {actions.primaryActionText}
        </PrimaryActionButton>
      </HStack>
    </FormStack>
  )
}
