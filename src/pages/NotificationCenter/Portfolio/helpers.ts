import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { isAddress } from 'utils'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'

export const formatAllowance = (value: string, decimals: number) =>
  value === ethers.constants.MaxUint256.toString()
    ? t`Unlimited`
    : formatDisplayNumber(uint256ToFraction(value, decimals), { style: 'decimal', significantDigits: 6 }) // todo uint256ToFraction

export const useParseWalletPortfolioParam = () => {
  const { portfolioId, wallet: walletParam } = useParams<{ wallet?: string; portfolioId?: string }>()
  const wallet = isAddress(ChainId.MAINNET, walletParam) || isAddress(ChainId.MAINNET, portfolioId) || ''
  return { wallet, portfolioId: isAddress(ChainId.MAINNET, portfolioId) ? '' : portfolioId }
}

export const useNavigateToPortfolioDetail = () => {
  const navigate = useNavigate()
  return useCallback(
    ({ wallet, portfolioId, myPortfolio = true }: { wallet?: string; portfolioId?: string; myPortfolio?: boolean }) => {
      const path = myPortfolio ? APP_PATHS.MY_PORTFOLIO : APP_PATHS.PORTFOLIO
      navigate(portfolioId ? `${path}/${portfolioId}${wallet ? `/${wallet}` : ''}` : `${path}/${wallet}`)
    },
    [navigate],
  )
}
