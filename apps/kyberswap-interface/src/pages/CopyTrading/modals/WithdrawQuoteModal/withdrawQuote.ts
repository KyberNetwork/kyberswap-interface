import type { WithdrawQuotePreview } from 'services/copyTrading/types/preparedActions'

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
