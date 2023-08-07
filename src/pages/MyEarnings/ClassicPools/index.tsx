import { Trans, t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetClassicEarningQuery } from 'services/earning'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { useAppSelector } from 'state/hooks'

import { WIDTHS } from '../constants'
import SinglePool from './SinglePool'

const Header = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  padding: 16px 12px;
  font-size: 12px;
  font-weight: 500;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  display: grid;
  grid-template-columns: 3fr 2fr repeat(6, 1.3fr);
`

const ClassicPools = () => {
  const { account = '' } = useActiveWeb3React()
  const selectedChainIds = useAppSelector(state => state.myEarnings.selectedChains)
  const classicEarningQueryResponse = useGetClassicEarningQuery({ account, chainIds: selectedChainIds })
  const data = classicEarningQueryResponse.data

  const tabletView = useMedia(`(max-width: ${WIDTHS[3]}px)`)
  const mobileView = useMedia(`(max-width: ${WIDTHS[2]}px)`)
  const theme = useTheme()

  const renderPools = () => {
    if (!data || Object.keys(data).every(key => !data[key]?.positions?.length)) {
      return (
        <Text padding="1.5rem" textAlign="center">
          <Trans>No liquidity found</Trans>
        </Text>
      )
    }

    return Object.keys(data).map(chainRoute => {
      const chainId = chainIdByRoute[chainRoute]
      const poolEarnings = data[chainRoute].positions

      return (
        <>
          {poolEarnings.map(poolEarning => {
            return <SinglePool key={`${chainId}-${poolEarning.id}`} chainId={chainId} poolEarning={poolEarning} />
          })}
        </>
      )
    })
  }

  return (
    <Flex
      flexDirection="column"
      sx={{
        border: tabletView ? undefined : `1px solid ${theme.border}`,
        borderRadius: '1rem',
        gap: tabletView && !mobileView ? '1rem' : undefined,
      }}
    >
      {!tabletView && (
        <Header>
          <Text>
            <Trans>Pool | AMP</Trans>
          </Text>
          <Text>AMP Liquidity | TVL</Text>
          <Text>
            APR
            <InfoHelper
              text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm`}
            />
          </Text>
          <Text>
            <Trans>Volume (24h)</Trans>
          </Text>
          <Text>
            <Trans>Fees (24h)</Trans>
          </Text>
          <Text>
            <Trans>My Liquidity</Trans>
          </Text>
          <Text>
            <Trans>My Earnings</Trans>
          </Text>
          <Text textAlign="right">
            <Trans>Actions</Trans>
          </Text>
        </Header>
      )}

      {renderPools()}
    </Flex>
  )
}

export default ClassicPools
