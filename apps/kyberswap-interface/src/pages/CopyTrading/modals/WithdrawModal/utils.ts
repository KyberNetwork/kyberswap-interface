import type { WithdrawQuotePreview, WithdrawTokensPreview } from 'services/copyTrading/types/preparedActions'

import { getWritePrimaryActionLabel, isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'

export const UINT256_MAX_RAW = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export const validateWithdrawAmountRaw = (amountRaw?: string) => {
  if (!amountRaw || !/^[1-9]\d*$/.test(amountRaw)) return 'Enter an amount greater than zero.'
  if (BigInt(amountRaw) > BigInt(UINT256_MAX_RAW)) return 'The withdrawal amount is too large.'
  return undefined
}

export const getWithdrawRequestAmountRaw = (amountRaw: string | undefined, withdrawAll: boolean) =>
  withdrawAll ? UINT256_MAX_RAW : amountRaw

export const getWithdrawPresetAmountRaw = (balanceRaw: string, percentage: 50 | 100) =>
  ((BigInt(balanceRaw) * BigInt(percentage)) / 100n).toString()

export const getPreparedQuoteBalanceRaw = (preview?: WithdrawQuotePreview) => {
  const balanceRaw = preview?.quoteBalance?.valueRaw
  return balanceRaw && /^\d+$/.test(balanceRaw) ? balanceRaw : undefined
}

export const getWithdrawAmountError = ({
  amount,
  amountRaw,
  hasQuoteCurrency,
  walletBalanceRaw,
  withdrawAll,
}: {
  amount: string
  amountRaw?: string
  hasQuoteCurrency: boolean
  walletBalanceRaw?: string
  withdrawAll: boolean
}) => {
  if (!amount) return undefined
  if (!hasQuoteCurrency || !amountRaw) return 'Enter a valid quote-token amount.'
  if (BigInt(amountRaw) >= BigInt(UINT256_MAX_RAW)) return 'The withdrawal amount is too large.'
  if (!withdrawAll && walletBalanceRaw !== undefined && BigInt(amountRaw) > BigInt(walletBalanceRaw)) {
    return 'The Smart Wallet does not have enough quote-token balance.'
  }
  return undefined
}

export const validateWithdrawPreview = ({
  amountRaw,
  expectedQuoteToken,
  ownerAddress,
  preview,
}: {
  amountRaw: string
  expectedQuoteToken?: { address: string; decimals: number }
  ownerAddress: string
  preview?: WithdrawQuotePreview
}) => {
  const amountError = validateWithdrawAmountRaw(amountRaw)
  if (amountError) return amountError
  if (!preview?.recipientAddress || preview.recipientAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
    return 'The prepared withdrawal recipient does not match your wallet.'
  }
  if (preview.sweepAmountRaw !== amountRaw) {
    return 'The prepared withdrawal amount does not match the requested amount.'
  }
  if (
    !preview.quoteBalance?.valueRaw ||
    !/^\d+$/.test(preview.quoteBalance.valueRaw) ||
    (preview.quoteBalance.status !== 'METRIC_STATUS_CURRENT' && preview.quoteBalance.status !== 'METRIC_STATUS_STALE')
  ) {
    return 'The prepared withdrawal is missing its quote-balance evidence.'
  }
  if (
    expectedQuoteToken &&
    (!preview.quoteToken?.address ||
      preview.quoteToken.address.toLowerCase() !== expectedQuoteToken.address.toLowerCase() ||
      preview.quoteToken.decimals !== expectedQuoteToken.decimals)
  ) {
    return 'The prepared quote token does not match the selected balance.'
  }
  if (BigInt(preview.quoteBalance.valueRaw) <= 0n) {
    return 'The prepared Smart Wallet quote balance is empty.'
  }
  if (amountRaw !== UINT256_MAX_RAW && BigInt(preview.quoteBalance.valueRaw) < BigInt(amountRaw)) {
    return 'The Smart Wallet quote balance is lower than the requested amount.'
  }
  return undefined
}

export const validateWithdrawTokensPreview = (preview: WithdrawTokensPreview | undefined, owner: string) => {
  if (preview?.selection !== 'WITHDRAW_TOKEN_SELECTION_ALL_INDEXED_TOKENS')
    return 'The withdrawal selection does not match All Tokens.'
  if (preview.recipientAddress?.toLowerCase() !== owner.toLowerCase())
    return 'The withdrawal recipient does not match your wallet.'
  if (!preview.tokens?.length || preview.tokens.length > 32) return 'The prepared token selection is invalid.'
  const addresses = preview.tokens.map(item => item.token?.address?.toLowerCase())
  if (
    addresses.some(address => !address || !/^0x[0-9a-f]{40}$/.test(address)) ||
    new Set(addresses).size !== addresses.length
  )
    return 'The prepared token selection is invalid.'
  if (!preview.quoteToken?.address || !addresses.includes(preview.quoteToken.address.toLowerCase()))
    return 'The prepared selection is missing the quote token.'
  if (
    preview.tokens.some(
      ({ balance }) =>
        balance?.status !== 'METRIC_STATUS_CURRENT' || !balance.valueRaw || !/^\d+$/.test(balance.valueRaw),
    )
  )
    return 'The prepared token balances are unavailable. Prepare again.'
  return undefined
}

export const getWithdrawalPrimaryAction = ({
  accountConnected,
  onExpectedChain,
  isPreparing,
  executionBlocked,
  availabilityMessage,
  previewError,
}: {
  accountConnected: boolean
  onExpectedChain: boolean
  isPreparing: boolean
  executionBlocked: boolean
  availabilityMessage?: string
  previewError?: string
}) => ({
  label: getWritePrimaryActionLabel({
    accountConnected,
    onExpectedChain,
    readyLabel: 'Withdraw',
    unavailable: !!availabilityMessage || !!previewError,
    unavailableLabel: 'Withdraw Unavailable',
  }),
  disabled: isWritePrimaryActionDisabled({
    accountConnected,
    onExpectedChain,
    interactionLocked: isPreparing,
    executionBlocked,
  }),
  title: accountConnected && onExpectedChain ? previewError || availabilityMessage : undefined,
})
