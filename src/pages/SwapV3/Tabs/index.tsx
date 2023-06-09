import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { TAB } from 'pages/SwapV3'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'
import { getLimitOrderContract } from 'utils'

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
