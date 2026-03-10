import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, Token, defaultToken } from '@kyber/schema'
import TokenSelectorModal, { MAX_TOKENS, TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { InfoHelper } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import TokenAmountInput from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'
import { formatDisplayNumber } from 'utils/numbers'

const AddTokenButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 400;
  gap: 8px;
  padding: 0;
  width: fit-content;
`

const ShareText = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-style: italic;
  text-align: right;

  b {
    color: #2fd3c0;
    font-style: normal;
    font-weight: 500;
  }
`

interface AddLiquidityTokenInputProps {
  context?: {
    chainId: number
    poolAddress: string
    poolType: PoolType
    positionId?: string
    pool?: Pool | null
  }
  wallet?: {
    address?: string
    onConnect?: () => void
  }
  value?: {
    tokens?: Token[]
    amounts?: string
    balances?: Record<string, bigint>
    prices?: Record<string, number>
    slippage?: number
    tickLower?: number | null
    tickUpper?: number | null
  }
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onLiquiditySourceSelect?: (
    position: {
      exchange: string
      poolId: string
      positionId: string | number
    },
    initialTick?: { tickLower: number; tickUpper: number },
    initialSlippage?: number,
  ) => void
  onTokensChange?: (nextTokens: Token[]) => void
  onAmountsChange?: (nextAmounts: string) => void
}

const AddLiquidityTokenInput = ({
  context,
  wallet,
  value,
  onTrackEvent,
  onLiquiditySourceSelect,
  onTokensChange,
  onAmountsChange,
}: AddLiquidityTokenInputProps) => {
  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false)
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string>()

  const chainId = context?.chainId || 0
  const poolAddress = context?.poolAddress || ''
  const poolType = context?.poolType || PoolType.DEX_UNISWAPV3
  const positionId = context?.positionId
  const pool = context?.pool || null
  const currentTokens = useMemo(() => value?.tokens || [], [value?.tokens])
  const currentAmounts = value?.amounts || ''
  const currentBalances = useMemo(() => value?.balances || {}, [value?.balances])
  const currentPrices = useMemo(() => value?.prices || {}, [value?.prices])
  const slippage = value?.slippage
  const tickLower = value?.tickLower
  const tickUpper = value?.tickUpper
  const { token0 = defaultToken, token1 = defaultToken } = pool || {}
  const share = useMemo(() => {
    if (!pool) return undefined

    const reserveUsd = Number((pool as any).reserveUsd || 0)
    if (!reserveUsd) return undefined

    const totalUsdAmount = currentTokens.reduce((sum, token, index) => {
      const amount = Number(currentAmounts.split(',')[index] || 0)
      const price = currentPrices[token.address.toLowerCase()] || 0
      return sum + amount * price
    }, 0)

    if (!totalUsdAmount) return undefined
    return totalUsdAmount / reserveUsd
  }, [currentAmounts, currentPrices, currentTokens, pool])

  const onCloseTokenSelectModal = useCallback(() => {
    setOpenTokenSelectModal(false)
    setTokenAddressSelected(undefined)
  }, [])

  const handleOpenZapMigration = useCallback(
    (position: { exchange: string; poolId: string; positionId: string | number }, initialSlippage?: number) => {
      if (!onLiquiditySourceSelect || !pool) return undefined

      const dexNameObj = DEXES_INFO[poolType]?.name
      const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]
      onTrackEvent?.('LIQ_EXISTING_POSITION_SELECTED', {
        position_id: position.positionId?.toString(),
        pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        pool_protocol: dexName,
        pool_fee_tier: `${pool.fee}%`,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })

      return onLiquiditySourceSelect(
        position,
        tickLower !== null && tickUpper !== null && tickLower !== undefined && tickUpper !== undefined
          ? { tickLower, tickUpper }
          : undefined,
        initialSlippage,
      )
    },
    [chainId, onLiquiditySourceSelect, onTrackEvent, pool, poolType, tickLower, tickUpper],
  )

  const handleSetAmount = useCallback(
    (tokenIndex: number, nextAmount: string) => {
      const nextAmounts = currentAmounts.split(',')
      nextAmounts[tokenIndex] = nextAmount
      onAmountsChange?.(nextAmounts.join(','))
    },
    [currentAmounts, onAmountsChange],
  )

  const handleRemoveToken = useCallback(
    (tokenIndex: number) => {
      const nextTokens = [...currentTokens]
      nextTokens.splice(tokenIndex, 1)
      onTokensChange?.(nextTokens)

      const nextAmounts = currentAmounts.split(',')
      nextAmounts.splice(tokenIndex, 1)
      onAmountsChange?.(nextAmounts.join(','))
    },
    [currentAmounts, currentTokens, onAmountsChange, onTokensChange],
  )

  const handleWrappedSetTokensIn = useCallback(
    (nextTokens: Token[]) => {
      const previousAddresses = currentTokens.map(token => token.address.toLowerCase())
      const newTokens = nextTokens.filter(token => !previousAddresses.includes(token.address.toLowerCase()))

      if (newTokens.length > 0 && pool) {
        const poolPair = `${pool.token0.symbol}/${pool.token1.symbol}`
        newTokens.forEach(token => {
          const isZap =
            token.address.toLowerCase() !== pool.token0.address.toLowerCase() &&
            token.address.toLowerCase() !== pool.token1.address.toLowerCase()

          onTrackEvent?.('LIQ_TOKEN_SELECTED', {
            token_symbol: token.symbol,
            token_address: token.address,
            pool_pair: poolPair,
            is_zap: isZap,
            chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
          })
        })
      }

      onTokensChange?.(nextTokens)
    },
    [chainId, currentTokens, onTokensChange, onTrackEvent, pool],
  )

  return (
    <Stack gap={16} width="100%">
      {currentTokens.map((token, tokenIndex) => (
        <TokenAmountInput
          amount={currentAmounts.split(',')[tokenIndex] || ''}
          chainId={chainId}
          key={`${token.address}-${tokenIndex}`}
          tokenIndex={tokenIndex}
          pool={pool}
          token={token}
          tokenBalances={currentBalances}
          tokenPrices={currentPrices}
          onAmountChange={handleSetAmount}
          onTrackEvent={onTrackEvent}
          onTokenSelectOpen={address => {
            setTokenAddressSelected(address)
            setOpenTokenSelectModal(true)
          }}
          onTokenRemove={handleRemoveToken}
          tokensCount={currentTokens.length}
        />
      ))}

      <ShareText>
        Your Share: <b>{share ? formatDisplayNumber(share, { style: 'percent', significantDigits: 3 }) : '--'}</b> of
        Active Liquidity
      </ShareText>

      <AddTokenButton type="button" onClick={() => setOpenTokenSelectModal(true)}>
        + Add Token(s) or Use Existing Position
        <InfoHelper
          placement="bottom"
          text={t`You can either zap in with up to ${MAX_TOKENS} tokens or select an existing position as the liquidity source`}
          color="#31cb9e"
          width="300px"
        />
      </AddTokenButton>

      {openTokenSelectModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <TokenSelectorModal
            chainId={chainId}
            onClose={onCloseTokenSelectModal}
            wallet={{
              account: wallet?.address,
              onConnectWallet: wallet?.onConnect,
            }}
            tokenOptions={{
              tokensIn: currentTokens,
              amountsIn: currentAmounts,
              setTokensIn: handleWrappedSetTokensIn,
              setAmountsIn: nextAmounts => onAmountsChange?.(nextAmounts),
              mode: tokenAddressSelected ? TOKEN_SELECT_MODE.SELECT : TOKEN_SELECT_MODE.ADD,
              selectedTokenAddress: tokenAddressSelected,
              token0Address: token0.address,
              token1Address: token1.address,
            }}
            positionOptions={{
              showUserPositions: !!onLiquiditySourceSelect,
              positionId,
              poolAddress,
              initialSlippage: slippage,
              onSelectLiquiditySource: onLiquiditySourceSelect ? handleOpenZapMigration : undefined,
            }}
          />,
          document.body,
        )}
    </Stack>
  )
}

export default AddLiquidityTokenInput
