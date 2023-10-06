import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useDispatch, useSelector } from 'react-redux'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import MultipleChainSelect from 'components/Select/MultipleChainSelect'
import {
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS,
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC,
  COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY,
  SUPPORTED_NETWORKS_FOR_MY_EARNINGS,
} from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { useAppSelector } from 'state/hooks'
import { selectChains } from 'state/myEarnings/actions'
import { useShowMyEarningChart } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

const OnOff = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  padding: 2px;
  border-radius: 999px;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     width: 100%;
     flex: 1;

      > div {
        flex: 1;
      }
  `};
`
const Item = styled.div<{ isActive: boolean }>`
  background: ${({ theme, isActive }) => (isActive ? theme.tableHeader : 'transparent')};
  color: ${({ theme, isActive }) => (isActive ? theme.text : theme.subText)};
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s ease;
  text-align: center;
`

const ChainSelect = () => {
  const [isShowEarningChart, toggleEarningChart] = useShowMyEarningChart()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const dispatch = useDispatch()
  const { mixpanelHandler } = useMixpanel()
  const { chainId } = useActiveWeb3React()

  const isLegacy = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)
  const isClassic = useAppSelector(state => state.myEarnings.activeTab === VERSION.CLASSIC)

  const comingSoonList = isLegacy
    ? COMING_SOON_NETWORKS_FOR_MY_EARNINGS_LEGACY
    : isClassic
    ? COMING_SOON_NETWORKS_FOR_MY_EARNINGS_CLASSIC
    : COMING_SOON_NETWORKS_FOR_MY_EARNINGS

  const networkList = SUPPORTED_NETWORKS_FOR_MY_EARNINGS.filter(item => !comingSoonList.includes(item))

  const selectedChains = useSelector((state: AppState) => state.myEarnings.selectedChains)

  const isValidNetwork = networkList.includes(chainId)

  const handleClickCurrentChain = () => {
    if (!isValidNetwork) {
      return
    }

    mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_CURRENT_CHAIN_BUTTON)
    dispatch(selectChains([chainId]))
  }

  const handleChangeChains = (chains: ChainId[]) => {
    dispatch(selectChains(chains))
  }

  return (
    <Flex
      flexDirection={upToExtraSmall ? 'column' : 'row'}
      alignItems={upToExtraSmall ? 'flex-start' : 'center'}
      justifyContent="space-between"
      sx={{
        gap: '0.75rem',
      }}
    >
      <Flex alignItems="center" sx={{ gap: '12px' }} width={upToExtraSmall ? '100%' : undefined}>
        <Text fontSize="14px" fontWeight="500" color={theme.subText}>
          <Trans>Earning Charts</Trans>
        </Text>
        <OnOff onClick={toggleEarningChart} role="button">
          <Item isActive={isShowEarningChart}>On</Item>
          <Item isActive={!isShowEarningChart}>Off</Item>
        </OnOff>
      </Flex>
      <Flex sx={{ gap: '0.75rem' }} width={upToExtraSmall ? '100%' : undefined}>
        <ButtonOutlined
          onClick={handleClickCurrentChain}
          disabled={!isValidNetwork}
          padding="0 16px"
          style={{
            height: '36px',
            flex: upToExtraSmall ? 1 : '0 0 fit-content',
          }}
        >
          <Trans>Current Chain</Trans>
        </ButtonOutlined>

        <MultipleChainSelect
          style={{ height: 36 }}
          handleChangeChains={handleChangeChains}
          comingSoonList={comingSoonList}
          chainIds={SUPPORTED_NETWORKS_FOR_MY_EARNINGS}
          selectedChainIds={selectedChains}
          onTracking={() => mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_ALL_CHAINS_BUTTON)}
        />
      </Flex>
    </Flex>
  )
}

export default ChainSelect
