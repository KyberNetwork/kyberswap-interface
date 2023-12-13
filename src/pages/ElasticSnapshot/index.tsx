import { ChainId } from '@kyberswap/ks-sdk-core'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import DoubleCurrencyLogo from 'components/DoubleLogo'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import data from './data.json'

const Wrapper = styled.div`
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.subText};
  line-height: 1.5;
  font-size: 14px;
  text-align: center;
  overflow-x: scroll;
`

const OverFlow = styled.div`
  min-width: 860px;
  overflow-x: scroll;
`

const TableHeader = styled.div`
  display: grid;
  font-size: 12px;
  grid-template-columns: 1fr 0.75fr 1fr 1fr;
  font-weight: 500;
  padding: 1rem;
  background: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  align-items: center;
`
const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 14px;
`

export default function ElasticSnapshot() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const userInfo = data.find(item => item.user_address.toLowerCase() === account?.toLowerCase())

  if (!userInfo) return null

  const format = (value: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })
  return (
    <PoolsPageWrapper>
      <Flex justifyContent="space-between" sx={{ gap: '1rem' }}>
        <Flex flexDirection="column" sx={{ gap: '12px' }} flex={3}>
          <Text as="h2" fontSize={24} fontWeight="500">
            Snapshot
          </Text>
          <Text fontSize={14} color={theme.subText}>
            You can find the list of your liquidity positions in KyberSwap Elastic pools that were affected by the
            exploit below.
          </Text>
          <ExternalLink href="/">
            <Text fontSize="14px">Official announcement is here ↗</Text>
          </ExternalLink>
        </Flex>

        <Flex flex={2} flexDirection="column" sx={{ gap: '12px', maxWidth: '470px' }}>
          <Flex justifyContent="space-between">
            <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
              <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                Your Total
                <br />
                Amount (USD)
              </Text>
              <Text fontWeight="500" fontSize={14}>
                {format(userInfo.total_usd)}
              </Text>
            </Flex>

            <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
              <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                Your Total Liquidity
                <br />
                Amount (USD)
              </Text>
              <Text fontWeight="500" fontSize={14}>
                {format(userInfo.total_liquidity_usd)}
              </Text>
            </Flex>

            <Flex flexDirection="column" sx={{ gap: '24px' }} padding="12px" flex={1}>
              <Text fontSize="10px" fontWeight="500" color={theme.subText}>
                Your Total Fees
                <br />
                Amount (USD)
              </Text>
              <Text fontWeight="500" fontSize={14}>
                {format(userInfo.total_fee_usd)}
              </Text>
            </Flex>
          </Flex>
          <Text color={theme.subText} fontStyle="italic" fontSize="10px" textAlign="right">
            Your Total Amount (USD) = Your Total Liquidity Amount (USD) + Your Total Fees Amount (USD)
          </Text>
        </Flex>
      </Flex>
      <Flex flexDirection="column" marginTop="1.5rem">
        <Wrapper>
          <OverFlow>
            <Text textAlign="left" fontSize="14px" padding="16px 24px">
              Wallet address:{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                {account}
              </Text>
            </Text>

            <TableHeader>
              <Text textAlign="left">Pools</Text>
              <Text textAlign="right">NFT ID</Text>

              <Text textAlign="right">POSITION LIQUIDITY (USD)</Text>
              <Text textAlign="right">POSITION FEE (USD)</Text>
            </TableHeader>

            {userInfo.positions.map(item => (
              <TableRow key={item.position_id}>
                <Flex>
                  <Logo
                    address0={item.info.token0}
                    address1={item.info.token1}
                    chainId={chainToChainId[item.info.chain]}
                  />
                  {item.info.pair}
                </Flex>
                <Text textAlign="right">#{item.position_id}</Text>

                <Text textAlign="right">{format(item.position_usd)}</Text>
                <Text textAlign="right">{format(item.fee_usd)}</Text>
              </TableRow>
            ))}
          </OverFlow>
        </Wrapper>
      </Flex>
    </PoolsPageWrapper>
  )
}

const chainToChainId: { [key: string]: ChainId } = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
  cronos: 25,
  polygon: 137,
}
const Logo = ({ chainId, address0, address1 }: { chainId: ChainId; address0: string; address1: string }) => {
  const allTokens = useAllTokens(true, chainId)

  return (
    <Box sx={{ position: 'relative' }}>
      <DoubleCurrencyLogo
        size={20}
        currency0={allTokens[address0.toLowerCase()]}
        currency1={allTokens[address1.toLowerCase()]}
      />

      <img
        src={NETWORKS_INFO[chainId].icon}
        style={{ position: 'absolute', bottom: 0, right: '4px', zIndex: 1 }}
        width="12px"
        height="12px"
        alt=""
      />
    </Box>
  )
}
