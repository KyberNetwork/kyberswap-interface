import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAddWalletToPortfolioMutation,
  useLazyGetPortfoliosQuery,
  useUpdateWalletToPortfolioMutation,
} from 'services/portfolio'

import { NotificationType } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'
import { useNotify } from 'state/application/hooks'
import { isAddress } from 'utils'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'
import { isULIDString } from 'utils/string'

export const formatAllowance = (value: string, decimals: number) => {
  return ethers.BigNumber.from(value).gte(
    ethers.BigNumber.from('1000000000000000000000000000000000000000000000000000000000000000'),
  )
    ? t`Unlimited`
    : formatDisplayNumber(uint256ToFraction(value, decimals), { style: 'decimal', significantDigits: 6 }) // todo uint256ToFraction
}

export const useParseWalletPortfolioParam = () => {
  const { portfolioId, wallet: walletParam } = useParams<{ wallet?: string; portfolioId?: string }>()
  const wallet = isAddress(ChainId.MAINNET, walletParam) || isAddress(ChainId.MAINNET, portfolioId) || ''
  return {
    wallet,
    portfolioId: isAddress(ChainId.MAINNET, portfolioId) || !isULIDString(portfolioId) ? '' : portfolioId,
  }
}

type Params = { wallet?: string; portfolioId?: string; myPortfolio?: boolean }

// path/id/wallet or path/wallet
export const getPortfolioDetailUrl = ({ wallet, portfolioId, myPortfolio = true }: Params) =>
  [myPortfolio ? APP_PATHS.MY_PORTFOLIO : APP_PATHS.PORTFOLIO, portfolioId, wallet].filter(Boolean).join('/')

export const useNavigateToPortfolioDetail = () => {
  const navigate = useNavigate()
  return useCallback(
    (data: Params) => {
      navigate(getPortfolioDetailUrl(data))
    },
    [navigate],
  )
}

export const useNavigateToMyFirstPortfolio = () => {
  const { portfolioId } = useParseWalletPortfolioParam()
  const { account } = useActiveWeb3React()
  const navigate = useNavigateToPortfolioDetail()

  return useCallback(
    (data: Portfolio[] | undefined, lazy?: boolean) => {
      if (!lazy && (!account || (portfolioId && data?.some(el => el.id === portfolioId)))) {
        return
      }
      if (!data?.length) {
        navigate({ wallet: account })
        return
      }
      navigate({ portfolioId: data?.[0]?.id })
    },
    [account, navigate, portfolioId],
  )
}

export const useLazyNavigateToMyFirstPortfolio = () => {
  const navigate = useNavigateToMyFirstPortfolio()
  const [getPortfolio] = useLazyGetPortfoliosQuery()

  return useCallback(async () => {
    try {
      const { data } = await getPortfolio(undefined, true)
      navigate(data, true)
    } catch (error) {}
  }, [navigate, getPortfolio])
}

export const useAddWalletToPortfolio = () => {
  const [addWallet] = useAddWalletToPortfolioMutation()
  const [updateWallet] = useUpdateWalletToPortfolioMutation()
  const notify = useNotify()

  const onAddUpdateWallet = useCallback(
    async ({
      walletId,
      ...data
    }: {
      walletAddress: string
      nickName: string
      walletId?: number
      portfolioId: string
    }) => {
      try {
        await (walletId ? updateWallet(data).unwrap() : addWallet(data).unwrap())
        notify({
          type: NotificationType.SUCCESS,
          title: t`Portfolio updated`,
          summary: t`Your portfolio has been successfully updated`,
        })
      } catch (error) {
        notify({
          type: NotificationType.ERROR,
          title: t`Portfolio update failed`,
          summary: t`Failed to update your portfolio, please try again.`,
        })
      }
    },
    [addWallet, notify, updateWallet],
  )

  return onAddUpdateWallet
}
