import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, Pool, Token } from '@kyber/schema'
import { Trans } from '@lingui/macro'
import { formatUnits } from 'ethers/lib/utils'
import { ChangeEvent, useMemo } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownIcon } from 'assets/images/dropdown.svg'
import { ReactComponent as CloseIcon } from 'assets/images/x.svg'
import { ReactComponent as WalletIcon } from 'assets/svg/earn/ic_add_liquidity_wallet.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  position: relative;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
`

const QuickActionButton = styled.button`
  padding: 4px 8px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  line-height: 1;

  :hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const BalanceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  font-size: 12px;

  :hover {
    filter: brightness(1.2);
  }
`

const BalanceIcon = styled(WalletIcon)`
  flex: 0 0 auto;
`

const AmountInput = styled.input`
  flex: 1 1 0;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.text};
  font-size: 30px;
  font-weight: 400;
  line-height: 1.1;
  outline: none;

  ::placeholder {
    color: ${({ theme }) => theme.subText};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 28px;
  `}
`

const AmountMeta = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  white-space: nowrap;
`

const TokenButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 999px;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  white-space: nowrap;

  :hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

const TokenSymbol = styled.span`
  font-size: 14px;
  font-weight: 500;
`

const Chevron = styled(DropdownIcon)`
  flex: 0 0 auto;
`

const RemoveButton = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  top: 0px;
  right: 0px;
  background: transparent;
  border: none;
  border-radius: 0;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    color: ${({ theme }) => theme.text};
  }
`

interface TokenAmountInputProps {
  token: Token
  amount?: string
  tokenIndex: number
  tokensCount?: number
  chainId: number
  pool?: Pool | null
  tokenBalances?: Record<string, bigint>
  tokenPrices?: Record<string, number>
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onAmountChange?: (index: number, nextAmount: string) => void
  onTokenRemove?: (index: number) => void
  onTokenSelectOpen?: (address: string) => void
}

const TokenAmountInput = ({
  token,
  amount = '',
  tokenIndex,
  tokensCount = 0,
  chainId,
  pool,
  tokenBalances = {},
  tokenPrices = {},
  onTrackEvent,
  onAmountChange,
  onTokenRemove,
  onTokenSelectOpen,
}: TokenAmountInputProps) => {
  const balanceKey =
    token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      ? NATIVE_TOKEN_ADDRESS.toLowerCase()
      : token.address.toLowerCase()

  const balanceInWei = tokenBalances[balanceKey]?.toString() || '0'
  const usdAmount = useMemo(
    () => (tokenPrices[token.address.toLowerCase()] || 0) * parseFloat(amount || '0'),
    [amount, token.address, tokenPrices],
  )

  const normalizeActionAmount = (nextAmount: string) => (parseFloat(nextAmount || '0') > 0 ? nextAmount : '')
  const updateAmount = (nextAmount: string) => onAmountChange?.(tokenIndex, nextAmount)

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, '.')
    if (value === '.') return

    const inputRegex = /^\d*(?:[.]\d*)?$/
    if (value === '' || inputRegex.test(value)) updateAmount(value)
  }

  const applyPercentage = (percentage: number) => {
    if (!balanceInWei) return

    const rawBalance = BigInt(balanceInWei)
    const nextAmount =
      percentage === 100
        ? formatUnits(rawBalance.toString(), token.decimals)
        : formatUnits(((rawBalance * BigInt(percentage)) / 100n).toString(), token.decimals)
    const normalizedAmount = normalizeActionAmount(nextAmount)

    updateAmount(normalizedAmount)

    const poolPair = pool ? `${pool.token0.symbol}/${pool.token1.symbol}` : ''
    const usdValue = (tokenPrices[token.address.toLowerCase()] || 0) * parseFloat(normalizedAmount || '0')

    if (percentage === 100 || percentage === 50) {
      onTrackEvent?.(percentage === 100 ? 'LIQ_MAX_CLICKED' : 'LIQ_HALF_CLICKED', {
        token_symbol: token.symbol,
        token_address: token.address,
        [percentage === 100 ? 'max_amount' : 'half_amount']: normalizedAmount,
        [percentage === 100 ? 'max_amount_usd' : 'half_amount_usd']: usdValue,
        pool_pair: poolPair,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })
    }
  }

  return (
    <Card gap={16} style={{ borderTopRightRadius: tokensCount > 1 ? 4 : 12 }}>
      <HStack align="center" justify="space-between" gap={12}>
        <HStack align="center" gap={8} wrap="wrap">
          <QuickActionButton type="button" onClick={() => applyPercentage(25)}>
            <Trans>25%</Trans>
          </QuickActionButton>
          <QuickActionButton type="button" onClick={() => applyPercentage(50)}>
            <Trans>50%</Trans>
          </QuickActionButton>
          <QuickActionButton type="button" onClick={() => applyPercentage(75)}>
            <Trans>75%</Trans>
          </QuickActionButton>
          <QuickActionButton type="button" onClick={() => applyPercentage(100)}>
            <Trans>100%</Trans>
          </QuickActionButton>
        </HStack>

        <BalanceButton
          type="button"
          onClick={() => updateAmount(normalizeActionAmount(formatUnits(balanceInWei, token.decimals)))}
        >
          <BalanceIcon width={14} height={14} />
          {formatDisplayNumber(formatUnits(balanceInWei, token.decimals), { significantDigits: 8 })}
        </BalanceButton>
      </HStack>

      <HStack align="center" gap={12}>
        <AmountInput inputMode="decimal" onChange={handleAmountChange} placeholder="0.0" value={amount} />
        {!!usdAmount && (
          <AmountMeta>
            ~
            {formatDisplayNumber(usdAmount, {
              significantDigits: 6,
              style: 'currency',
            })}
          </AmountMeta>
        )}
        <TokenButton onClick={() => onTokenSelectOpen?.(token.address)} type="button">
          <TokenLogo src={token.logo} size={20} />
          <TokenSymbol>{token.symbol}</TokenSymbol>
          <Chevron />
        </TokenButton>
      </HStack>

      {tokensCount > 1 && (
        <RemoveButton type="button" onClick={() => onTokenRemove?.(tokenIndex)}>
          <CloseIcon width={14} height={14} />
        </RemoveButton>
      )}
    </Card>
  )
}

export default TokenAmountInput
