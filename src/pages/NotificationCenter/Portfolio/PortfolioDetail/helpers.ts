import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useParams } from 'react-router-dom'

import useParsedQueryString from 'hooks/useParsedQueryString'
import { isAddress } from 'utils'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

export const formatAllowance = (value: string, decimals: number) =>
  value === ethers.constants.MaxUint256.toString()
    ? t`Unlimited`
    : formatDisplayNumber(uint256ToFraction(value, decimals), { style: 'decimal', significantDigits: 6 }) // todo uint256ToFraction

export const useParseWalletPortfolioParam = () => {
  const { wallet, portfolioId } = useParams<{ wallet?: string; portfolioId?: string }>()
  const qs = useParsedQueryString()
  const walletParam = String(wallet || qs.wallet || '')
  return { wallet: isAddress(ChainId.MAINNET, walletParam) || '', portfolioId }
}
