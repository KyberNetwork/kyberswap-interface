import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { getListOrder } from 'components/swapv2/LimitOrder/request'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { Tab } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { getLimitOrderContract } from 'utils'
import { toCurrencyAmount } from 'utils/currencyAmount'

const BetaTag = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  position: absolute;
  top: 4px;
  right: -38px;
  padding: 2px 6px;
  background-color: ${({ theme }) => theme.buttonGray};
  border-radius: 10px;
`

const getListActiveOrders = async (chainId: ChainId) => {
  const abortController = new AbortController()
  const data = await getListOrder(
    {
      chainId,
      maker: '0xbd993611EEE8e4Fdf2759f276070118Acfb085A5',
      status: LimitOrderStatus.ACTIVE,
      page: 1,
      pageSize: 50,
    },
    abortController.signal,
  )

  const neededAmounts = data.orders.map(order => {
    const token = new Token(chainId, order.makerAsset, order.makerAssetDecimals, order.makerAssetSymbol, '')
    const makingAmount = toCurrencyAmount(token, order.makingAmount)
    const filledAmount = toCurrencyAmount(token, order.filledMakingAmount)

    const neededMakingAmount = makingAmount.subtract(filledAmount)
    return neededMakingAmount
  })

  return neededAmounts
}

const LimitTab: React.FC = () => {
  const navigateFn = useNavigate()
  const { chainId, networkInfo } = useActiveWeb3React()
  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const whitelistTokens = useAllTokens()
  const currencies: Token[] = useMemo(() => Object.values(whitelistTokens), [whitelistTokens])
  const [currencyBalances, isLoadingBalances] = useTokenBalancesWithLoadingIndicator(currencies)
  console.log({ currencyBalances: !!currencyBalances, isLoadingBalances })

  const { pathname } = useLocation()

  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)

  const onClickTab = () => {
    if (isLimitPage) {
      return
    }

    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname: `${APP_PATHS.LIMIT}/${networkInfo.route}`,
      search: stringify(newQs),
    })
  }

  useEffect(() => {
    const run = async () => {
      const data = await getListActiveOrders(chainId)
      console.log({ data })
    }

    run()
  }, [chainId])

  if (!getLimitOrderContract(chainId)) {
    return null
  }

  return (
    <Tab onClick={onClickTab} isActive={isLimitPage}>
      <Text fontSize={20} fontWeight={500}>
        <Trans>Limit</Trans>
      </Text>
      <BetaTag>
        <Trans>Beta</Trans>
      </BetaTag>
    </Tab>
  )
}
export default LimitTab
