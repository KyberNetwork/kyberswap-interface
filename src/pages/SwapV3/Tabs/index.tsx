import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'

import { Tab, TabContainer, TabWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'

const Tabs: React.FC = () => {
  const navigateFn = useNavigate()
  const { networkInfo } = useActiveWeb3React()
  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const { pathname } = useLocation()

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)

  const onClickTabSwap = () => {
    if (isSwapPage) {
      return
    }

    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname: `${APP_PATHS.SWAP}/${networkInfo.route}`,
      search: stringify(newQs),
    })
  }

  return (
    <TabContainer>
      <TabWrapper>
        <Tab onClick={onClickTabSwap} isActive={isSwapPage}>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Swap</Trans>
          </Text>
        </Tab>
        <LimitTab />
      </TabWrapper>
    </TabContainer>
  )
}
export default Tabs
