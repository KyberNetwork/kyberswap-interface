import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'

import { Tab, TabContainer, TabWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { TAB } from 'pages/SwapV3'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'
import { getLimitOrderContract } from 'utils'

type Props = {
  activeTab: TAB
}
export default function Tabs({ activeTab }: Props) {
  const navigateFn = useNavigate()
  const { networkInfo, chainId, isEVM } = useActiveWeb3React()
  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const { pathname } = useLocation()

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)
  const onClickTab = (tab: TAB) => {
    console.log(tab, activeTab)
    if (activeTab === tab) {
      return
    }

    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname:
        tab === TAB.CROSS_CHAIN
          ? APP_PATHS.CROSS_CHAIN
          : `${tab === TAB.LIMIT ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}`,
      search: stringify(newQs),
    })
  }

  return (
    <TabContainer>
      <TabWrapper>
        <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={isSwapPage}>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Swap</Trans>
          </Text>
        </Tab>
        {getLimitOrderContract(chainId) && <LimitTab onClick={() => onClickTab(TAB.LIMIT)} />}
        {isEVM && (
          <Tab onClick={() => onClickTab(TAB.CROSS_CHAIN)} isActive={isCrossChainPage}>
            <Text fontSize={20} fontWeight={500}>
              <Trans>Cross-Chain</Trans>
            </Text>
          </Tab>
        )}
      </TabWrapper>
    </TabContainer>
  )
}
