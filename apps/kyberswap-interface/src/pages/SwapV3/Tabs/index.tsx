import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { TAB } from 'pages/SwapV3'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'
import { isSupportLimitOrder } from 'utils'
import { NewLabel } from 'components/Menu'

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

const TabWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media only screen and (min-width: 768px) {
    margin-bottom: 0;
  }
`

export const Tab = styled(ButtonEmpty)<{ isActive: boolean }>`
  width: fit-content;
  font-weight: 500;
  padding: 0px 0.5rem;
  margin-bottom: 4px;
  color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.subText)};
  position: relative;
  border-radius: 0;
  font-size: 18px;
  border-left: 2px solid ${({ theme }) => theme.border};
  :first-child {
    border: none;
    padding-left: 0;
  }
  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }

  &:last-child {
    margin-right: 0;
  }

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    font-size: 14px;
    padding: 0px 0.25rem;
  `}
`

type Props = {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  customChainId?: ChainId
}
export default function Tabs({ activeTab, setActiveTab, customChainId }: Props) {
  const navigateFn = useNavigate()
  const { networkInfo, chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId

  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const { pathname } = useLocation()

  const isParnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)

  const [searchParams] = useSearchParams()
  let features = (searchParams.get('features') || '')
    .split(',')
    .filter(item => [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN].includes(item))
  if (!features.length) features = [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN]

  const show = (tab: TAB) => (isParnerSwap ? features.includes(tab) : true)

  const onClickTab = (tab: TAB) => {
    if (activeTab === tab) {
      return
    }
    if (isParnerSwap) {
      setActiveTab(tab)
      return
    }

    setActiveTab(tab)
    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname:
        tab === TAB.CROSS_CHAIN
          ? APP_PATHS.CROSS_CHAIN
          : `${tab === TAB.LIMIT ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}`,
      search: new URLSearchParams(newQs).toString(),
    })
  }

  return (
    <TabContainer>
      <TabWrapper>
        {show(TAB.SWAP) && (
          <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={TAB.SWAP === activeTab}>
            <Text fontWeight={500}>
              <Trans>Swap</Trans>
            </Text>
          </Tab>
        )}
        {show(TAB.LIMIT) && isSupportLimitOrder(chainId) && (
          <LimitTab
            onClick={() => onClickTab(TAB.LIMIT)}
            active={activeTab === TAB.LIMIT}
            customChainId={customChainId}
          />
        )}
        <Tab
          onClick={() => onClickTab(TAB.CROSS_CHAIN)}
          isActive={activeTab === TAB.CROSS_CHAIN}
          data-testid="cross-chain-tab"
        >
          <Flex fontWeight={500}>
            <Trans>Cross-Chain</Trans>
            <NewLabel>New</NewLabel>
          </Flex>
        </Tab>
      </TabWrapper>
    </TabContainer>
  )
}
