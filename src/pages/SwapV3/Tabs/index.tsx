import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { APP_PATHS, CHAINS_SUPPORT_CROSS_CHAIN } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { TAB } from 'pages/SwapV3'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'
import { isSupportLimitOrder } from 'utils'

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
  font-weight: 400;
  padding: 0px 1rem;
  margin-bottom: 4px;
  color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.subText)};
  position: relative;
  border-radius: 0;
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

  ${({ theme }) => theme.mediaWidth.upToSmall`  
      padding: 0px 0.75rem;
  `}
`

type Props = {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
}
export default function Tabs({ activeTab, setActiveTab }: Props) {
  const navigateFn = useNavigate()
  const { networkInfo, chainId } = useActiveWeb3React()
  const qs = useParsedQueryString<{
    outputCurrency: string
    inputCurrency: string
  }>()

  const { pathname } = useLocation()

  const isParnetSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)
  const onClickTab = (tab: TAB) => {
    if (activeTab === tab) {
      return
    }
    if (isParnetSwap) {
      setActiveTab(tab)
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
        <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={TAB.SWAP === activeTab}>
          <Text fontSize={20} fontWeight={500}>
            <Trans>Swap</Trans>
          </Text>
        </Tab>
        {isSupportLimitOrder(chainId) && (
          <LimitTab onClick={() => onClickTab(TAB.LIMIT)} active={activeTab === TAB.LIMIT} />
        )}
        {CHAINS_SUPPORT_CROSS_CHAIN.includes(chainId) && (
          <Tab onClick={() => onClickTab(TAB.CROSS_CHAIN)} isActive={activeTab === TAB.CROSS_CHAIN}>
            <Text fontSize={20} fontWeight={500}>
              <Trans>Cross-Chain</Trans>
            </Text>
          </Tab>
        )}
      </TabWrapper>
    </TabContainer>
  )
}
